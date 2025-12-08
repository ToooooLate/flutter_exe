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

// 上传实验图片
export async function uploadExperimentImageApi(params: { ids: string; files: File[] }) {
  const formData = new FormData();
  params.files.forEach((file) => {
    formData.append('files', file);
  });
  // formData.append('files', params.files);
  formData.append('ids', params.ids);
  return await requestClient.post(`/api/sg/image/convert`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// 导出完整实验报告Word
export async function exportFullExperimentReportWordApi(params: { id: string; status: 0 | 1 }) {
  // 使用 download 并返回原始响应，避免默认的 data 解析拦截器
  const res = await requestClient.download(`/api/sg/export/word`, {
    params,
    responseReturn: 'raw',
  });
  const headers = (res as any)?.headers ?? {};
  const disposition = headers['content-disposition'] ?? headers['Content-Disposition'] ?? '';
  const lang = params.status === 0 ? 'zh' : 'en';
  const fallbackName = `experiment-full-${lang}-${params.id}.docx`;
  // 解析文件名（支持 filename*= 和 filename=）
  function parseDisposition(value: unknown, defName: string): string {
    const str = typeof value === 'string' ? value : '';
    if (!str) return defName;
    // 优先匹配 RFC 5987 格式：filename*=UTF-8''encodedName 或省略编码前缀
    const starMatch = str.match(/filename\*\s*=\s*(?:[^'";]+''|"[^"]*''|)?([^;\r\n]+)/i);
    if (starMatch && starMatch[1]) {
      let raw = starMatch[1].trim().replace(/^"|"$/g, '');
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    // 退化匹配常规形式：filename="name.docx" 或不带引号
    const normalMatch = str.match(/filename\s*=\s*([^;\r\n]+)/i);
    if (normalMatch && normalMatch[1]) {
      let name = normalMatch[1].trim().replace(/^"|"$/g, '');
      return name || defName;
    }
    return defName;
  }
  const fileName = parseDisposition(disposition, fallbackName);
  const blobData = ((res as any)?.data) as Blob;
  return { blob: blobData, fileName };
}
