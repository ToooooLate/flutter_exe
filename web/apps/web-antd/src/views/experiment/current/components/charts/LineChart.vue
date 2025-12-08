<template>
  <div class="line-chart-container">
    <div class="chart-header">
      <div class="chart-title">
        {{ displayTitle }}
      </div>
      <div class="chart-actions">
        <button type="button" class="download-btn" @click="downloadChart()">
          {{ t('experiment.current.chart.downloadPng') }}
        </button>
      </div>
    </div>
    <div class="chart-content" :style="{ width: width, height: height }">
      <EchartsUI ref="chartRef" height="100%" width="100%" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import type { EchartsUIType } from '@vben/plugins/echarts';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useI18n } from '@vben/locales';
import { buildLineChartOptions } from './optionBuilder';

const { t } = useI18n();

export interface ChartDataPoint {
  x: number | string | Date;
  y: number;
}

export interface RangeArea {
  min: number;
  max: number;
  color?: string;
  name?: string;
}

interface Props {
  data: ChartDataPoint[];
  width?: string;
  height?: string;
  title?: string;
  xAxisName?: string;
  yAxisName?: string;
  rangeArea?: RangeArea;
  lineColor?: string;
  backgroundColor?: string;
  gridColor?: string;
  autoResize?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '520px',
  title: '',
  xAxisName: '',
  yAxisName: '',
  lineColor: '#1890ff',
  backgroundColor: '#ffffff',
  gridColor: '#f0f0f0',
  autoResize: true,
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts, getChartInstance } = useEcharts(chartRef);

// 显示标题（优先使用外部传入，否则使用 i18n 默认）
const displayTitle = computed(
  () => props.title || t('experiment.current.chart.defaultTitle'),
);

// 计算图表配置选项（统一使用共享构造器）
const chartOptions = computed(() =>
  buildLineChartOptions({
    data: props.data,
    title: props.title,
    xAxisName: props.xAxisName,
    yAxisName: props.yAxisName,
    rangeArea: props.rangeArea,
    lineColor: props.lineColor,
    backgroundColor: props.backgroundColor,
    gridColor: props.gridColor,
    t,
  }),
);

// 更新图表
const updateChart = async () => {
  if (chartOptions.value && Object.keys(chartOptions.value).length > 0) {
    await renderEcharts(chartOptions.value);
  }
};

// 下载图表为PNG（支持可选文件名）
const downloadChart = (filename?: string) => {
  const chartInstance = getChartInstance();
  if (!chartInstance) return;

  const url = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: props.backgroundColor,
  });

  const link = document.createElement('a');
  link.href = url;
  console.log(filename, 'filename');
  const name =
    typeof filename === 'string' && filename.trim().length > 0
      ? filename.trim()
      : `${props.title}_${new Date().getTime()}`;
  link.download = `${name}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 监听数据变化，实时更新图表
watch(
  () => props.data,
  () => {
    nextTick(() => {
      updateChart();
    });
  },
  { deep: true, immediate: true },
);

// 监听范围区间变化
watch(
  () => props.rangeArea,
  () => {
    nextTick(() => {
      updateChart();
    });
  },
  { deep: true, immediate: true },
);

// 监听图表选项变化
watch(
  chartOptions,
  () => {
    nextTick(() => {
      updateChart();
    });
  },
  { deep: true, immediate: true },
);

// 监听图表 ref，就绪后触发一次渲染
watch(
  chartRef,
  (val) => {
    if (!val) return;
    nextTick(() => {
      updateChart();
    });
  },
  { immediate: true },
);

// 移除 onMounted，依赖 immediate watchers 与 ref 就绪触发首次渲染

// 暴露方法给父组件
defineExpose({
  downloadChart,
  updateChart,
  getChartInstance,
});
</script>

<style scoped>
.line-chart-container {
  width: 100%;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.download-btn {
  padding: 4px 12px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.download-btn:hover {
  background: #40a9ff;
}

.chart-content {
  padding: 16px;
}
</style>
