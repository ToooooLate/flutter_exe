import { requestClient } from '#/api/request';

export namespace HistoryApi {
  /** 历史记录类型 */
  export type HistoryType = 'experiment' | 'operation' | 'system' | 'user';

  /** 历史记录基本信息 */
  export interface HistoryInfo {
    id: string;
    type: HistoryType;
    title: string;
    description?: string;
    content?: string;
    relatedId?: string; // 关联的实体ID（如实验ID、用户ID等）
    relatedType?: string; // 关联的实体类型
    status?: 'success' | 'failed' | 'pending' | 'cancelled';
    createdAt: string;
    createdBy: string;
    metadata?: Record<string, any>; // 额外的元数据
  }

  /** 历史记录列表查询参数 */
  export interface HistoryListParams {
    pageNo?: number;
    pageSize?: number;
    experimentNo?: string; // 实验编号（模糊查询）
    isTemplate?: 0 | 1; // 是否为模板（0-否，1-是）用于筛选模板记录或普通实验记录
    projectName?: string; // 项目名（模糊查询）
    shipNumber?: string; // 船号（模糊查询）
    testPerson?: string; // 测试人员（模糊查询）
    status?: 0 | 1 | 2; // 实验状态（0-进行中，1-已结束，2-已废弃）
    unitModel?: string; // 机组型号（模糊查询）
    unitSerial?: string; // 机组编号（模糊查询）
    createTimeStart?: string; // 创建时间起始
    createTimeEnd?: string; // 创建时间结束
  }

  /** 历史记录列表返回结果 */
  export interface HistoryListResult {
    items: HistoryInfo[];
    total: number;
    pageNo: number;
    pageSize: number;
  }

  /** 创建历史记录参数 */
  export interface CreateHistoryParams {
    type: HistoryType;
    title: string;
    description?: string;
    content?: string;
    relatedId?: string;
    relatedType?: string;
    status?: 'success' | 'failed' | 'pending' | 'cancelled';
    metadata?: Record<string, any>;
  }

  /** 更新历史记录参数 */
  export interface UpdateHistoryParams {
    title?: string;
    description?: string;
    content?: string;
    status?: 'success' | 'failed' | 'pending' | 'cancelled';
    metadata?: Record<string, any>;
  }
}

/**
 * 获取历史记录列表
 */
export async function getHistoryListApi(data: HistoryApi.HistoryListParams = {}) {
  return requestClient.post<HistoryApi.HistoryListResult>('/api/sg/experiment/page',data);
}

/**
 * 根据ID获取历史记录详情
 */
export async function getHistoryByIdApi(id: string) {
  return requestClient.get<HistoryApi.HistoryInfo>(`/api/history/${id}`);
}

/**
 * 创建历史记录
 */
export async function createHistoryApi(data: HistoryApi.CreateHistoryParams) {
  return requestClient.post<HistoryApi.HistoryInfo>('/api/history', data);
}

/**
 * 更新历史记录
 */
export async function updateHistoryApi(id: string, data: HistoryApi.UpdateHistoryParams) {
  return requestClient.put<HistoryApi.HistoryInfo>(`/api/history/${id}`, data);
}

/**
 * 删除历史记录
 */
export async function deleteHistoryApi(id: string) {
  return requestClient.delete(`/api/history/${id}`);
}

/**
 * 批量删除历史记录
 */
export async function batchDeleteHistoryApi(ids: string[]) {
  return requestClient.delete('/api/history/batch', {
    data: { ids },
  });
}

/**
 * 根据关联ID获取历史记录
 */
export async function getHistoryByRelatedIdApi(relatedId: string, relatedType?: string) {
  return requestClient.get<HistoryApi.HistoryInfo[]>(`/api/history/related/${relatedId}`, {
    params: { relatedType },
  });
}

/**
 * 获取用户操作历史
 */
export async function getUserHistoryApi(userId: string, params: Partial<HistoryApi.HistoryListParams> = {}) {
  return requestClient.get<HistoryApi.HistoryListResult>(`/api/history/user/${userId}`, {
    params,
  });
}

/**
 * 清理过期历史记录
 */
export async function cleanExpiredHistoryApi(days: number = 30) {
  return requestClient.delete('/api/history/cleanup', {
    params: { days },
  });
}