import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

// 操作点击回调函数类型
export type OnActionClickFn<T = any> = (params: {
  action: string;
  row: T;
}) => void;

// 历史记录数据类型
export interface HistoryRecord {
  id: string;
  experimentNo: string; // 实验编号
  projectName: string; // 项目名
  shipNumber: string; // 船号
  testPerson: string; // 测试人员
  status: 0 | 1 | 2; // 实验状态（0-进行中，1-已结束，2-已废弃）
  isTemplate: 0 | 1; // 是否为模板（0-否，1-是）
  unitModel: string; // 机组型号
  unitSerial: string; // 机组编号
  createTime: string; // 创建时间
  updateTime: string; // 上次编辑时间
  remark?: string; // 备注
}

// 搜索表单配置
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'experimentNo',
      label: '实验编号',
      componentProps: {
        placeholder: '请输入实验编号',
      },
    },
    {
      component: 'Input',
      fieldName: 'projectName',
      label: '项目名',
      componentProps: {
        placeholder: '请输入项目名',
      },
    },
    {
      component: 'Input',
      fieldName: 'shipNumber',
      label: '船号',
      componentProps: {
        placeholder: '请输入船号',
      },
    },
    {
      component: 'Input',
      fieldName: 'testPerson',
      label: '测试人员',
      componentProps: {
        placeholder: '请输入测试人员',
      },
    },
    {
      component: 'Input',
      fieldName: 'unitModel',
      label: '机组型号',
      componentProps: {
        placeholder: '请输入机组型号',
      },
    },
    {
      component: 'Input',
      fieldName: 'unitSerial',
      label: '机组编号',
      componentProps: {
        placeholder: '请输入机组编号',
      },
    },
    {
      component: 'Select',
      fieldName: 'isTemplate',
      label: '是否为模板',
      componentProps: {
        allowClear: true,
        placeholder: '请选择是否为模板',
        options: [
          { label: '否', value: 0 },
          { label: '是', value: 1 },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '实验状态',
      componentProps: {
        allowClear: true,
        placeholder: '请选择实验状态',
        options: [
          { label: '进行中', value: 0 },
          { label: '已结束', value: 1 },
          { label: '已废弃', value: 2 },
        ],
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: '创建时间',
      componentProps: {
        placeholder: ['开始时间', '结束时间'],
      },
    },
  ];
}

// 表格列配置
export function useColumns<T = HistoryRecord>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'experimentNo',
      title: '实验编号',
      width: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'engineModel',
      title: '机组型号',
      width: 130,
      showOverflow: 'tooltip',
    },
    {
      field: 'engineSerial',
      title: '机组编号',
      width: 130,
      showOverflow: 'tooltip',
    },
    {
      field: 'testPerson',
      title: '测试人员',
      width: 120,
      showOverflow: 'tooltip',
    },
    {
      field: 'isTemplate',
      title: '是否为模板',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '否', value: 0 },
          { color: 'blue', label: '是', value: 1 },
        ],
      },
    },
    {
      field: 'status',
      title: '实验状态',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'processing', label: '进行中', value: 0 },
          { color: 'success', label: '已结束', value: 1 },
          { color: 'error', label: '已废弃', value: 2 },
        ],
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'updateTime',
      title: '上次编辑时间',
      width: 150,
      showOverflow: 'tooltip',
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'experimentNo',
          nameTitle: '实验编号',
          onClick: onActionClick, 
        },
        options: [
          {
            code: 'view',
            text: '详情',
          },{
            code: 'viewReport',
            text: '查看报告',
          },
          {
            code: 'keepAsTemplate',
            text: '保存为模版',
          },
        ],
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
    },
  ];
}