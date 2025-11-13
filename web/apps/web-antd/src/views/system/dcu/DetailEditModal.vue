<script lang="ts" setup>
import { ref, defineAsyncComponent } from 'vue';
import { Button, message, Popconfirm } from 'ant-design-vue';
import { useVbenModal } from '@vben/common-ui';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDcuDeviceDetailListApi, deleteDcuDeviceDetailApi } from '#/api';
const AddParamModalContent = defineAsyncComponent(
  () => import('./AddParamModal.vue'),
);

/** 当前设备ID与模式，由父组件通过 setData 传入 */
const mode = ref<'edit' | 'view'>('edit');
const currentSettingsId = ref<string>('');
const rowData = ref<Record<string, any>>({});

/** 表格配置：Index、参数名称、英文名称、高位地址、低位地址、删除 */
const gridOptions: VxeGridProps = {
  border: true,
  stripe: true,
  columnConfig: { resizable: true },
  columns: [
    { type: 'seq', title: 'Index', width: 70, align: 'center' },
    { field: 'nameCh', title: '参数名称', minWidth: 180 },
    { field: 'nameEn', title: '英文名称', minWidth: 180 },
    { field: 'highAddress', title: '高位地址', width: 140, align: 'center' },
    { field: 'lowAddress', title: '低位地址', width: 140, align: 'center' },
    { field: 'factor', title: '系数', width: 140, align: 'center' },
    {
      title: '操作',
      width: 160,
      align: 'center',
      fixed: 'right',
      slots: { default: 'action' },
      // 非编辑模式隐藏操作列
      visible: () => mode.value === 'edit',
    },
  ],
  proxyConfig: {
    ajax: {
      query: async () => {
        console.log('currentSettingsId.value', currentSettingsId.value);
        const res = await getDcuDeviceDetailListApi({
          id: currentSettingsId.value,
        });
        return {
          items: res ?? [],
          total: res.length ?? 0,
        };
      },
    },
  },
  pagerConfig: {
    enabled: false,
  },
  minHeight: 420,
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });

// 新增参数弹窗（抽离为单独组件并通过 connectedComponent 连接）
const [AddParamModal, addParamModalApi] = useVbenModal({
  title: '新增参数',
  connectedComponent: AddParamModalContent,
  closeOnClickModal: false,
  closeOnPressEscape: false,
});

const title = ref('');
// 主详情弹窗
const [Modal, modalApi] = useVbenModal({
  closeOnClickModal: false,
  closeOnPressEscape: false,
  onCancel() {
    console.log('onCancel');
    modalApi.close();
  },
  onConfirm() {
    // 保存仅关闭弹窗（不提交）
    console.log('onConfirm');
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData();
      mode.value = data.mode;
      title.value = `${mode.value === 'edit' ? '编辑' : '查看'} ${data?.record?.name}连接设置`;
      currentSettingsId.value = data?.record?.id ?? data?.id ?? '';
      rowData.value = data?.record ?? {};
    }
  },
});

function onAddParam() {
  console.log('addParamModalApi', addParamModalApi);
  addParamModalApi
    .setData({
      settingsId: currentSettingsId.value,
      mode: 'add',
      onSuccess: async () => {
        await GridApi.query();
      },
    })
    .open();
}

async function onDeleteRow(row: any) {
  try {
    const ok = await deleteDcuDeviceDetailApi({ id: row.id });
    if (ok) {
      message.success(`已删除：${row.nameCh ?? row.nameEn ?? row.id}`);
      await GridApi.query();
    } else {
      message.error('删除失败');
    }
  } catch (err) {
    message.error('删除失败');
  }
}

function onEditRow(row: any) {
  addParamModalApi
    .setData({
      settingsId: currentSettingsId.value,
      mode: 'edit',
      detailId: row?.id ?? '',
      initialValues: {
        nameCh: row?.nameCh ?? '',
        nameEn: row?.nameEn ?? '',
        highAddress: row?.highAddress ?? '',
        lowAddress: row?.lowAddress ?? '',
        factor: row?.factor ?? 0,
      },
      onSuccess: async () => {
        await GridApi.query();
      },
    })
    .open();
}
</script>

<template>
  <Modal :title="title" class="w-[960px]">
    <div class="mb-3 flex items-center justify-between">
      <Button
        type="primary"
        v-if="mode === 'edit'"
        size="small"
        class="w-28"
        @click="onAddParam"
        >新增参数</Button
      >
    </div>
    <Grid>
      <template #action="{ row }">
        <Button
          v-if="mode === 'edit'"
          type="link"
          size="small"
          @click="onEditRow(row)"
          >编辑</Button
        >
        <Popconfirm
          v-if="mode === 'edit'"
          title="确认删除该参数？"
          okText="删除"
          cancelText="取消"
          @confirm="onDeleteRow(row)"
        >
          <Button type="link" size="small" danger>删除</Button>
        </Popconfirm>
      </template>
    </Grid>

    <!-- 新增参数弹窗（使用 connectedComponent 提升隔离性） -->
    <AddParamModal />
  </Modal>
</template>

<style scoped></style>
