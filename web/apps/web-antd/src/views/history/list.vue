<template>
  <Page
    :description="pageDescription"
    :title="pageTitle"
  >
    <Grid />
  </Page>
</template>

<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { message } from 'ant-design-vue';

import { Page } from '@vben/common-ui';
import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useRouter } from 'vue-router';
// @ts-ignore 路径别名的最小类型声明在 env.d.ts 中提供
import { saveExperimentToStorage } from '#/composables/useExperimentStorage';

import {
  getHistoryListApi,
  saveAsTemplateApi,
  getExperimentDetailByIdApi,
} from '#/api/core';
import type { HistoryRecord } from './config';
import { useColumns, useGridFormSchema } from './config';

// 在组件 setup 顶层获取路由实例，避免在事件中获取导致上下文缺失
const router = useRouter();

// 页面文案
const pageTitle = $t('page.history.list.title');
const pageDescription = $t('page.history.list.description');

// 操作点击处理
const onActionClick = ({
  action,
  row,
  code,
}: {
  action: string;
  row: HistoryRecord;
  code: string;
}) => {
  switch (code) {
    case 'view':
      handleView(row);
      break;
    case 'viewReport':
      handleViewReport(row);
      break;
    case 'saveAsTemplate':
      handleSetAsTemplate(row, 1);
      break;
    case 'deleteTemplate':
      handleSetAsTemplate(row, 0);
      break;
    case 'startByTemplate':
      handleStartByTemplate(row);
      break;
  }
};

// 查看详情
const handleView = (record: HistoryRecord) => {
  console.log('查看详情:', record);
  try {
    // 将实验信息写入本地存储（包含状态）
    saveExperimentToStorage(record.experimentNo, record.id, record.status);
    message.success($t('page.history.message.loadedExperiment', [record.experimentNo]));
    // 跳转到当前实验页面
    router?.push({ path: '/experiment' });
  } catch (error) {
    console.error('加载实验失败:', error);
    message.error($t('page.history.message.loadExperimentFailed'));
  }
};

// 查看报告
const handleViewReport = (record: HistoryRecord) => {
  console.log('查看报告:', record);
  // 跳转到报告页，并携带 id 与 experimentNo 作为路由参数
  const id = String(record.id ?? '');
  const experimentNo = String(record.experimentNo ?? '');
  if (!id || !experimentNo) {
    message.warning($t('page.history.message.missingExperimentIdOrNo'));
    return;
  }
  router.push({
    path: '/report',
    query: { id, experimentNo },
  });
};

// 保存为模版
const handleSetAsTemplate = async (
  record: HistoryRecord,
  isTemplate: 0 | 1,
) => {
  await saveAsTemplateApi({
    id: record.id || '',
    isTemplate,
  });
  message.success($t('page.history.message.operationSuccess'));
  GridApi.query();
};

// 以模版开启实验
const handleStartByTemplate = async (record: HistoryRecord) => {
  console.log('以模版开启实验:', record);
  // TODO: 实现以模版开启实验逻辑
  try {
    const res = await getExperimentDetailByIdApi({
      id: record.id,
      isNewExperiment: true,
    });
    if (res) {
      saveExperimentToStorage(res.experimentNo, res.id, res.status);
      message.success($t('page.history.message.startExperimentSuccess', [res.experimentNo]));
      // 跳转到当前实验页面
      router?.push({ path: '/experiment' });
    }
  } catch (error) {
    console.error('开启实验失败:', error);
    message.error($t('page.history.message.startExperimentFailed'));
  }
};

// 表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: useGridFormSchema(),
  // 将 RangePicker 的值映射为 createTimeStart/createTimeEnd，并格式化为整天范围（带时区）
  fieldMappingTime: [['createTime', ['createTimeStart', 'createTimeEnd'], ['YYYY-MM-DD[T]00:00:00Z', 'YYYY-MM-DD[T]23:59:59Z']]],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  // submitButtonOptions: {
  //   content: '查询',
  // },
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: false,
};

// 时间范围处理函数
const processTimeRange = (createTime: any) => {
  if (createTime && Array.isArray(createTime) && createTime.length === 2) {
    return {
      createTimeStart: createTime[0],
      createTimeEnd: createTime[1],
    };
  }
  return {};
};

// 表格配置
const gridOptions: VxeGridProps<HistoryRecord> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'experimentNo',
  },
  columns: useColumns(onActionClick),
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const params: any = {
          pageNo: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        };
        console.log('params:', params);
        const response = await getHistoryListApi(params);
        console.log('response:', response);
        return {
          items: response.records || [],
          total: response.total || 0,
        };
      },
    },
  },
};

// 使用 Vben 表格
const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<style scoped>
/* 自定义样式 */
</style>
