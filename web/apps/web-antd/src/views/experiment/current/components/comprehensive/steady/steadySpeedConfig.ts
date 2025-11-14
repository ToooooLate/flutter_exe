import { computed, type Ref } from 'vue';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { SteadySpeedSubItem, SteadySpeedItem } from '#/store/experiment';

// 创建稳态调速特性表格配置
export function createSteadySpeedGridOptions(data: SteadySpeedSubItem[]) {
  const gridColumns = [
    {
      field: 'serialNumber',
      title: '序号',
      width: 80,
      align: 'center' as const,
    },
    {
      field: 'loadPercent',
      title: '负载 (%)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'power',
      title: '功率 (kW)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'frequency',
      title: '频率 (Hz)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'powerFactor',
      title: '功率因数 COS Φ',
      width: 120,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'ua',
      title: 'UA (V)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },    
    },
    {
      field: 'ub',
      title: 'UB (V)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'uc',
      title: 'UC (V)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'ia',
      title: 'IA (A)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'ib',
      title: 'IB (A)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },  
    },
    {
      field: 'ic',
      title: 'IC (A)',
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'phaseAVoltage',
      title: 'A 相电压 (V)',
      width: 120,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'steadyFrequencyDeviation',
      title: '稳态调速率 δ (%)',
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
  alwaysShow: boolean = false
): TableConfig {
  const hasData = computed(() => alwaysShow || dataRef.value.length > 0);
  const gridOptions = computed(() => createSteadySpeedGridOptions(dataRef.value));
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
  alwaysShow?: boolean;
}>): TableConfig[] {
  return configs.map(config => 
    createTableConfig(config.key, config.title, config.dataRef, config.alwaysShow)
  );
}

// 稳态调速特性表格默认数据
export function createSteadySpeedListData(): SteadySpeedItem[] {
  return [
    {
      id: '1',
      serialNumber: 1,
      item: '第一次结果',
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: ''
    },
    {
      id: '2',
      serialNumber: 2,
      item: '第二次结果',
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: ''
    },
    {
      id: '3',
      serialNumber: 3,
      item: '第三次结果',
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: ''
    },
    {
      id: '4',
      serialNumber: 4,
      item: '平均值',
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: ''
    }
  ];
}

// 稳态调速特性表格配置
export function createSteadySpeedMainGridOptions(data: SteadySpeedItem[]): VxeGridProps {
  return {
    data,
    columns: [
      { field: 'item', title: '项目', width: 120 },
      {
        field: 'steadyFrequencyDeviation',
        title: '稳态调速率 δst (%)',
        editRender: {
          name: 'VxeInput',
          props: { type: 'text' },
        },
      },
      {
        field: 'speedSystemInsensitivity',
        title: '调速系统不灵敏度ε (%)',
        editRender: {
          name: 'VxeInput',
          props: { type: 'text' },
        },
      },
      {
        field: 'nonlinearity',
        title: '非线性度γ (%)',
        editRender: {
          name: 'VxeInput',
          props: { type: 'text' },
        },
      }
    ],
    editConfig: { trigger: 'click', mode: 'cell' },
    border: true,
    stripe: true,
    pagerConfig: {
      enabled: false,
    },
  };
}