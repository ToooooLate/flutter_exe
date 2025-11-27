<script lang="ts" setup>
/// <reference types="vue/macros" />
// @ts-ignore lifecycle typing workaround in current env
import { ref, watch, onUnmounted, computed } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Button, Progress, message as antMessage } from 'ant-design-vue';
import { returnStaticCommand } from '#/api/core/experiment';
import { useExperimentStore } from '#/store/experiment';
import { useI18n } from '@vben/locales';

interface CountdownModalProps {
  countdownSeconds?: number;
  title?: string;
  message?: string;
  showReturnButton?: boolean;
  onReturnStatic?: () => Promise<void>;
}

const props = withDefaults(defineProps<CountdownModalProps>(), {
  countdownSeconds: 10,
  title: undefined,
  message: undefined,
  showReturnButton: true,
});

const emit = defineEmits<{
  'countdown-end': [];
  'return-static': [];
}>();

// 响应式状态
const remainingTime = ref(props.countdownSeconds);
const isReturning = ref(false);
let timer: number | null = null;

// 实验状态管理
const experimentStore = useExperimentStore();
const { t } = useI18n();

// 标题与消息国际化（支持外部覆盖）
const modalTitle = computed(() => props.title ?? t('experiment.current.modal.countdown.title'));
const modalMessage = computed(() => props.message ?? t('experiment.current.modal.countdown.message'));
const returnButtonLabel = computed(() =>
  isReturning.value
    ? t('experiment.current.modal.countdown.processing')
    : t('experiment.current.modal.countdown.returnStatic'),
);

const formatCountdown = () => `${remainingTime.value}${t('experiment.current.common.seconds')}`;

// 计算进度百分比（从100%递减到0%）
const progressPercent = computed(() => {
  return Math.round((remainingTime.value / props.countdownSeconds) * 100);
});

// 使用 Vben Modal
const [Modal, modalApi] = useVbenModal({
  closable: false,
  maskClosable: false,
  keyboard: false,
  footer: null,
  fullscreenButton: false,
  closeOnClickModal: false,
  closeOnPressEscape: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      remainingTime.value = props.countdownSeconds;
      startCountdown();
    } else {
      stopCountdown();
    }
  },
});

// 开始倒计时
const startCountdown = () => {
  stopCountdown(); // 清除之前的定时器

  if (remainingTime.value <= 0) {
    handleCountdownEnd();
    return;
  }

  timer = window.setInterval(() => {
    remainingTime.value--;

    if (remainingTime.value <= 0) {
      handleCountdownEnd();
    }
  }, 1000);
};

// 停止倒计时
const stopCountdown = () => {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
};

// 倒计时结束处理
const handleCountdownEnd = () => {
  stopCountdown();
  emit('countdown-end');

  // 关闭弹窗
  modalApi.close();
};

// 返回静态按钮处理
const handleReturnStatic = async () => {
  const res = await returnStaticCommand({
    experimentId: experimentStore.state.currentExperiment?.id || '',
  });
  if (res) {
    antMessage.success(t('experiment.current.modal.countdown.returnStaticSent'));
    modalApi.close();
  }
};

// 监听倒计时变化
watch(
  () => props.countdownSeconds,
  (newValue) => {
    remainingTime.value = newValue;
  },
);

// 组件卸载时清理定时器
onUnmounted(() => {
  stopCountdown();
});

// 暴露 API 方法
const open = () => modalApi.open();
const close = () => modalApi.close();

// 使用 defineExpose 暴露方法
defineExpose({
  open,
  close,
});
</script>

<template>
  <Modal :title="modalTitle" class="countdown-modal w-[400px]">
    <div class="py-5 text-center">
      <!-- 倒计时显示区域 -->
      <div class="mb-6 flex items-center justify-center">
        <Progress
          type="circle"
          :percent="progressPercent"
          :size="120"
          :stroke-width="8"
          stroke-color="#1890ff"
          trail-color="#f0f0f0"
          :format="formatCountdown"
          :show-info="true"
        />
      </div>

      <!-- 提示信息 -->
      <div class="mb-6 flex min-h-[48px] items-center justify-center">
        <p class="text-center text-gray-600">{{ modalMessage }}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-3" v-if="showReturnButton">
        <Button
          type="primary"
          danger
          :loading="isReturning"
          @click="handleReturnStatic"
          class="min-w-[120px]"
        >
          {{ returnButtonLabel }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
/* 所有样式已使用 Tailwind CSS 实现，无需额外 CSS */
</style>
