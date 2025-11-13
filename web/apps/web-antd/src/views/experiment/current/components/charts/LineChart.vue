<template>
  <div class="line-chart-container">
    <div class="chart-header">
      <div class="chart-title">
        {{ title }}
      </div>
      <div class="chart-actions">
        <button type="button" class="download-btn" @click="downloadChart">
          下载PNG
        </button>
      </div>
    </div>
    <div class="chart-content" :style="{ width: width, height: height }">
      <EchartsUI ref="chartRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import type { EchartsUIType } from '@vben/plugins/echarts';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

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
  height: '400px',
  title: '折线图',
  xAxisName: 'X轴',
  yAxisName: 'Y轴',
  lineColor: '#1890ff',
  backgroundColor: '#ffffff',
  gridColor: '#f0f0f0',
  autoResize: true,
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts, getChartInstance } = useEcharts(chartRef);

// 计算图表配置选项
const chartOptions = computed(() => {
  if (!props.data || props.data.length === 0) return {};

  const xData = props.data.map((item) => item.x);
  const yData = props.data.map((item) => item.y);
  const maxX = Math.ceil(Math.max(...xData.map((item) => Number(item))));

  // 构建系列数据
  const series: any[] = [
    {
      name: '数据',
      type: 'line',
      data: props.data.map((p) => [Number(p.x), p.y]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: {
        color: props.lineColor,
        width: 2,
      },
      itemStyle: {
        color: props.lineColor,
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: props.lineColor + '40',
            },
            {
              offset: 1,
              color: props.lineColor + '10',
            },
          ],
        },
      },
    },
  ];

  // 添加范围区间
  if (props.rangeArea) {
    series.push({
      name: props.rangeArea.name || '范围区间上限',
      type: 'line',
      data: props.data.map((p) => [Number(p.x), props.rangeArea!.max]),
      lineStyle: {
        color: props.rangeArea.color || '#ff4d4f',
        width: 1,
        type: 'dashed',
      },
      symbol: 'none',
      silent: true,
    });

    series.push({
      name: props.rangeArea.name || '范围区间下限',
      type: 'line',
      data: props.data.map((p) => [Number(p.x), props.rangeArea!.min]),
      lineStyle: {
        color: props.rangeArea.color || '#ff4d4f',
        width: 1,
        type: 'dashed',
      },
      symbol: 'none',
      silent: true,
      areaStyle: {
        color: (props.rangeArea.color || '#ff4d4f') + '20',
      },
    });
  }

  return {
    backgroundColor: props.backgroundColor,
    title: {
      text: props.title,
      left: 'center',
      textStyle: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999',
        },
      },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`;
        params.forEach((param: any) => {
          if (param.seriesName === '数据') {
            result += `${param.marker}${param.seriesName}: ${param.value}<br/>`;
          }
        });
        if (props.rangeArea) {
          result += `<span style="color: ${props.rangeArea.color || '#ff4d4f'}">● 范围区间: ${props.rangeArea.min} - ${props.rangeArea.max}</span>`;
        }
        return result;
      },
    },
    legend: {
      data: ['数据', ...(props.rangeArea ? ['范围区间'] : [])],
      top: 30,
    },
    grid: {
      left: '4%',
      right: '4%',
      bottom: '8%',
      top: '15%',
      containLabel: true,
      backgroundColor: props.gridColor,
    },
    xAxis: {
      type: 'value',
      name: props.xAxisName,
      nameLocation: 'middle',
      nameGap: 25,
      nameTextStyle: {
        color: '#666',
        fontSize: 12,
      },
      axisLine: {
        lineStyle: {
          color: '#666',
        },
      },
      min: 0,
      max: maxX,
      interval: 1,
      axisLabel: {
        color: '#666',
        formatter: '{value}',
        // rotate: xData.length > 50 ? 45 : 0,
        // // 每 1s 显示一个刻度标签（数据为 0.1s 间隔）
        // interval: (index: number, value: string | number) => {
        //   const v = typeof value === 'string' ? parseFloat(value) : Number(value);
        //   return Number.isFinite(v) ? v % 1 === 0 : false;
        // },
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
        // 每 1s 显示一个刻度（数据为 0.1s 间隔）
        interval: (index: number, value: string | number) => {
          const v =
            typeof value === 'string' ? parseFloat(value) : Number(value);
          return Number.isFinite(v) ? v % 1 === 0 : false;
        },
      },
    },
    yAxis: {
      type: 'value',
      name: props.yAxisName,
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        color: '#666',
        fontSize: 12,
      },
      axisLine: {
        lineStyle: {
          color: '#666',
        },
      },
      axisLabel: {
        color: '#666',
      },
      splitLine: {
        lineStyle: {
          color: '#e8e8e8',
          type: 'dashed',
        },
      },
    },
    series,
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
  };
});

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
  const name =
    filename && filename.trim().length > 0
      ? filename
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
