<template>
  <Page class="h-full">
    <template #title>
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold">{{ $t('page.system.dcu.title') }}</span>
      </div>
    </template>
    <div class="flex h-full flex-col rounded-md bg-white p-4 shadow-md">
      <Button type="primary" size="small" @click="onAdd" class="w-40"
        >{{ $t('page.system.dcu.addDevice') }}
      </Button>
      <AddModal>
        <NameForm />
      </AddModal>
      <Grid class="flex-1">
        <!-- 操作列：使用 slot 提供按钮事件 -->
        <template #action="{ row }">
          <Button type="link" size="small" @click="onDetail(row)">{{
            $t('page.common.details')
          }}</Button>
          <Button type="link" size="small" @click="onEdit(row)">{{
            $t('page.common.edit')
          }}</Button>
          <Popconfirm
            :title="$t('page.system.dcu.deleteDeviceConfirm')"
            :okText="$t('page.common.delete')"
            :cancelText="$t('page.common.cancel')"
            @confirm="onDelete(row)"
          >
            <Button type="link" size="small" danger>{{
              $t('page.common.delete')
            }}</Button>
          </Popconfirm>
        </template>
        <!-- 启用列：使用 slot 触发启用操作 -->
        <template #enable="{ row }">
          <Button
            :disabled="row.status === 1"
            type="link"
            size="small"
            @click="onEnable(row)"
            >{{ $t('page.system.dcu.enable') }}</Button
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
import { $t } from '@vben/locales';
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
    { type: 'seq', title: $t('page.common.index'), width: 80, align: 'center' },
    { field: 'name', title: $t('page.system.dcu.name'), minWidth: 200 },
    {
      field: 'status',
      title: $t('page.system.dcu.statusTitle'),
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellTag',
        options: [
          {
            value: 1,
            label: $t('page.system.dcu.status.enabled'),
            color: 'success',
          },
          {
            value: 0,
            label: $t('page.system.dcu.status.disabled'),
            color: 'error',
          },
        ],
      },
    },
    {
      title: $t('page.common.actions'),
      width: 220,
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
      componentProps: { placeholder: $t('page.system.dcu.namePlaceholder') },
      fieldName: 'name',
      label: $t('page.system.dcu.name'),
      rules: 'required',
    },
  ],
  showDefaultActions: false,
});

// 弹窗：引用示例用法
const [AddModal, addModalApi] = useVbenModal({
  title: $t('page.system.dcu.addDevice'),
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
    ? message.success({
        content: $t('page.common.addSuccess'),
        key: 'create_dcu',
      })
    : message.error({
        content: $t('page.common.addFailed'),
        key: 'create_dcu',
      });
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
          content: $t('page.common.deleteSuccessWithName', [row.name]),
          key: `delete_dcu_${row.id}`,
        })
      : message.error({
          content: $t('page.common.deleteFailed'),
          key: `delete_dcu_${row.id}`,
        });
    await GridApi.query();
  } catch (error) {
    message.error({
      content: $t('page.common.deleteFailed'),
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
        content: $t('page.common.enableSuccessWithName', [row.name]),
        key: `enable_dcu_${row.id}`,
      })
    : message.error({
        content: $t('page.common.enableFailedWithName', [row.name]),
        key: `enable_dcu_${row.id}`,
      });
  await GridApi.query();
}
</script>

<style scoped>
/* 表格操作按钮样式可根据需要调整 */
</style>
