<script setup lang="ts">
// @ts-nocheck
import { watch, onMounted, computed, ref } from 'vue';

// @ts-ignore
import { Page } from '@vben/common-ui';

import { Card, Button, Tabs, TabPane, Popover, Modal } from 'ant-design-vue';
import { onBeforeRouteLeave } from 'vue-router';

import { useCurrentExperiment } from './hooks';
// @ts-ignore
import ExperimentSettings from './components/ExperimentSettings.vue';
// @ts-ignore
import { useVbenModal } from '@vben/common-ui';
// @ts-ignore
import CredentialModalContent from './components/CredentialModalContent.vue';
// @ts-ignore
import RealtimeData from './components/RealtimeData.vue';
// 本地实验存储状态与清理方法
// @ts-ignore
import {
  getLocalExperimentStatus,
  clearExperimentFromStorage,
} from '#/composables/useExperimentStorage';

import { useRefresh } from '@vben/hooks';
import { useI18n } from '@vben/locales';

const { refresh } = useRefresh();
const { t } = useI18n();

// 实验组件静态导入（预加载）
// @ts-ignore
import TestEnvironment from './components/TestEnvironment.vue';
// @ts-ignore
import AppearanceInspection from './components/AppearanceInspection.vue';
// @ts-ignore
import ColdInsulationTest from './components/ColdInsulationTest.vue';
// @ts-ignore
import StartupPerformanceTest from './components/StartupPerformanceTest.vue';
// @ts-ignore
import OperationInspection from './components/OperationInspection.vue';
// @ts-ignore
import ProtectionDeviceTest from './components/ProtectionDeviceTest.vue';
// @ts-ignore
// @ts-ignore
import TransientTest from './components/transient/TransientTest.vue';
// @ts-ignore
import HotInsulationTest from './components/HotInsulationTest.vue';
// @ts-ignore
import ComprehensiveExperiment from './components/comprehensive/ComprehensiveExperiment.vue';

import { useUserRole } from '#/composables/useUserRole';

const { isEngineer } = useUserRole();

const {
  experimentNo,
  hasCredential,
  credentialModalOpen,
  accessCredential,
  isSettingsExpanded,
  experimentButtons,
  updateButtonStates,
  setCredentialButtonLabel,
  handleButtonClick,
  copyCredentialAll,
  copyText,
  activeTab,
  activeMonitorTab,
  experimentTabs,
  monitorTabs,
  handleTabChange,
  handleMonitorTabChange,
  experimentStore,
  initializeExperimentData,
  extendAccessDuration,
} = useCurrentExperiment();

// 安全的实验编号与ID（避免模板中的可选链导致解析错误）
const safeExperimentNo = computed(() => {
  const current = experimentStore.state.currentExperiment as any;
  return current && current.experimentNo ? ` - ${current.experimentNo}` : '';
});

// 是否仅显示“初始化”按钮（当本地状态不是进行中：status !== 0）
const localStatus = ref<number | null>(getLocalExperimentStatus());
const isPendingOrInit = computed(
  () => localStatus.value === 0 || localStatus.value === null,
);

function handleInitialize() {
  clearExperimentFromStorage();
  // 清除当前实验数据
  localStatus.value = null;
  experimentStore.clearCurrentExperiment();
  updateButtonStates();
  refresh();
}

// 使用 Vben 模态框替代 antd Modal，并抽离内容组件
const [CredentialModal, credentialModal] = useVbenModal({
  title: t('experiment.current.credential.viewTitle'),
  footer: false,
  onOpenChange: (isOpen: boolean) => {
    credentialModalOpen.value = isOpen;
  },
});

// 同步 hooks 中的打开状态到 Vben Modal
watch(
  () => credentialModalOpen.value,
  (isOpen) => {
    credentialModal.setState?.({ isOpen });
  },
);

// 组件映射表
const componentMap = {
  environment: TestEnvironment,
  appearance: AppearanceInspection,
  'cold-insulation': ColdInsulationTest,
  startup: StartupPerformanceTest,
  operation: OperationInspection,
  protection: ProtectionDeviceTest,
  comprehensive: ComprehensiveExperiment,
  transient: TransientTest,
  'hot-insulation': HotInsulationTest,
};

// 页面初始化时检查本地存储并恢复实验数据
onMounted(async () => {
  await initializeExperimentData();
});

// 离开页面时弹窗提示是否提交数据
onBeforeRouteLeave((to, from, next) => {
  // 仅在实验进行中且数据有变更时提示
  if (getLocalExperimentStatus() === 0) {
    try {
      Modal.confirm({
        title: t('experiment.current.leaveConfirm.title'),
        content: t('experiment.current.leaveConfirm.content'),
        okText: t('experiment.current.leaveConfirm.okText'),
        cancelText: t('experiment.current.leaveConfirm.cancelText'),
        async onOk() {
          try {
            // 复用数据同步按钮的完整逻辑
            await handleButtonClick('sync');
          } catch (e) {
            // 同步失败也继续跳转，避免阻塞离开
          } finally {
            next();
          }
        },
        onCancel() {
          next();
        },
      });
    } catch (e) {
      // 兜底：弹窗异常时直接放行
      next();
    }
  } else next();
});
</script>

<template>
  <Page>
    <template #title>
      <div class="flex w-full items-center justify-between">
        <span>
          {{ $t('experiment.current.comprehensive.loadTitle')
          }}{{ safeExperimentNo }}
        </span>
        <template v-if="isEngineer">
          <div class="flex gap-2" v-if="isPendingOrInit">
            <span v-for="button in experimentButtons" :key="button.key">
              <Popover
                v-if="button.key === 'credential' && hasCredential"
                placement="bottomRight"
              >
                <template #content>
                  <CredentialModalContent
                    :access-credential="accessCredential"
                    :copy-text="copyText"
                    :copy-credential-all="copyCredentialAll"
                    @extend="extendAccessDuration"
                  />
                </template>
                <Button
                  :type="button.type"
                  :disabled="button.disabled"
                  :danger="button.danger"
                  @click="handleButtonClick(button.key)"
                >
                  {{ button.label }}
                </Button>
              </Popover>
              <Button
                v-else
                :type="button.type"
                :disabled="button.disabled"
                :danger="button.danger"
                @click="handleButtonClick(button.key)"
              >
                {{ button.label }}
              </Button>
            </span>
          </div>
          <div class="flex gap-2" v-else>
            <Button type="primary" @click="handleInitialize">{{
              $t('experiment.current.buttons.initialize')
            }}</Button>
          </div>
        </template>
      </div>
    </template>

    <!-- 内容区域，内部滚动 -->
    <div class="max-h-[calc(100vh-180px)] overflow-auto">
      <!-- 实验设置 -->
      <ExperimentSettings
        :expanded="isSettingsExpanded"
        @update:expanded="isSettingsExpanded = $event"
        class="mb-4"
      />

      <!-- 左右布局 -->
      <div class="mb-6 flex min-w-0 gap-4">
        <!-- 左侧实验模块 (占满剩余空间) -->
        <Card class="min-w-0 flex-1">
          <Tabs
            :activeKey="activeTab"
            :destroyInactiveTabPane="false"
            @change="handleTabChange"
          >
            <TabPane
              v-for="tab in experimentTabs"
              :key="tab.key"
              :tab="tab.label"
              :force-render="true"
            >
              <div class="min-h-[400px] overflow-hidden">
                <KeepAlive>
                  <component :is="componentMap[tab.key]" :key="tab.key" />
                </KeepAlive>
              </div>
            </TabPane>
          </Tabs>
        </Card>

        <!-- 右侧监控模块 (25%固定宽度) -->
        <Card class="w-1/4 min-w-0 flex-shrink-0">
          <Tabs :activeKey="activeMonitorTab" @change="handleMonitorTabChange">
            <TabPane v-for="tab in monitorTabs" :key="tab.key" :tab="tab.label">
              <div class="min-h-[400px] overflow-hidden">
                <div v-if="tab.key === 'realtime'" class="min-h-[400px]">
                  <RealtimeData />
                </div>
                <div
                  v-else-if="tab.key === 'monitoring'"
                  class="text-center text-gray-500"
                >
                  {{ $t('experiment.current.monitoring.contentPlaceholder') }}
                </div>
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
    <!-- 访问凭证弹窗（Vben Modal） -->
    <CredentialModal>
      <CredentialModalContent
        :access-credential="accessCredential"
        :copy-text="copyText"
        :copy-credential-all="copyCredentialAll"
        @extend="extendAccessDuration"
      />
    </CredentialModal>
  </Page>
</template>
