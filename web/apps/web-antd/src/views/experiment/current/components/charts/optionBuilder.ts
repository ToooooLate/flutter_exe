import type { ChartDataPoint, RangeArea } from './types';

interface BuildParams {
  data: ChartDataPoint[];
  title?: string;
  xAxisName?: string;
  yAxisName?: string;
  rangeArea?: RangeArea | undefined;
  lineColor?: string;
  backgroundColor?: string;
  gridColor?: string;
  t?: (key: string) => string;
  locale?: string;
}

const defaultT = (s: string) => s;

export function buildLineChartOptions(params: BuildParams) {
  const {
    data,
    title = '',
    xAxisName = '',
    yAxisName = '',
    rangeArea,
    lineColor = '#1890ff',
    backgroundColor = '#ffffff',
    gridColor = '#f0f0f0',
    t = defaultT,
    locale = '',
  } = params;

  if (!data || data.length === 0) return {};

  const xData = data.map((item) => item.x);
  const yData = data.map((item) => item.y);
  const maxX = Math.ceil(Math.max(...xData.map((item) => Number(item))));

  const yMin = Math.min(...yData);
  const yMax = Math.max(...yData);
  const yRange = yMax - yMin;
  const yPadding = yRange === 0 ? Math.max(1, Math.abs(yMax || 0) * 0.1) : yRange * 0.2;
  const niceStep = 10;
  const niceMin = Math.floor((yMin - yPadding) / niceStep) * niceStep;
  const niceMax = Math.ceil((yMax + yPadding) / niceStep) * niceStep;

  const series: any[] = [
    {
      // name: t('experiment.current.chart.seriesData'),
      type: 'line',
      data: data.map((p) => [Number(p.x), p.y]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: {
        color: lineColor,
        width: 2,
      },
      itemStyle: {
        color: lineColor,
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: lineColor + '40' },
            { offset: 1, color: lineColor + '10' },
          ],
        },
      },
    },
  ];

  if (rangeArea) {
    series.push({
      name: rangeArea.name || t('experiment.current.chart.rangeUpper'),
      type: 'line',
      data: data.map((p) => [Number(p.x), rangeArea.max]),
      lineStyle: {
        color: rangeArea.color || '#ff4d4f',
        width: 1,
        type: 'dashed',
      },
      symbol: 'none',
      silent: true,
    });

    series.push({
      name: rangeArea.name || t('experiment.current.chart.rangeLower'),
      type: 'line',
      data: data.map((p) => [Number(p.x), rangeArea.min]),
      lineStyle: {
        color: rangeArea.color || '#ff4d4f',
        width: 1,
        type: 'dashed',
      },
      symbol: 'none',
      silent: true,
      areaStyle: {
        color: (rangeArea.color || '#ff4d4f') + '20',
      },
    });
  }

  return {
    backgroundColor,
    title: {
      text: title || t('experiment.current.chart.defaultTitle'),
      left: 'center',
      textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`;
        params.forEach((param: any) => {
          if (param.seriesName === t('experiment.current.chart.seriesData')) {
            result += `${param.marker}${param.seriesName}: ${param.value}<br/>`;
          }
        });
        if (rangeArea) {
          result += `<span style="color: ${rangeArea.color || '#ff4d4f'}">● ${t('experiment.current.chart.tooltipRangeLabel')}: ${rangeArea.min} - ${rangeArea.max}</span>`;
        }
        return result;
      },
    },
    legend: {
      data: [
        t('experiment.current.chart.seriesData'),
        ...(rangeArea ? [t('experiment.current.chart.legendRange')] : []),
      ],
      top: 30,
    },
    grid: {
      left: '4%', right: '4%', bottom: '8%', top: '15%', containLabel: true, backgroundColor: gridColor,
    },
    xAxis: {
      type: 'value',
      name: xAxisName || t('experiment.current.chart.xAxis'),
      nameLocation: 'middle',
      nameGap: 25,
      nameTextStyle: { color: '#666', fontSize: 12 },
      axisLine: { lineStyle: { color: '#666' } },
      min: 0,
      max: maxX,
      interval: 1,
      axisLabel: { color: '#666', formatter: '{value}' },
      axisTick: {
        show: true,
        alignWithLabel: true,
        interval: (index: number, value: string | number) => {
          const v = typeof value === 'string' ? parseFloat(value) : Number(value);
          return Number.isFinite(v) ? v % 1 === 0 : false;
        },
      },
    },
    yAxis: {
      type: 'value',
      name: yAxisName || t('experiment.current.chart.yAxis'),
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: '#666', fontSize: 12 },
      axisLine: { lineStyle: { color: '#666' } },
      axisLabel: { color: '#666' },
      scale: true,
      min: niceMin,
      max: niceMax,
      splitLine: { lineStyle: { color: '#e8e8e8', type: 'dashed' } },
    },
    series,
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
  };
}