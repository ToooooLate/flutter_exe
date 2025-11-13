import { requestClient } from '#/api/request';

export namespace ExperimentApi {
  /** 实验基本信息 */
  export interface ExperimentInfo {
    id: string;
    name: string;
    description?: string;
    type: 'load-test' | 'frequency-wave' | 'performance' | 'other';
    status: 'pending' | 'running' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    engineId?: string;
  }

  /** 实验列表查询参数 */
  export interface ExperimentListParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    type?: string;
    status?: string;
    engineId?: string;
  }

  /** 实验列表返回结果 */
  export interface ExperimentListResult {
    items: ExperimentInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 创建实验参数 */
  export interface CreateExperimentParams {
    name: string;
    description?: string;
    type: 'load-test' | 'frequency-wave' | 'performance' | 'other';
    engineId?: string;
    config?: Record<string, any>;
  }

  /** 更新实验参数 */
  export interface UpdateExperimentParams {
    name?: string;
    description?: string;
    status?: 'pending' | 'running' | 'completed' | 'failed';
    config?: Record<string, any>;
  }

  /** 实验结果数据 */
  export interface ExperimentResult {
    id: string;
    experimentId: string;
    data: Record<string, any>;
    metrics: {
      name: string;
      value: number;
      unit: string;
      timestamp: string;
    }[];
    createdAt: string;
  }
}

/**
 * 获取实验列表
 */
export async function getExperimentListApi(params?: ExperimentApi.ExperimentListParams) {
  return requestClient.get<ExperimentApi.ExperimentListResult>('/api/experiments', {
    params,
  });
}

/**
 * 获取实验详情
 */
export async function getExperimentDetailApi(id: string) {
  return requestClient.get<ExperimentApi.ExperimentInfo>(`/api/experiments/${id}`);
}

/**
 * 创建实验
 */
export async function createExperimentApi(data: ExperimentApi.CreateExperimentParams) {
  return requestClient.post<ExperimentApi.ExperimentInfo>('/api/experiments', data);
}

/**
 * 更新实验
 */
export async function updateExperimentApi(id: string, data: ExperimentApi.UpdateExperimentParams) {
  return requestClient.put<ExperimentApi.ExperimentInfo>(`/api/experiments/${id}`, data);
}

/**
 * 删除实验
 */
export async function deleteExperimentApi(id: string) {
  return requestClient.delete(`/api/experiments/${id}`);
}

/**
 * 启动实验
 */
export async function startExperimentApi(id: string) {
  return requestClient.post<{ message: string }>(`/api/experiments/${id}/start`);
}

/**
 * 获取实验结果
 */
export async function getExperimentResultApi(id: string) {
  return requestClient.get<ExperimentApi.ExperimentResult>(`/api/experiments/${id}/result`);
}

/**
 * 导出实验数据
 */
export async function exportExperimentDataApi(id: string, format: 'csv' | 'json' | 'excel' = 'csv') {
  return requestClient.get(`/api/experiments/${id}/export`, {
    params: { format },
    responseType: 'blob',
  });
}

/**
 * 生成实验编号
 */
export async function generateExperimentNumApi() {
  return requestClient.post('/api/sg/experiment/add');
}

/**
 * 更新实验数据
 */
export async function updateExperimentDataApi(data: any) {
  return requestClient.post<ExperimentApi.ExperimentInfo>(`/api/sg/experiment/update`, data);
}

/**
 * 删除实验数据
 */
export async function deleteExperimentDataApi(id: string) {
  return requestClient.get(`/api/sg/experiment/delete?id=${id}`);
}

/**
 * 下发电压调制指令
 */
export async function sendVoltageModulationCommandApi(data: { experimentId: string,serialNumber: number }) {
  return requestClient.post(`/api/sg/command/voltageModulation`,  data );
}

/**
 * 机组运行检测定
 */
export async function checkStartupApi(data: { experimentId: string,serialNumber: number }) {
  return requestClient.post(`/api/sg/command/checkStartup`,  data );
}

/**
 * 根据ID查询实验详情（使用请求参数id）
 */
export async function getExperimentDetailByIdApi(params: { id: string, isNewExperiment?: boolean }) {
  return requestClient.get(`/api/sg/experiment/getById`, { params } );
}

/**
 * 实验返回静态指令
 */
export async function returnStaticCommand(data: { experimentId: string }) {
  return requestClient.post(`/api/sg/command/returnStatic`, data);
}

/**
 * 集成检测
 */
export async function integratedCheckApi(data: any) {
  return requestClient.post(`/api/sg/command/integrated`,  data );
}

/**
 * 瞬态调速率检测
 */
export async function stabilityCheckApi(data: any) {
  return requestClient.post(`/api/sg/command/stability`,  data );
}

/**
 * 瞬态电压检测
 */
export async function transientVoltageCheckApi(data: any) {
  return requestClient.post(`/api/sg/command/transientSpeed`,  data );
}