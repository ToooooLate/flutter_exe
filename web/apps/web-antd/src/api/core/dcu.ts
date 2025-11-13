import { requestClient } from '#/api/request';

export namespace DcuApi {
  export interface DcuDevice {
    id: string;
    name: string;
    enabled?: number;
    index?: number;
    status?: number;
  }

  export interface CreateDcuParams {
    name: string;
  }

  export interface PageFetchParams {
    pageNo?: number;
    pageSize?: number;
  }

  export interface PageResult {
    records: DcuDevice[];
    total: number;
  }

  export interface DetailDcuItem {
    id?: string;
    settingsId?: string;
    nameCh?: string;
    nameEn?: string;
    highAddress?: string;
    lowAddress?: string;
  }

  export interface UpdateDcuParams {
    id: string;
    name: string;
  }
}

/** 新增 DCU 连接设备 */
export async function createDcuDeviceApi(data: DcuApi.CreateDcuParams) {
  return requestClient.post<DcuApi.DcuDevice>('/api/sg/dcu/connection/add', data);
}

/** 获取 DCU 设备分页列表 */
export async function getDcuDeviceListApi(data: DcuApi.PageFetchParams) {
  return requestClient.post<DcuApi.PageResult>('/api/sg/dcu/connection/page', data);
}

/** 启用 DCU 设备 */
export async function enableDcuDeviceApi(params: { id: string, experimentId: string }) {
  return requestClient.get<DcuApi.DcuDevice>(`/api/sg/dcu/connection/enable`, { params });
}

/** 删除 DCU 设备 */
export async function deleteDcuDeviceApi(params: { id: string }) {
  return requestClient.get<DcuApi.DcuDevice>(`/api/sg/dcu/connection/delete`, { params });
}

/** 获取 DCU 设备详情列表 */
export async function getDcuDeviceDetailListApi(data: { id: string }) {
  return requestClient.post<DcuApi.PageResult>(`/api/sg/dcu/connection/info/list`, data);
}

/** 新增 DCU 设备 */
export async function addDcuDeviceApi(data: DcuApi.DetailDcuItem) {
  return requestClient.post<DcuApi.DetailDcuItem>(`/api/sg/dcu/connection/info/add`, data);
}

/** 更新 DCU 设备详情 */
export async function updateDcuDeviceDetailApi(data: DcuApi.DetailDcuItem) {
  return requestClient.post<DcuApi.DetailDcuItem>(`/api/sg/dcu/connection/info/update`, data);
}

/** 删除 DCU 设备详情 */
export async function deleteDcuDeviceDetailApi(params: { id: string }) {
  return requestClient.get<DcuApi.DcuDevice>(`/api/sg/dcu/connection/info/delete`, { params });
}

/** 下发 DCU 设备监控命令 */
export async function sendDcuDeviceMonitoringCommandApi(data: { experimentId: string,state: 0|1 }) {
  return requestClient.post<DcuApi.PageResult>(`/api/sg/command/monitoring`, data);
}

/** 获取 DCU 设备连接字段列表 */
export async function getDcuDeviceConnectionFieldListApi(data: { id: string }) {
  return requestClient.post<DcuApi.PageResult>(`/api/sg/dcu/connection/field/list`, data);
}