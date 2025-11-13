<script lang="ts" setup>
import { ref, nextTick, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useVbenModal } from '@vben/common-ui';
//
// @ts-ignore
import { useVbenForm } from '#/adapter/form';
// @ts-ignore
import {
  addDcuDeviceApi,
  updateDcuDeviceDetailApi,
  getDcuDeviceConnectionFieldListApi,
} from '#/api';

type ModalData = {
  settingsId: string;
  mode?: 'add' | 'edit';
  detailId?: string;
  initialValues?: Partial<{
    nameCh: string;
    nameEn: string;
    highAddress: string;
    lowAddress: string;
    factor: number;
    fieldSelect: string;
  }>;
  onSuccess?: () => Promise<void> | void;
};

const modalData = ref<ModalData | null>(null);

const [AddForm, addFormApi] = useVbenForm({
  handleSubmit: async (values: Record<string, any>) => {
    const isEdit = modalData.value?.mode === 'edit';
    const basePayload = {
      settingsId: modalData.value?.settingsId ?? '',
      nameCh: values.nameCh,
      nameEn: values.nameEn,
      highAddress: values.highAddress,
      lowAddress: values.lowAddress,
      factor: values.factor,
    };
    if (isEdit) {
      const updatePayload = {
        id: modalData.value?.detailId ?? '',
        ...basePayload,
      };
      const ok = await updateDcuDeviceDetailApi(updatePayload as any);
      if (ok) {
        message.success('编辑参数成功');
        await modalData.value?.onSuccess?.();
        modalApi.close();
      } else {
        message.error('编辑参数失败');
      }
    } else {
      const ok = await addDcuDeviceApi(basePayload as any);
      if (ok) {
        message.success('新增参数成功');
        await modalData.value?.onSuccess?.();
        modalApi.close();
      } else {
        message.error('新增参数失败');
      }
    }
  },
  schema: [
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择DCU参数',
        getPopupContainer: () => document.body,
        popupClassName: 'select-popup-high',
        dropdownMatchSelectWidth: true,
        style: { width: '100%' },
        options: [
          {
            label: '选择参数',
            value: '1111',
          },
        ],
      },
      fieldName: 'fieldSelect',
      label: '选择参数',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'nameCh',
      label: '参数名称',
      rules: 'required',
      componentProps: {
        disabled: true,
        placeholder: '请输入参数中文名称',
      },
    },
    {
      component: 'Input',
      fieldName: 'nameEn',
      label: '英文名称',
      rules: 'required',
      componentProps: {
        disabled: true,
        placeholder: '请输入英文名称',
      },
    },
    {
      component: 'Input',
      fieldName: 'highAddress',
      label: '高位地址',
      rules: 'required',
      componentProps: { placeholder: '请输入高位地址' },
    },
    {
      component: 'Input',
      fieldName: 'lowAddress',
      label: '低位地址',
      rules: 'required',
      componentProps: { placeholder: '请输入低位地址' },
    },
    {
      component: 'InputNumber',
      fieldName: 'factor',
      label: '系数',
      rules: 'required',
      componentProps: {
        style: { width: '100%' },
        placeholder: '请输入系数',
        min: 0,
        step: 1,
      },
    },
  ],
  showDefaultActions: false,
});
const fieldSelectList = ref([]);

const [Modal, modalApi] = useVbenModal({
  title: '新增参数',
  closeOnClickModal: false,
  closeOnPressEscape: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await addFormApi.validateAndSubmitForm();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      modalData.value = modalApi.getData();
      // 根据是否传入 initialValues 回填表单
      const init = modalData.value?.initialValues ?? {};
      addFormApi.setValues({
        nameCh: init.nameCh ?? '',
        nameEn: init.nameEn ?? '',
        highAddress: init.highAddress ?? '',
        lowAddress: init.lowAddress ?? '',
        factor: typeof init.factor === 'number' ? init.factor : 0,
        fieldSelect: init.fieldSelect ?? '',
      });
      // 可选：根据 mode 更新弹窗标题（若支持）
      try {
        if (modalData.value?.mode === 'edit') {
          // 某些实现可能使用 setState/setProps，这里尝试 setState
          // @ts-ignore
          modalApi?.setState?.({ title: '编辑参数' });
        } else {
          // @ts-ignore
          modalApi?.setState?.({ title: '新增参数' });
        }
      } catch {}
    }
  },
});

const onSelectField = (value: string) => {
  console.log('onSelectField', value);
  const item = fieldSelectList.value.find((item) => item.value === value);
  if (item) {
    addFormApi?.setValues?.({
      nameCh: item.nameCh,
      nameEn: item.nameEn,
    });
  }
};

onMounted(async () => {
  const res = (await getDcuDeviceConnectionFieldListApi({})) ?? [];
  fieldSelectList.value = res.map((item) => {
    const name = `${item.nameCh}(${item.nameEn})`;
    return {
      label: String(name),
      value: String(item.id ?? name),
      nameCh: item.nameCh,
      nameEn: item.nameEn,
    };
  });
  console.log('fieldSelectList', fieldSelectList.value);
  addFormApi?.updateSchema?.([
    {
      fieldName: 'fieldSelect',
      componentProps: {
        options: [...fieldSelectList.value],
        onChange: onSelectField,
      },
    },
  ]);
});
</script>

<template>
  <Modal>
    <AddForm />
  </Modal>
</template>

<style scoped></style>
<style>
.select-popup-high {
  z-index: 5000 !important;
}
</style>
