<template>
  <div class="bg-background text-foreground h-full w-full p-4">
    <div class="flex items-center gap-3">
      <span class="text-sm">报告版本</span>
      <Select
        class="w-40"
        :value="selectedVersion"
        :options="versionOptions"
        @change="onVersionChange"
      />
      <div class="flex gap-2">
        <Button type="primary" size="small" :loading="exporting" @click="onExportClick">
          导出Excel报告
        </Button>
      </div>
    </div>
    <div class="mt-4 w-full overflow-auto">
      <table class="w-full border-collapse border border-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr v-for="(hrow, rIdx) in headerRowsVisible" :key="`h-${rIdx}`">
            <th
              v-for="(cell, idx) in hrow"
              :key="idx"
              :colspan="cell.colspan"
              :rowspan="cell.rowspan"
              class="border border-gray-200 px-1 py-1 text-center align-middle font-medium text-gray-700"
            >
              {{ formatCell(cell.text) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, ridx) in bodyRowsVisible"
            :key="ridx"
            class="odd:bg-white even:bg-gray-50"
          >
            <td
              v-for="(cell, cidx) in row"
              :key="cidx"
              :colspan="cell.colspan"
              :rowspan="cell.rowspan"
              class="whitespace-nowrap border border-gray-200 px-3 py-2 text-center align-middle text-gray-800"
            >
              {{ formatCell(cell.text) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { message, Select, Button } from 'ant-design-vue';
import * as XLSX from 'xlsx';
// @ts-ignore 仅屏蔽模块导出提示（运行时可用）
import { useI18n } from '@vben/locales';
// @ts-ignore 仅屏蔽路径别名的类型解析告警
import { requestClient } from '#/api/request';
import { useExperimentStore } from '#/store/experiment';
import { useRoute } from 'vue-router';

// 当前实验ID
const experimentStore = useExperimentStore();
const route = useRoute();

// 版本选项
const versionOptions = [
  { label: '1990版', value: '1990' },
  { label: '2009版', value: '2009' },
];
const selectedVersion = ref<'1990' | '2009'>('1990');
// Excel 结构化数据：支持合并单元格（colspan/rowspan）
type TableCell = {
  text: string;
  colspan: number;
  rowspan: number;
  hidden: boolean;
};
const headerRows = ref<TableCell[][]>([]);
const bodyRows = ref<TableCell[][]>([]);
const exporting = ref(false);

// 供模板使用的可见视图：仅在渲染层过滤 hidden，不影响数据网格
const headerRowsVisible = computed<TableCell[][]>(() =>
  headerRows.value.map((row) => row.filter((cell) => !cell.hidden)),
);
const bodyRowsVisible = computed<TableCell[][]>(() =>
  bodyRows.value.map((row) => row.filter((cell) => !cell.hidden)),
);

// 根据当前激活语言映射到模板状态：0=中文，1=英文（使用 i18n）
const { locale } = useI18n();
function getLanguageStatus(): 0 | 1 {
  const current = String(locale?.value ?? 'zh-CN').toLowerCase();
  return current.startsWith('zh') ? 0 : 1;
}

function getFileNameFromDisposition(
  disposition: unknown,
  fallbackName: string,
): string {
  const value = typeof disposition === 'string' ? disposition : '';
  if (!value) return fallbackName;
  // Try RFC 5987 filename*=
  if (value.includes('filename*=')) {
    const idx = value.indexOf('filename*=');
    let part = value
      .slice(idx + 'filename*='.length)
      .split(';')[0]
      .trim();
    // e.g. UTF-8''encodedName
    const pos = part.indexOf("''");
    if (pos >= 0) part = part.slice(pos + 2);
    try {
      return decodeURIComponent(part.replace(/"/g, '').trim());
    } catch {
      return part.replace(/"/g, '').trim();
    }
  }
  // Fallback: filename="name" or filename=name
  if (value.includes('filename=')) {
    let name = value.split('filename=')[1].split(';')[0].trim();
    if (name.startsWith('"') && name.endsWith('"')) {
      name = name.slice(1, -1);
    }
    return name;
  }
  return fallbackName;
}

function saveBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

async function fetchExcelBlob(version: '1990' | '2009'): Promise<{ blob: Blob; fileName: string } | null> {
  // 优先从路由读取ID（支持 params 或 query），再回退到当前实验ID
  const routeId = (route.params?.id ?? route.query?.id ?? '') as string;
  const id = String(routeId || experimentStore.state.currentExperiment?.id || '');
  if (!id) {
    message.warning('缺少实验ID，请从带有 id 的路由进入或先选择/创建实验');
    return null;
  }

  const status = getLanguageStatus();
  try {
    const path =
      version === '1990'
        ? '/api/sg/export/experiment1990'
        : '/api/sg/export/experiment2009';
    const params = new URLSearchParams({
      id,
      status: String(status),
    }).toString();
    const requestUrl = `${path}?${params}`;

    const res = await requestClient.download(requestUrl, {
      responseReturn: 'raw',
    });

    const lang = status === 0 ? 'zh' : 'en';
    const defaultName = `experiment-${version}-${lang}-${id}.xlsx`;
    const disposition = (res as any)?.headers?.['content-disposition'] ?? '';
    const fileName = getFileNameFromDisposition(disposition, defaultName);
    return { blob: res.data as Blob, fileName };
  } catch (error) {
    console.error('下载失败:', error);
    message.error('报告下载失败，请稍后重试');
    return null;
  }
}

async function downloadExcel(version: '1990' | '2009') {
  const result = await fetchExcelBlob(version);
  if (!result) return;
  // 仅用于更新页面渲染，不进行保存
  await renderTableFromBlob(result.blob);
}

function onVersionChange(value: '1990' | '2009') {
  selectedVersion.value = value;
  downloadExcel(value);
}

onMounted(() => {
  // 渲染后自动按系统语言下载1990版
  downloadExcel('1990');
});

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

async function renderTableFromBlob(blob: Blob) {
  try {
    const buf = await blob.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      headerRows.value = [];
      bodyRows.value = [];
      return;
    }
    const ws = wb.Sheets[sheetName] as XLSX.WorkSheet & {
      ['!ref']?: string;
      ['!merges']?: any[];
    };
    console.log('ws:', ws);
    const ref = ws['!ref'] || 'A1';
    const range = XLSX.utils.decode_range(ref);
    const R0 = range.s.r;
    const C0 = range.s.c;
    const R1 = range.e.r;
    const C1 = range.e.c;
    const rowCount = R1 - R0 + 1;
    const colCount = C1 - C0 + 1;
    console.log('range:', range);

    let grid: TableCell[][] = Array.from({ length: rowCount }, () =>
      Array.from({ length: colCount }, () => ({
        text: '',
        colspan: 1,
        rowspan: 1,
        hidden: false,
      })),
    );

    // 填充文本
    for (let R = R0; R <= R1; R++) {
      for (let C = C0; C <= C1; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell: any = (ws as any)[addr];
        let text = '';
        if (cell) {
          if (cell.w != null) text = String(cell.w);
          else if (cell.v != null) text = String(cell.v);
        }
        grid[R - R0][C - C0].text = String(text ?? '').trim();
      }
    }
    console.log('grid:', grid);

    // 处理合并单元格
    const merges = (ws as any)['!merges'] || [];
    merges.forEach((m: any) => {
      const r0 = m.s.r - R0;
      const c0 = m.s.c - C0;
      const r1 = m.e.r - R0;
      const c1 = m.e.c - C0;
      const rowspan = r1 - r0 + 1;
      const colspan = c1 - c0 + 1;
      const anchor = grid[r0]?.[c0];
      if (!anchor) return;
      anchor.rowspan = rowspan;
      anchor.colspan = colspan;
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (r === r0 && c === c0) continue;
          const covered = grid[r]?.[c];
          if (covered) covered.hidden = true;
        }
      }
    });

    // 依据内容特征识别首个数据行，从而确定表头行数
    // 仅用于识别数据行的可见视图，避免压缩列导致索引漂移
    const rowsForDetect = grid.map((row) => row.filter((cell) => !cell.hidden));
    const isNumericText = (t: string) => /^(?:[+-]?\d+(?:\.\d+)?)$/.test(t);
    const hasPercent = (t: string) => /%/.test(t);
    let headerRowCount = 1;
    for (let i = 0; i < rowsForDetect.length; i++) {
      const row = rowsForDetect[i];
      const first = (row[0]?.text || '').trim();
      const numericCount = row.reduce(
        (acc, c) =>
          acc +
          (isNumericText(String(c.text)) || hasPercent(String(c.text)) ? 1 : 0),
        0,
      );
      const threshold = Math.max(3, Math.floor(row.length / 3));
      const looksLikeData = numericCount >= threshold || hasPercent(first);
      if (looksLikeData) {
        headerRowCount = Math.max(1, i);
        break;
      }
    }

    // 强化识别：若出现典型子表头(UA/UB/UC/IA/IB/IC/MAX/MIN)，确保将该行纳入表头
    const headerTokens = [
      'UA',
      'UB',
      'UC',
      'IA',
      'IB',
      'IC',
      'MAX',
      'MIN',
      '最大',
      '最小',
    ];
    for (let i = 0; i < rowsForDetect.length; i++) {
      const texts = rowsForDetect[i].map((c) =>
        String(c.text).trim().toUpperCase(),
      );
      const hits = headerTokens.filter((t) => texts.includes(t)).length;
      if (hits >= 3) {
        headerRowCount = Math.max(headerRowCount, i + 1);
      }
    }

    // 若表头区域存在跨行合并，确保合并范围全部纳入表头
    merges.forEach((m: any) => {
      const startRow = m.s.r - R0;
      if (startRow < headerRowCount) {
        const endWithinHeader = m.e.r - R0 + 1;
        if (endWithinHeader > headerRowCount) headerRowCount = endWithinHeader;
      }
    });

    // 组装表头与表体：保持完整网格，渲染时跳过隐藏单元格
    headerRows.value = grid.slice(0, headerRowCount);
    bodyRows.value = grid
      .slice(headerRowCount)
      .filter((row) => row.some((cell) => String(cell.text).trim() !== ''));
    console.log('headerRows:', headerRows.value);
    console.log('bodyRows:', bodyRows.value);
  } catch (err) {
    console.error('Excel 解析失败:', err);
    headerRows.value = [];
    bodyRows.value = [];
  }
}

async function onExportClick() {
  exporting.value = true;
  try {
    const result = await fetchExcelBlob(selectedVersion.value);
    if (!result) return;
    saveBlob(result.blob, result.fileName);
    message.success('Excel报告已开始下载');
  } finally {
    exporting.value = false;
  }
}
</script>
