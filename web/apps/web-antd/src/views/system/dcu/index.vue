<template>
  <Page class="h-full">
    <template #title>
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold">DCU连接设备管理</span>
      </div>
    </template>
    <div class="flex h-full flex-col rounded-md bg-white p-4 shadow-md">
      <Button type="primary" size="small" @click="onAdd" class="w-40"
        >新增DCU连接设备
      </Button>
      <AddModal>
        <NameForm />
      </AddModal>
      <Grid class="flex-1">
        <!-- 操作列：使用 slot 提供按钮事件 -->
        <template #action="{ row }">
          <Button type="link" size="small" @click="onDetail(row)">详情</Button>
          <Button type="link" size="small" @click="onEdit(row)">编辑</Button>
          <Popconfirm
            title="确认删除该设备？"
            okText="删除"
            cancelText="取消"
            @confirm="onDelete(row)"
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </template>
        <!-- 启用列：使用 slot 触发启用操作 -->
        <template #enable="{ row }">
          <Button
            :disabled="row.status === 1"
            type="link"
            size="small"
            @click="onEnable(row)"
            >启用</Button
          >
        </template>
      </Grid>
      <!-- 详情/编辑共用模态框 -->
      <DetailModal />
    </div>
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { Button, message, Popconfirm } from 'ant-design-vue';
import { useExperimentStore } from '#/store/experiment';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useVbenForm } from '#/adapter/form';
import {
  createDcuDeviceApi,
  getDcuDeviceListApi,
  enableDcuDeviceApi,
  deleteDcuDeviceApi,
} from '#/api';
import DetailEditModal from './DetailEditModal.vue';

interface DcuDeviceItem {
  id: string;
  index: number;
  name: string;
  status: number; // 1: 启用中, 0: 未启用
}

const gridOptions: VxeGridProps = {
  border: true,
  stripe: true,
  columnConfig: { resizable: true },
  columns: [
    { type: 'seq', title: 'Index', width: 80, align: 'center' },
    { field: 'name', title: '名称', minWidth: 200 },
    {
      field: 'status',
      title: '启用状态',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellTag',
        options: [
          { value: 1, label: '启用中', color: 'success' },
          { value: 0, label: '未启用', color: 'error' },
        ],
      },
    },
    {
      title: '操作',
      width: 160,
      align: 'center',
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const res = await getDcuDeviceListApi({
          pageNo: page.currentPage,
          pageSize: page.pageSize,
        });
        // vxe-table 适配器默认期望 { items, total }
        return {
          items: res.records ?? [],
          total: res.total ?? res?.pagination?.total ?? 0,
        };
      },
    },
  },
  minHeight: 600,
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });
const experimentStore = useExperimentStore();

// 内嵌表单：仅一个名称字段
const [NameForm, nameFormApi] = useVbenForm({
  handleSubmit: async (values: Record<string, any>) => {
    await handleCreate(values.name);
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入名称' },
      fieldName: 'name',
      label: '名称',
      rules: 'required',
    },
  ],
  showDefaultActions: false,
});

// 弹窗：引用示例用法
const [AddModal, addModalApi] = useVbenModal({
  title: '新增DCU连接设备',
  onCancel() {
    addModalApi.close();
  },
  onConfirm: async () => {
    await nameFormApi.validateAndSubmitForm();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      nameFormApi.setValues({ name: '' });
    }
  },
});

// 详情/编辑模态（使用 connectedComponent 分离内容组件）
const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: DetailEditModal,
  destroyOnClose: true,
});

function onAdd() {
  addModalApi.open();
}

async function handleCreate(name: string) {
  // 调用接口创建
  const res = await createDcuDeviceApi({ name });
  await GridApi.query();
  res
    ? message.success({ content: '创建成功', key: 'create_dcu' })
    : message.error({ content: '创建失败', key: 'create_dcu' });
  addModalApi.close();
}

function onDetail(row: DcuDeviceItem) {
  detailModalApi.setData({ mode: 'detail', record: row }).open();
}
function onEdit(row: DcuDeviceItem) {
  detailModalApi.setData({ mode: 'edit', record: row }).open();
}
async function onDelete(row: DcuDeviceItem) {
  try {
    const res = await deleteDcuDeviceApi({ id: row.id });
    res
      ? message.success({
          content: `已删除：${row.name}`,
          key: `delete_dcu_${row.id}`,
        })
      : message.error({
          content: `删除失败：${row.name}`,
          key: `delete_dcu_${row.id}`,
        });
    await GridApi.query();
  } catch (error) {
    message.error({
      content: `删除失败：${row.name}`,
      key: `delete_dcu_${row.id}`,
    });
  }
}
async function onEnable(row: DcuDeviceItem) {
  const res = await enableDcuDeviceApi({
    id: row.id,
    experimentId: experimentStore.state.currentExperiment?.id || '',
  });
  res
    ? message.success({
        content: `已启用：${row.name}`,
        key: `enable_dcu_${row.id}`,
      })
    : message.error({
        content: `启用失败：${row.name}`,
        key: `enable_dcu_${row.id}`,
      });
  await GridApi.query();
}
</script>

<style scoped>
/* 表格操作按钮样式可根据需要调整 */
</style>
