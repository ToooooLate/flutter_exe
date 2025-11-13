import { requestClient } from '#/api/request';

/**
 * 导出实验报告（1990版）Excel
 * 接收参数：id（实验ID）、status（语言模版：0中文，1英文）
 */
export async function exportExperiment1990ExcelApi(params: { id: string; status: 0 | 1 }) {
  return await requestClient.get(`/api/sg/export/experiment1990`, {
      params,
      responseType: 'blob',
    });
}

/**
 * 导出实验报告（2009版）Excel
 * 接收参数：id（实验ID）、status（语言模版：0中文，1英文）
 */
export async function exportExperiment2009ExcelApi(params: { id: string; status: 0 | 1 }) {
  try {
    return await requestClient.get(`/api/sg/export/experiment2009`, {
      params,
      responseType: 'blob',
    });
  } catch (err) {
    // 兜底：使用通用导出接口（Excel），提升开发环境可用性
    return await requestClient.get(`/api/experiments/${params.id}/export`, {
      params: { format: 'excel', version: '2009', status: params.status },
      responseType: 'blob',
    });
  }
}