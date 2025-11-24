<script lang="ts" setup>
import { ref, nextTick, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
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
        message.success($t('page.system.dcu.editParamSuccess'));
        await modalData.value?.onSuccess?.();
        modalApi.close();
      } else {
        message.error($t('page.system.dcu.editParamFailed'));
      }
    } else {
      const ok = await addDcuDeviceApi(basePayload as any);
      if (ok) {
        message.success($t('page.system.dcu.addParamSuccess'));
        await modalData.value?.onSuccess?.();
        modalApi.close();
      } else {
        message.error($t('page.system.dcu.addParamFailed'));
      }
    }
  },
  schema: [
    {
      component: 'Select',
      componentProps: {
        placeholder: $t('page.system.dcu.selectParamPlaceholder'),
        getPopupContainer: () => document.body,
        popupClassName: 'select-popup-high',
        dropdownMatchSelectWidth: true,
        style: { width: '100%' },
        options: [
          {
            label: $t('page.system.dcu.selectParam'),
            value: '1111',
          },
        ],
      },
      fieldName: 'fieldSelect',
      label: $t('page.system.dcu.selectParam'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'nameCh',
      label: $t('page.system.dcu.paramName'),
      rules: 'required',
      componentProps: {
        disabled: true,
        placeholder: $t('page.system.dcu.paramNameZhPlaceholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'nameEn',
      label: $t('page.system.dcu.paramNameEn'),
      rules: 'required',
      componentProps: {
        disabled: true,
        placeholder: $t('page.system.dcu.paramNameEnPlaceholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'highAddress',
      label: $t('page.system.dcu.highAddress'),
      rules: 'required',
      componentProps: { placeholder: $t('page.system.dcu.highAddressPlaceholder') },
    },
    {
      component: 'Input',
      fieldName: 'lowAddress',
      label: $t('page.system.dcu.lowAddress'),
      rules: 'required',
      componentProps: { placeholder: $t('page.system.dcu.lowAddressPlaceholder') },
    },
    {
      component: 'InputNumber',
      fieldName: 'factor',
      label: $t('page.system.dcu.factor'),
      rules: 'required',
      componentProps: {
        style: { width: '100%' },
        placeholder: $t('page.system.dcu.factorPlaceholder'),
        min: 0,
        step: 1,
      },
    },
  ],
  showDefaultActions: false,
});
const fieldSelectList = ref([]);

const [Modal, modalApi] = useVbenModal({
  title: $t('page.system.dcu.addParam'),
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
          modalApi?.setState?.({ title: $t('page.system.dcu.editParam') });
        } else {
          // @ts-ignore
          modalApi?.setState?.({ title: $t('page.system.dcu.addParam') });
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
