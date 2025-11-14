// Vue 单文件组件类型声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// @vben/common-ui 类型声明（最小声明满足当前使用）
declare module '@vben/common-ui' {
  export const Page: any;
  export function useVbenForm(...args: any[]): any[];
  export type VbenFormSchema = any;
}

// 兜底声明，避免 @vben 子包类型缺失造成的报错
declare module '@vben/*' {
  const anyExport: any;
  export default anyExport;
}

// 路径别名下的核心 API 出口，供类型检查使用
declare module '#/api/core' {
  export const requestClient: any;
  export const baseRequestClient: any;
  export function generateAccessCredentialApi(payload: any): Promise<any>;
  export function getAccessCredentialApi(payload: any): Promise<any>;
  // 瞬态调速率检测 API 的最小类型声明（供 TS 使用）
  export function stabilityCheckApi(payload: any): Promise<any>;
  // 追加：瞬态电压变化检测 API 的最小类型声明
  export function transientVoltageCheckApi(payload: any): Promise<any>;
  // 追加：DCU 设备监控开关命令的最小类型声明
  export function sendDcuDeviceMonitoringCommandApi(payload: { experimentId: string; state: 0 | 1 }): Promise<any>;
  // 历史列表查询 API 的最小类型声明
  export function getHistoryListApi(params: any): Promise<any>;
  // 返回静态指令（倒计时弹窗中使用）
  export function returnStaticCommand(payload: { experimentId: string }): Promise<any>;
}

// 路径别名 '#/api' 的类型声明，映射到 src/api 的导出
declare module '#/api' {
  export * from './api';
}

// 扩展 '#/api' 的最小类型声明，显式包含 DCU 相关导出，避免 IDE 报错
declare module '#/api' {
  export function getDcuDeviceListApi(payload: any): Promise<any>;
  export function enableDcuDeviceApi(payload: { id: string; experimentId: string }): Promise<any>;
  export function getDcuDeviceDetailListApi(payload: { id: string }): Promise<any>;
}

// Vue <script setup> 宏的最小类型声明，避免 IDE 报错
declare const defineProps: <T>() => T;
declare const withDefaults: <T, U>(props: T, defaults: U) => T;
declare const defineExpose: (exposed: Record<string, any>) => void;
declare const defineEmits: <T = any>(events?: T) => any;

// 细化 @vben/plugins/echarts 的类型声明，支持命名导出
declare module '@vben/plugins/echarts' {
  export type EchartsUIType = any;
  export const EchartsUI: any;
  export function useEcharts(chartRef: any): {
    renderEcharts: (options: any, clear?: boolean) => Promise<any>;
    resize: () => void;
    getChartInstance: () => any;
  };
}

// 追加：路径别名最小类型声明，避免 IDE 报错
declare module '#/adapter/vxe-table' {
  export type VxeGridProps<T = any> = any;
  export function useVbenVxeGrid(options: any): any[];
}

// 追加：表单适配器的最小类型声明，避免 IDE 报错
declare module '#/adapter/form' {
  export type VbenFormProps = any;
  export type VbenFormSchema = any;
}

declare module '#/composables/useDataCollector' {
  export function useDataCollector(): {
    registerCollector: (collector: any) => void;
    unregisterCollector: (id: string) => void;
    executeSyncQueue: () => Promise<boolean>;
  };
}

// 本地实验存储工具的最小类型声明
declare module '#/composables/useExperimentStorage' {
  export const EXPERIMENT_STORAGE_KEY: string;
  export interface ExperimentStorageData {
    experimentNo: string;
    id: string;
    status?: number;
  }
  export function saveExperimentToStorage(
    experimentNo: string,
    id: string,
    status: number,
  ): void;
  export function getExperimentFromStorage(): ExperimentStorageData | null;
  export function clearExperimentFromStorage(): void;
  export function getLocalExperimentId(): string | null;
  export function getLocalExperimentStatus(): number | null;
  export function setLocalExperimentStatus(status: number): void;
}

declare module '#/store/experiment' {
  export function useExperimentStore(): {
    state: any;
    updateTransientVoltageChangeList: (data: any) => void;
    updateTransientSpeedRegulationList: (data: any) => void;
    updateExperimentSettings: (data: any) => void;
    // 补充缺失的动作，避免编辑器类型误报
    updateLoadTestReport: (data: any) => void;
    submitExperimentData: () => Promise<void>;
  };
}

declare module '#/composables/useUserRole' {
  export function useUserRole(): {
    isAdmin?: boolean;
    role?: string;
  };
}

declare module '#/store/websocket' {
  // 与实际 store/websocket.ts 中定义保持一致
  export enum WebSocketMessageType {
    // 实验数据相关消息
    EXPERIMENT = 'experiment',
    MONITORING = 'monitoring',
    TRANSIENT_SPEED = 'transientSpeed',
    TRANSIENT_VOLTAGE = 'transientVoltage',
    VOLTAGE_MODULATION = 'voltageModulation',
    CHECK_STARTUP = 'checkStartup',
    INTEGRATED_EXPERIMENT = 'integratedExperiment',

    // 系统消息
    SYSTEM_NOTIFICATION = 'system_notification',
    EXPERIMENT_STATUS_CHANGE = 'experiment_status_change',
    USER_ONLINE_STATUS = 'user_online_status',
    HEARTBEAT = 'heartbeat',
  }
  export function useWebSocketStore(): {
    registerMessageListener: (type: WebSocketMessageType, handler: (payload: any) => void) => void;
    unregisterMessageListener: (type: WebSocketMessageType, handler: (payload: any) => void) => void;
  };
}

// 根路径别名 '#/store' 的类型声明，映射到 src/store 的导出
declare module '#/store' {
  export * from './store';
}

// 追加：为个别编辑器环境补充 vue 组合式 API 的最小导出声明
// 避免在特定文件中出现命名导出误报（computed/ref/watch/nextTick/onMounted/onUnmounted）
declare module 'vue' {
  export function computed<T = any>(getter: any): any;
  export function ref<T = any>(value?: T): any;
  export function reactive<T extends object>(value: T): T;
  export function watch(source: any, cb: any, options?: any): any;
  export function nextTick(cb?: any): Promise<any>;
  export function onMounted(hook: (...args: any[]) => any): void;
  export function onUnmounted(hook: (...args: any[]) => any): void;
  // 补充常用类型与方法，避免 SFC 组件导入默认导出误报
  export type DefineComponent<Props = any, Events = any, Slots = any> = any;
  export function defineAsyncComponent(loader: any): any;
}

// 追加补充声明：缺失的导出在此合并，避免 IDE 报错
declare module '#/adapter/form' {
  export function useVbenForm(options?: any): [any, any];
}

declare module '#/api' {
  export function deleteDcuDeviceDetailApi(params: { id: string }): Promise<any>;
  export function addDcuDeviceApi(payload: any): Promise<any>;
  export function updateDcuDeviceDetailApi(payload: any): Promise<any>;
  
  export function getDcuDeviceConnectionFieldListApi(payload: any): Promise<any>;
}