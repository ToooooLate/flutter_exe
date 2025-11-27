import { computed } from 'vue';
// 兼容环境的类型声明：部分工具链或类型解析可能无法识别 vue 的 Ref 导出
// 在此定义最小的 Ref 类型以确保类型检查通过，不影响运行时行为
type Ref<T> = { value: T };
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { canEditTable } from '#/composables/useExperimentPermissions';

// 在本文件内定义数据类型，避免依赖不存在的 store 类型
export type SteadySpeedItem = Record<string, any>;
export type SteadySpeedSubItem = Record<string, any>;

// 创建稳态调速特性表格配置
export function createSteadySpeedGridOptions(
  data: SteadySpeedSubItem[],
  t: (key: string) => string,
) {
  const gridColumns = [
    {
      field: 'serialNumber',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.serialNumber'),
      width: 80,
      align: 'center' as const,
    },
    {
      field: 'loadPercent',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.loadPercent'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'power',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.power'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'frequency',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.frequency'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'powerFactor',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.powerFactor'),
      width: 120,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'ua',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.ua'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },    
    },
    {
      field: 'ub',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.ub'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'uc',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.uc'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'ia',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.ia'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'ib',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.ib'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },  
    },
    {
      field: 'ic',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.ic'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'phaseAVoltage',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.phaseAVoltage'),
      width: 120,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'steadyFrequencyDeviation',
      title: t('experiment.current.comprehensive.steady.speedCharacteristic.columns.steadyFrequencyDeviation'),
      width: 140,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
  ] as const;

  return {
    data,
    columns: gridColumns,
    border: true,
    stripe: true,
    columnConfig: {
      resizable: true,
    },
    editConfig: {
      trigger: 'click',
      mode: 'cell',
      beforeEditMethod: () => canEditTable(),
    },
    pagerConfig: {
      enabled: false,
    },
    scrollX: {
      enabled: true,
    },
    height: 'auto',
  };
 }

// 表格配置接口
export interface TableConfig {
  key: string;
  title: string;
  dataRef: Ref<SteadySpeedSubItem[]>;
  component: any;
  hasData: any;
  gridOptions: any;
  GridApi: any;
}

// 工厂函数：创建表格配置
export function createTableConfig(
  key: string,
  title: string,
  dataRef: Ref<SteadySpeedSubItem[]>,
  t: (key: string) => string,
  alwaysShow: boolean = false,
): TableConfig {
  const hasData = computed(() => alwaysShow || dataRef.value.length > 0);
  const gridOptions = computed(() => createSteadySpeedGridOptions(dataRef.value, t));
  const [GridComponent,GridApi] = useVbenVxeGrid({ gridOptions });

  return {
    key,
    title,
    dataRef,
    component: GridComponent,
    GridApi,
    hasData,
    gridOptions,
  };
}

// 工厂函数：批量创建表格配置
export function createTableConfigs(configs: Array<{
  key: string;
  title: string;
  dataRef: Ref<SteadySpeedSubItem[]>;
  t: (key: string) => string;
  alwaysShow?: boolean;
}>): TableConfig[] {
  return configs.map(config =>
    createTableConfig(
      config.key,
      config.title,
      config.dataRef,
      config.t,
      config.alwaysShow,
    ),
  );
}

// 稳态调速特性表格默认数据
export function createSteadySpeedListData(t: (key: string) => string): SteadySpeedItem[] {
  return [
    {
      id: '1',
      serialNumber: 1,
      item: t('experiment.current.comprehensive.steady.speedCharacteristic.items.first'),
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: '',
    },
    {
      id: '2',
      serialNumber: 2,
      item: t('experiment.current.comprehensive.steady.speedCharacteristic.items.second'),
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: '',
    },
    {
      id: '3',
      serialNumber: 3,
      item: t('experiment.current.comprehensive.steady.speedCharacteristic.items.third'),
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: '',
    },
    {
      id: '4',
      serialNumber: 4,
      item: t('experiment.current.comprehensive.steady.speedCharacteristic.items.average'),
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: '',
    },
  ];
}

// 稳态调速特性表格配置
export function createSteadySpeedMainGridOptions(
  data: SteadySpeedItem[],
  t: (key: string) => string,
): VxeGridProps {
  return {
    data,
    columns: [
      { field: 'item', title: t('experiment.current.comprehensive.steady.speedCharacteristic.main.columns.item'), width: 120 },
      {
        field: 'steadyFrequencyDeviation',
        title: t('experiment.current.comprehensive.steady.speedCharacteristic.main.columns.steadyFrequencyDeviationStPercent'),
        editRender: {
          name: 'VxeInput',
          props: { type: 'text' },
        },
      },
      {
        field: 'speedSystemInsensitivity',
        title: t('experiment.current.comprehensive.steady.speedCharacteristic.main.columns.speedSystemInsensitivityPercent'),
        editRender: {
          name: 'VxeInput',
          props: { type: 'text' },
        },
      },
      {
        field: 'nonlinearity',
        title: t('experiment.current.comprehensive.steady.speedCharacteristic.main.columns.nonlinearityPercent'),
        editRender: {
          name: 'VxeInput',
          props: { type: 'text' },
        },
      }
    ],
    editConfig: { trigger: 'click', mode: 'cell', beforeEditMethod: () => canEditTable() },
    border: true,
    stripe: true,
    pagerConfig: {
      enabled: false,
    },
  };
}