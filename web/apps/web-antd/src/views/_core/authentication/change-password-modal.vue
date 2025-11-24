<script lang="ts" setup>
import { ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message, InputPassword } from 'ant-design-vue';
import { changePasswordApi } from '#/api/core/auth';
import { useUserStore } from '#/store';
import { $t } from '@vben/locales';

const userStore = useUserStore();
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const submitting = ref(false);

const [Modal, modalApi] = useVbenModal({
  class: 'w-[480px]',
  closeOnClickModal: false,
  closeOnPressEscape: false,
  async onConfirm() {
    await submitChangePassword();
  },
  onCancel() {
    resetForm();
  },
});

function resetForm() {
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  submitting.value = false;
}

async function submitChangePassword() {
  if (!oldPassword.value || !newPassword.value) {
    message.warning($t('authentication.passwordRequired'));
    return;
  }
  if (newPassword.value.length < 6) {
    message.warning($t('authentication.passwordTooShort'));
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    message.warning($t('authentication.passwordMismatch'));
    return;
  }
  if (oldPassword.value === newPassword.value) {
    message.warning($t('authentication.passwordSameAsOld'));
    return;
  }
  submitting.value = true;
  const res = await changePasswordApi({
    username: userStore.userInfo?.username || '',
    oldPassword: oldPassword.value,
    newPassword: newPassword.value,
    checkPassword: confirmPassword.value,
  });
  message.success($t('authentication.passwordChangeSuccess'));
  modalApi.close();
  resetForm();
  submitting.value = false;
}

const open = () => modalApi.open();
const close = () => modalApi.close();
defineExpose({ open, close });
</script>

<template>
  <Modal :title="$t('authentication.changePassword')">
    <div class="flex flex-col gap-4 py-2">
      <div class="flex flex-col gap-2">
        <span class="text-sm text-gray-600">{{ $t('authentication.oldPassword') }}</span>
        <InputPassword
          v-model:value="oldPassword"
          type="password"
          :placeholder="$t('authentication.oldPasswordPlaceholder')"
        />
      </div>
      <div class="flex flex-col gap-2">
        <span class="text-sm text-gray-600">{{ $t('authentication.newPassword') }}</span>
        <InputPassword
          v-model:value="newPassword"
          type="password"
          :placeholder="$t('authentication.newPasswordPlaceholder')"
        />
      </div>
      <div class="flex flex-col gap-2">
        <span class="text-sm text-gray-600">{{ $t('authentication.confirmNewPassword') }}</span>
        <InputPassword
          v-model:value="confirmPassword"
          type="password"
          :placeholder="$t('authentication.confirmNewPasswordPlaceholder')"
        />
      </div>
    </div>
  </Modal>
</template>

<style scoped></style>
