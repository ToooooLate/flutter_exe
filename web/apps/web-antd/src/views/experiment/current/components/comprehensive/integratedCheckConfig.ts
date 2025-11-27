// ts-ignore
import type { IntegratedCheckItem } from '#/store/experiment';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { $t } from '#/locales';

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
      title: $t('experiment.current.columns.serialNumber'),
      width: 80,
      align: 'center' as const,
    },
    {
      field: 'loadPercent',
      title: $t('experiment.current.columns.load'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputLoadPercent'),
        },
      },
    },
    {
      field: 'timeMin',
      title: $t('experiment.current.columns.timeMin'),
      width: 120,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputTime'),
        },
      },
    },
    {
      field: 'ua',
      title: $t('experiment.current.columns.ua'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputVoltage'),
        },
      },
    },
    {
      field: 'ia',
      title: $t('experiment.current.columns.ia'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputCurrent'),
        },
      },
    },
    {
      field: 'powerFactor',
      title: $t('experiment.current.columns.powerFactor'),
      width: 150,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputPowerFactor'),
          min: 0,
          max: 1,
          step: 0.01,
        },
      },
    },
    {
      field: 'frequency',
      title: $t('experiment.current.columns.frequency'),
      width: 150,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputFrequency'),
          min: 0,
          step: 0.01,
        },
      },
    },
    {
      field: 'umax',
      title: $t('experiment.current.columns.umax'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputUmax'),
          min: 0,
          step: 0.01,
        },
      },
    },
    {
      field: 'umin',
      title: $t('experiment.current.columns.umin'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputUmin'),
          min: 0,
        },
      },
    },
    {
      field: 'fmax',
      title: $t('experiment.current.columns.fmax'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputFmax'),
          min: 0,
          step: 0.01,
        },
      },
    },
    {
      field: 'fmin',
      title: $t('experiment.current.columns.fmin'),
      width: 100,
      align: 'center' as const,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          placeholder: $t('experiment.current.placeholders.inputFmin'),
          min: 0,
          step: 0.01,
        },
      },
    },
    {
      title: $t('experiment.current.columns.action'),
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
    beforeEditMethod: () => canEditTable(),
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