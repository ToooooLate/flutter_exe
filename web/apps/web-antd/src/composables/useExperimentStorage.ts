// 实验ID本地化存储工具（公共方法）
// 提供保存、读取、清除三个方法，便于各页面复用

export const EXPERIMENT_STORAGE_KEY = 'current_experiment_data';
export const EXPERIMENT_STATUS_EVENT = 'experiment-status-changed';

/**
 * 触发实验状态变更事件，供页面内响应式监听
 */
const emitExperimentStatus = (status: number | null) => {
  try {
    window.dispatchEvent(
      new CustomEvent(EXPERIMENT_STATUS_EVENT, {
        detail: { status },
      }),
    );
  } catch (e) {
    // SSR 或非浏览器环境安全退出
  }
};

export interface ExperimentStorageData {
  experimentNo: string;
  id: string;
  status: number; //实验状态：0-进行中，1-已结束，2-已废弃
}

export const saveExperimentToStorage = (
  experimentNo: string,
  id: string,
  status: number,
) => {
  const data: ExperimentStorageData = { experimentNo, id, status };
  localStorage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(data));
  emitExperimentStatus(status);
};

export const getExperimentFromStorage = (): ExperimentStorageData | null => {
  try {
    const data = localStorage.getItem(EXPERIMENT_STORAGE_KEY);
    return data ? (JSON.parse(data) as ExperimentStorageData) : null;
  } catch (error) {
    console.error('读取本地实验数据失败:', error);
    return null;
  }
};

export const clearExperimentFromStorage = () => {
  localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
  emitExperimentStatus(null);
};

// 获取本地当前实验ID
export const getLocalExperimentId = (): string | null => {
  const data = getExperimentFromStorage();
  return data?.id ?? null;
};

// 获取本地当前实验状态（0-进行中，1-已结束，2-已废弃）
export const getLocalExperimentStatus = (): number | null => {
  const data = getExperimentFromStorage();
  return data?.status ?? null;
};

// 更新本地实验状态（仅在已有实验数据时更新）
export const setLocalExperimentStatus = (status: number) => {
  const data = getExperimentFromStorage();
  if (!data) return;
  data.status = status;
  localStorage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(data));
  emitExperimentStatus(status);
};

// 判断消息是否属于当前实验（如果本地或消息缺少ID，则默认拦截）
export const isSameExperimentId = (
  incomingId: string | number | null | undefined,
): boolean => {
  const localId = getLocalExperimentId();
  if (incomingId == null || !localId) return false;
  return String(incomingId) === String(localId);
};