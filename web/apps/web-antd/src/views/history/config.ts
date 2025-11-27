import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import dayjs from 'dayjs';
import { $t } from '#/locales';
import { useUserStore } from '#/store/user';

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
      label: $t('page.history.form.experimentNo'),
      componentProps: {
        placeholder: $t('page.history.form.experimentNoPlaceholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'projectName',
      label: $t('page.history.form.projectName'),
      componentProps: {
        placeholder: $t('page.history.form.projectNamePlaceholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'shipNumber',
      label: $t('page.history.form.shipNumber'),
      componentProps: {
        placeholder: $t('page.history.form.shipNumberPlaceholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'testPerson',
      label: $t('page.history.form.testPerson'),
      componentProps: {
        placeholder: $t('page.history.form.testPersonPlaceholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'unitModel',
      label: $t('page.history.form.unitModel'),
      componentProps: {
        placeholder: $t('page.history.form.unitModelPlaceholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'unitSerial',
      label: $t('page.history.form.unitSerial'),
      componentProps: {
        placeholder: $t('page.history.form.unitSerialPlaceholder'),
      },
    },
    {
      component: 'Select',
      fieldName: 'isTemplate',
      label: $t('page.history.form.isTemplate'),
      componentProps: {
        allowClear: true,
        placeholder: $t('page.history.form.isTemplatePlaceholder'),
        options: [
          { label: $t('page.history.template.no'), value: 0 },
          { label: $t('page.history.template.yes'), value: 1 },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.history.form.status'),
      componentProps: {
        allowClear: true,
        placeholder: $t('page.history.form.statusPlaceholder'),
        options: [
          { label: $t('page.history.status.processing'), value: 0 },
          { label: $t('page.history.status.finished'), value: 1 },
          { label: $t('page.history.status.discarded'), value: 2 },
        ],
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('page.history.form.createTime'),
      componentProps: {
        placeholder: [
          $t('page.history.form.createTimeStartPlaceholder'),
          $t('page.history.form.createTimeEndPlaceholder'),
        ],
        // 选择日期时，默认时间分别设置为 00:00:00 和 23:59:59
        showTime: {
          defaultValue: [
            dayjs('00:00:00', 'HH:mm:ss'),
            dayjs('23:59:59', 'HH:mm:ss'),
          ],
        },
        format: 'YYYY-MM-DDTHH:mm:ssZ',
      },
    },
  ];
}

// 表格列配置
export function useColumns<T = HistoryRecord>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  const userStore = useUserStore();
  const isEngineerRole = (userStore.userInfo?.roleCode ?? '') === 'engineer';
  return [
    {
      field: 'experimentNo',
      title: $t('page.history.table.experimentNo'),
      width: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'projectName',
      title: $t('page.history.table.projectName'),
      width: 130,
      showOverflow: 'tooltip',
    },
    {
      field: 'shipNumber',
      title: $t('page.history.table.shipNumber'),
      width: 130,
      showOverflow: 'tooltip',
    },
    {
      field: 'unitModel',
      title: $t('page.history.table.unitModel'),
      width: 130,
      showOverflow: 'tooltip',
    },
    {
      field: 'unitSerial',
      title: $t('page.history.table.unitSerial'),
      width: 130,
      showOverflow: 'tooltip',
    },
    {
      field: 'testPerson',
      title: $t('page.history.table.testPerson'),
      width: 120,
      showOverflow: 'tooltip',
    },
    {
      field: 'isTemplate',
      title: $t('page.history.table.isTemplate'),
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: $t('page.history.template.no'), value: 0 },
          { color: 'blue', label: $t('page.history.template.yes'), value: 1 },
        ],
      },
    },
    {
      field: 'status',
      title: $t('page.history.table.status'),
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'processing', label: $t('page.history.status.processing'), value: 0 },
          { color: 'success', label: $t('page.history.status.finished'), value: 1 },
          { color: 'error', label: $t('page.history.status.discarded'), value: 2 },
        ],
      },
    },
    {
      field: 'createTime',
      title: $t('page.history.table.createTime'),
      width: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'updateTime',
      title: $t('page.history.table.updateTime'),
      width: 150,
      showOverflow: 'tooltip',
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'experimentNo',
          nameTitle: $t('page.history.operation.nameTitle'),
          onClick: onActionClick, 
        },
        options: [
          {
            code: 'view',
            text: $t('page.history.operation.view'),
          },{
            code: 'viewReport',
            text: $t('page.history.operation.viewReport'),
          },
          {
            code: 'saveAsTemplate',
            text: $t('page.history.operation.saveAsTemplate'),
            show: (row: any) => isEngineerRole && row.status === 1 && row.isTemplate === 0,
          },
          {
            code: 'deleteTemplate',
            text: $t('page.history.operation.deleteTemplate'),
            show: (row: any) => isEngineerRole && row.status === 1 && row.isTemplate === 1,
          },
          {
            code: 'startByTemplate',
            text: $t('page.history.operation.startByTemplate'),
            show: (row: any) => isEngineerRole && row.status === 1 && row.isTemplate === 1,
          },
        ],
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('page.history.operation.title'),
    },
  ];
}