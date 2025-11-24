<template>
  <Page class="h-full">
    <template #title>
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold">{{ $t('page.system.user.title') }}</span>
      </div>
    </template>

    <Grid>
      <!-- 工具栏：新增账号按钮 -->
      <template #toolbar-tools>
        <Button type="primary" size="small" class="w-32" @click="onAddAccount"
          >{{ $t('page.system.user.addAccount') }}</Button
        >
      </template>
      <template #action="{ row }">
        <Popconfirm
          :title="$t('page.system.user.resetConfirm')"
          :okText="$t('page.common.reset')"
          :cancelText="$t('page.common.cancel')"
          @confirm="onResetPassword(row)"
        >
          <Button type="link" size="small" :disabled="row.roleCode === 'guest'"
            >{{ $t('page.system.user.resetPassword') }}</Button
          >
        </Popconfirm>
        <Button
          type="link"
          size="small"
          :disabled="row.roleCode === 'guest'"
          @click="onEditAccount(row)"
          >{{ $t('page.common.edit') }}</Button
        >
        <Popconfirm
          :title="$t('page.system.user.deleteConfirm')"
          :okText="$t('page.common.delete')"
          :cancelText="$t('page.common.cancel')"
          @confirm="onDeleteAccount(row)"
        >
          <Button type="link" size="small" danger>{{ $t('page.common.delete') }}</Button>
        </Popconfirm>
      </template>
    </Grid>

    <!-- 新增/编辑弹窗 -->
    <AccountModal>
      <AccountForm />
    </AccountModal>
  </Page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { Button, Popconfirm, message } from 'ant-design-vue';
import { $t } from '@vben/locales';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useVbenForm, type VbenFormProps } from '#/adapter/form';
import {
  getRoleListApi,
  getUserAccountListApi,
  addUserAccountApi,
  updateUserAccountApi,
  deleteUserAccountApi,
  resetUserPasswordApi,
} from '#/api';

interface AccountItem {
  id: string;
  username: string;
  roleCode: string;
  status: 0 | 1;
}

// 将时间戳/日期转为 yyyy-MM-dd HH:mm:ss；无值返回空字符串
function formatYmdHms(input: unknown): string {
  if (input === null || input === undefined || input === '') return '';
  let date: Date | null = null;
  if (input instanceof Date) {
    date = input;
  } else {
    const num = Number(input);
    if (!Number.isNaN(num)) {
      const ms = num > 1e12 ? num : num * 1000; // 兼容秒/毫秒
      date = new Date(ms);
    } else {
      const d = new Date(String(input));
      date = Number.isNaN(d.getTime()) ? null : d;
    }
  }
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${mi}:${s}`;
}

// 角色选项（接口获取），以及客户角色id集合
const roleOptions = ref<
  Array<{ label: string; value: string; roleCode?: string }>
>([]);
function getRoleColorByLabel(roleCode: string) {
  if (roleCode === 'admin') return 'blue';
  if (roleCode === 'engineer') return 'success';
  if (roleCode === 'normal') return 'warning';
  if (roleCode === 'guest') return 'error';
  return 'blue';
}

async function loadRoles() {
  try {
    const res = await getRoleListApi({ pageNo: 1, pageSize: 100 });
    const list = res ?? [];
    roleOptions.value = list.map((r: any) => {
      const id = String(r?.id ?? r?.roleCode ?? r?.value ?? '');
      const label = String(
        r?.name ?? r?.roleName ?? r?.label ?? r?.title ?? id,
      );
      const roleCode = String(r?.roleCode ?? '');
      return { label, value: id, roleCode };
    });
  } catch (e) {
    console.warn('加载角色列表失败', e);
  }
}

// 表单过滤配置（参考历史记录页 formOptions）
const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('page.common.search') },
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('page.system.user.username'),
      componentProps: {
        placeholder: $t('page.system.user.usernamePlaceholder'),
        allowClear: true,
      },
    },
  ],
  showCollapseButton: false,
};

// 表格配置
const gridOptions: VxeGridProps = {
  border: true,
  stripe: true,
  columnConfig: { resizable: true },
  columns: [
    { type: 'seq', title: $t('page.common.index'), width: 80, align: 'center' },
    { field: 'username', title: $t('page.system.user.username'), minWidth: 200 },
    {
      field: 'roleCode',
      title: $t('page.system.user.role'),
      width: 140,
      align: 'center',
      cellRender: {
        name: 'CellTag',
        // 使用函数型 options，确保在渲染时计算并触发颜色映射
        options: () =>
          roleOptions.value.map((opt) => ({
            value: opt.roleCode ?? '',
            label: opt.label,
            color: getRoleColorByLabel(opt.roleCode ?? ''),
          })),
      },
    },
    {
      field: 'status',
      title: $t('page.system.user.statusTitle'),
      width: 140,
      align: 'center',
      cellRender: {
        name: 'CellTag',
        options: [
          { value: 1, label: $t('page.system.user.status.locked'), color: 'error' },
          { value: 0, label: $t('page.system.user.status.available'), color: 'success' },
        ],
      },
    },
    {
      field: 'begin',
      title: $t('page.system.user.createdAt'),
      minWidth: 180,
      formatter: ({ cellValue }: any) => formatYmdHms(cellValue),
    },
    {
      field: 'end',
      title: $t('page.system.user.expiredAt'),
      minWidth: 180,
      formatter: ({ cellValue }: any) => formatYmdHms(cellValue),
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
      query: async ({ page }, formValues) => {
        const res = await getUserAccountListApi({
          pageNo: page.currentPage,
          pageSize: page.pageSize,
          username: formValues?.username ?? '',
        });
        console.log('res', res, formValues);
        return {
          items: res.records || [],
          total: res.total || 0,
        };
      },
    },
  },
  minHeight: 480,
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 新增/编辑表单
const [AccountForm, accountFormApi] = useVbenForm({
  handleSubmit: async (values: Record<string, any>) => {
    const mode = modalApi.getData()?.mode as 'add' | 'edit';
    const params = {
      ...values,
      roleIds: [values.roleId],
    };
    if (mode === 'edit') {
      const res = await updateUserAccountApi({
        ...params,
        id: modalApi.getData()?.id,
      });
      message.success($t('page.common.editSuccess'));
    } else {
      const res = await addUserAccountApi(params);
      res ? message.success($t('page.common.addSuccess')) : message.error($t('page.common.addFailed'));
    }
    await GridApi.query();
    modalApi.close();
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('page.system.user.username'),
      rules: 'required',
      componentProps: { placeholder: $t('page.system.user.usernamePlaceholder') },
    },
    {
      component: 'Select',
      fieldName: 'roleId',
      label: $t('page.system.user.role'),
      rules: 'required',
      componentProps: {},
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.system.user.statusTitle'),
      rules: 'required',
      componentProps: {
        style: { width: '100%' },
        options: [
          { label: $t('page.system.user.status.available'), value: 0 },
          { label: $t('page.system.user.status.locked'), value: 1 },
        ],
      },
    },
  ],
  showDefaultActions: false,
});

// 弹窗
const [AccountModal, modalApi] = useVbenModal({
  title: $t('page.system.user.addAccount'),
  closeOnClickModal: false,
  closeOnPressEscape: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await accountFormApi.validateAndSubmitForm();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData();
      const mode = (data?.mode ?? 'add') as 'add' | 'edit';
      // 计算默认角色（按 roleCode 对齐）并动态更新 Select 的选项
      const defaultRoleId =
        roleOptions.value.find((o) => o.roleCode === 'normal')?.value ?? '';
      try {
        accountFormApi.updateSchema([
          {
            fieldName: 'roleId',
            componentProps: {
              style: { width: '100%' },
              options: roleOptions.value
                .filter((opt) => opt.roleCode !== 'guest')
                .map((opt) => ({
                  label: opt.label,
                  value: opt.value ?? '',
                })),
            },
          },
          {
            fieldName: 'status',
            componentProps: {
              style: { width: '100%' },
              disabled: mode === 'add',
            },
          },
        ]);
      } catch {}
      const initValues = (data?.initialValues ?? {
        username: data?.initialValues?.username ?? '',
        roleId: data?.initialValues?.roleId ?? defaultRoleId,
        status: data?.initialValues?.status ?? 0,
      }) as Partial<AccountItem>;
      accountFormApi.setValues(initValues);
      // @ts-ignore 更新标题（若支持）
      try {
        modalApi?.setState?.({
          title: mode === 'edit' ? $t('page.system.user.editAccount') : $t('page.system.user.addAccount'),
        });
      } catch {}
    }
  },
});

// 操作
function onAddAccount() {
  modalApi.setData({ mode: 'add' }).open();
}
function onEditAccount(row: AccountItem) {
  modalApi
    .setData({
      mode: 'edit',
      id: row.id,
      initialValues: {
        username: row.username,
        roleId: row.roleId,
        status: row.status,
      },
    })
    .open();
}
async function onDeleteAccount(row: AccountItem) {
  const username = row.username;
  // 通过代理查询刷新当前过滤后的数据
  try {
    await deleteUserAccountApi({ ids: [row.id] });
    message.success($t('page.common.deleteSuccessWithName', [username]));
  } catch {
    message.error($t('page.common.deleteFailed'));
  }
  GridApi.query();
}

async function onResetPassword(row: AccountItem) {
  const username = row.username;
  await resetUserPasswordApi({ username });
  message.success($t('page.common.resetSuccessWithName', [username]));
  GridApi.query();
}

onMounted(async () => {
  await loadRoles();
});
</script>

<style scoped></style>
