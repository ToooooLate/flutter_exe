import type { VxeGridProps } from '#/adapter/vxe-table';
import type { IntegratedCheckItem } from '#/store/experiment';

// 初始表格数据
export const initialTableData: IntegratedCheckItem[] = [
  { id: '1', serialNumber: 1, loadPercent: '0%', timeMin: '10', visible: true },
  { id: '2', serialNumber: 2, loadPercent: '25%', timeMin: '10', visible: true },
  { id: '3', serialNumber: 3, loadPercent: '50%', timeMin: '10', visible: true },
  { id: '4', serialNumber: 4, loadPercent: '75%', timeMin: '10', visible: true },
  { id: '5', serialNumber: 5, loadPercent: '100%', timeMin: '30', visible: true },
  { id: '6', serialNumber: 6, loadPercent: '100%', timeMin: '30', visible: true },
  { id: '7', serialNumber: 7, loadPercent: '100%', timeMin: '30', visible: true },
  { id: '8', serialNumber: 8, loadPercent: '110%', timeMin: '30', visible: true },
  { id: '9', serialNumber: 9, loadPercent: '100%', timeMin: '30', visible: true },
  { id: '10', serialNumber: 10, loadPercent: '75%', timeMin: '10', visible: true },
  { id: '11', serialNumber: 11, loadPercent: '50%', timeMin: '10', visible: true },
  { id: '12', serialNumber: 12, loadPercent: '25%', timeMin: '10', visible: true },
  { id: '13', serialNumber: 13, loadPercent: '0%', timeMin: '10', visible: true },
];

// 创建 Grid 配置
export function createGridOptions(data: IntegratedCheckItem[]) {
  const gridColumns = [
    {
      field: 'serialNumber',
      title: '序号',
      width: 80,
      align: 'center' as const,
    },
    {
      field: 'loadPercent',
      title: '负载',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: {
          placeholder: '请输入负载百分比',
        },
      },
    },
    {
      field: 'timeMin',
      title: '时间 (min)',
      width: 120,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: {
          placeholder: '请输入时间',
        },
      },
    },
    {
      field: 'ua',
      title: 'UA (V)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: {
          placeholder: '请输入电压值',
        },
      },
    },
    {
      field: 'ia',
      title: 'IA (A)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: {
          placeholder: '请输入电流值',
        },
      },
    },
    {
      field: 'powerFactor',
      title: '功率因数 Power Factor',
      width: 150,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: '请输入功率因数',
          min: 0,
          max: 1,
          step: 0.01,
        },
      },
    },
    {
      field: 'frequency',
      title: '频率 (Hz) Frequency',
      width: 150,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: '请输入频率值',
          min: 0,
          step: 0.01,
        },
      },
    },
    {
      field: 'umax',
      title: 'Umax',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: '请输入最大电压',
          min: 0,
          step: 0.01,
        },
      },
    },
    {
      field: 'umin',
      title: 'Umin',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: '请输入最小电压',
          min: 0,
        },
      },
    },
    {
      field: 'fmax',
      title: 'Fmax',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: '请输入最大频率',
          min: 0,
          step: 0.01,
        },
      },
    },
    {
      field: 'fmin',
      title: 'Fmin',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: '请输入最小频率',
          min: 0,
          step: 0.01,
        },
      },
    },
    {
      title: '操作',
      width: 180,
      align: 'center' as const,
      fixed: 'right' as const,
      slots: {
        default: 'action',
      },
    },
  ] as const;

  return {
    data,
    columns: gridColumns,
    border: true,
    stripe: true,
    editConfig: {
      trigger: 'click',
      mode: 'cell',
    },
    columnConfig: {
      resizable: true,
    },
    pagerConfig: {
      enabled: false,
    },
    scrollX: {
      enabled: true,
    },
  };
}