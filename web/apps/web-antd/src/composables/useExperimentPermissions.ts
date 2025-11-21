import { useAccessStore } from '@vben/stores';
import { ref } from 'vue';
import {
  getLocalExperimentStatus,
  EXPERIMENT_STATUS_EVENT,
} from '#/composables/useExperimentStorage';

/**
 * 判断是否可以编辑：
 * 满足权限 `AC_200120` 且实验状态为进行中（status === 0）
 */
// 响应式跟踪实验状态：来自本地存储并监听变更事件
const experimentStatus = ref<number | null>(getLocalExperimentStatus());

// 监听实验状态变化事件，使权限判断具备响应性
try {
  window.addEventListener(EXPERIMENT_STATUS_EVENT, (e: Event) => {
    const detail = (e as CustomEvent).detail as any;
    experimentStatus.value = detail?.status ?? null;
  });
} catch (e) {
  // SSR 或非浏览器环境下无需处理
}

export function canEditTable(): boolean {
  const accessStore = useAccessStore();
  const hasPermission = (accessStore?.accessCodes ?? []).includes('AC_200120');
  return hasPermission && experimentStatus.value === 0;
}