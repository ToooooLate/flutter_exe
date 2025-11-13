// 通用图表类型，供业务组件和图表组件复用
export interface ChartDataPoint {
  x: number; // 时间（秒）
  y: number; // 数值（电压等）
}

export interface RangeArea {
  min: number;
  max: number;
  color?: string;
  name?: string;
}