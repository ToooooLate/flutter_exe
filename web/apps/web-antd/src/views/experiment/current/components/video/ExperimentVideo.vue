<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { useI18n } from '@vben/locales';
import { useCurrentExperiment } from '../../hooks';
import { Button, QRCode, Modal } from 'ant-design-vue';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { useUserStore } from '#/store/user';

const { t } = useI18n();
const { experimentNo, experimentStore } = useCurrentExperiment();
const userStore = useUserStore();

// 统一的房间名：优先本 hooks 的 experimentNo，其次从全局 store 读取
const roomNameRef = computed(() => {
  const storeNo =
    (experimentStore.state.currentExperiment as any)?.experimentNo || '';
  return experimentNo.value || storeNo || '';
});

// 当前登录用户显示名（使用用户名）
const displayNameRef = computed(() => {
  return userStore.userInfo?.username || '';
});

// Jitsi 服务域名（含端口）
// const JITSI_DOMAIN = 'meet.jit.si';
const JITSI_DOMAIN = 'qingzhi.sangoai.com:9443';
const JITSI_EXTERNAL_API_SRC = `https://${JITSI_DOMAIN}/external_api.js`;

// 容器元素
const meetEl = ref<HTMLElement | null>(null);
// Jitsi API 实例
let jitsiApi: any | null = null;
const meetingStarted = ref(false);
const showQr = ref(false);
const meetingEnded = ref(false);

const canEdit = computed(() => canEditTable());

const qrUrlRef = computed(() => {
  if (!roomNameRef.value) return '';
  return `https://${JITSI_DOMAIN}/${roomNameRef.value}`;
});

function loadExternalApiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 已加载则直接继续
    if ((window as any).JitsiMeetExternalAPI) {
      resolve();
      return;
    }
    // 避免重复插入
    const existing = document.querySelector(
      'script#jitsi-external-api',
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'jitsi-external-api';
    script.src = JITSI_EXTERNAL_API_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

function initJitsi(roomName: string) {
  if (!meetEl.value || !roomName) return;
  // 清理旧实例
  if (jitsiApi) {
    try {
      jitsiApi.dispose?.();
    } catch {}
    jitsiApi = null;
  }
  const ExternalAPI = (window as any).JitsiMeetExternalAPI;
  if (!ExternalAPI) return;

  const options = {
    roomName,
    parentNode: meetEl.value,
    userInfo: { displayName: displayNameRef.value },
    configOverwrite: {
      prejoinPageEnabled: false,
      prejoinConfig: {
        enabled: false,
      },
      disableThirdPartyRequests: true,
      startWithAudioMuted: false,
      startWithVideoMuted: true,
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        'microphone',
        'camera',
        'fullscreen',
        'chat',
        'tileview',
        'hangup',
      ],
    },
  };
  jitsiApi = new ExternalAPI(JITSI_DOMAIN, options);

  try {
    if (displayNameRef.value) {
      jitsiApi.executeCommand?.('displayName', displayNameRef.value);
    }
  } catch {}

  jitsiApi.addEventListeners?.({
    videoConferenceJoined: (e: any) => {
      console.log('joined', e);
      meetingEnded.value = false;
      try {
        jitsiApi?.executeCommand?.('startRecording', { mode: 'file' });
      } catch (err) {
        console.error('auto startRecording failed', err);
      }
    },
    videoConferenceLeft: (e: any) => {
      console.log('left', e);
      meetingStarted.value = false;
      meetingEnded.value = true;
      try {
        jitsiApi?.dispose?.();
      } catch {}
      jitsiApi = null;
    },
    participantJoined: (p: any) => console.log('participant joined', p),
    participantLeft: (p: any) => console.log('participant left', p),
  });
}

onMounted(async () => {
  // 可预加载脚本以加快首次启动，但不自动创建会议
  try {
    await loadExternalApiScript();
  } catch (e) {
    console.error('预加载 Jitsi External API 失败:', e);
  }
});

onBeforeUnmount(() => {
  if (jitsiApi) {
    try {
      jitsiApi.dispose?.();
    } catch {}
    jitsiApi = null;
  }
});

// 当实验编号变化时，重建会议
watch(
  () => roomNameRef.value,
  (newRoom) => {
    // 仅在已启动会议的情况下才重建
    if (!newRoom || !meetingStarted.value) return;
    initJitsi(newRoom);
  },
);

// 当用户显示名变化时，在已启动会议中同步更新
watch(
  () => displayNameRef.value,
  (newName) => {
    if (meetingStarted.value && jitsiApi && newName) {
      try {
        jitsiApi.executeCommand?.('displayName', newName);
      } catch {}
    }
  },
);

async function startMeeting() {
  const room = roomNameRef.value;
  if (!room) return;
  try {
    await loadExternalApiScript();
    initJitsi(room);
    meetingStarted.value = true;
  } catch (e) {
    console.error('启动会议失败:', e);
  }
}
</script>

<template>
  <div class="w-full">
    <div class="mb-2 flex items-center justify-between">
      <div class="text-sm text-gray-500">房间：{{ roomNameRef || '-' }}</div>
      <div v-if="canEdit" class="space-x-2">
        <Button type="primary" :disabled="!roomNameRef" @click="startMeeting">
          发起视频
        </Button>
        <Button
          :disabled="!roomNameRef || !meetingStarted"
          @click="showQr = true"
        >
          二维码加入
        </Button>
      </div>
    </div>
    <div ref="meetEl" class="h-[360px] w-full"></div>
    <div v-if="!roomNameRef" class="mt-2 text-center text-gray-500">
      {{ t('experiment.current.monitoring.contentPlaceholder') }}
    </div>
    <Modal
      v-model:open="showQr"
      :footer="null"
      title="扫码加入会议"
      centered
      destroyOnClose
    >
      <div class="flex flex-col items-center">
        <QRCode :value="qrUrlRef as string" :size="192" />
        <div class="mt-2 break-all text-xs text-gray-500">
          {{ qrUrlRef }}
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped></style>
