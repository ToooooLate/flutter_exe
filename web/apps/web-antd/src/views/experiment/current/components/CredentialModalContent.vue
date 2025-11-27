<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue';
import { Button } from 'ant-design-vue';
import dayjs from 'dayjs';
// 单向数据流：通过事件通知父组件处理延长许可逻辑
const emit = defineEmits(['extend']);

const props = defineProps<{
  accessCredential: {
    url: string;
    account: string;
    password: string;
    begin?: number | string;
    end?: number | string;
  };
  copyText: (text: string) => void | Promise<void>;
  copyCredentialAll: () => void | Promise<void>;
}>();

function formatTimestamp(ts?: number | string): string {
  if (ts === undefined || ts === null) return '';
  const num = typeof ts === 'string' ? Number(ts) : ts;
  if (!num || Number.isNaN(num)) return '';
  // 10位(秒)转毫秒，13位(毫秒)保持
  const ms = num < 1e12 ? num * 1000 : num;
  return dayjs(ms).format('YYYY-MM-DD HH:mm:ss');
}

const formattedBegin = computed(() =>
  formatTimestamp(props.accessCredential.begin),
);
const formattedEnd = computed(() =>
  formatTimestamp(props.accessCredential.end),
);

function onExtendClick() {
  emit('extend');
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <div class="text-sm text-gray-500">
        {{ $t('experiment.current.credential.addressLabel') }}
      </div>
      <div class="flex items-center gap-2">
        <span class="break-all text-blue-600">{{
          props.accessCredential.url
        }}</span>
        <Button
          size="small"
          @click="props.copyText(props.accessCredential.url)"
          >{{ $t('experiment.current.credential.copy') }}</Button
        >
      </div>
    </div>
    <div>
      <div class="text-sm text-gray-500">
        {{ $t('experiment.current.credential.accountLabel') }}
      </div>
      <div class="flex items-center gap-2">
        <span>{{ props.accessCredential.account }}</span>
        <Button
          size="small"
          @click="props.copyText(props.accessCredential.account)"
          >{{ $t('experiment.current.credential.copy') }}</Button
        >
      </div>
    </div>
    <div>
      <div class="text-sm text-gray-500">
        {{ $t('experiment.current.credential.passwordLabel') }}
      </div>
      <div class="flex items-center gap-2">
        <span>{{ props.accessCredential.password }}</span>
        <Button
          size="small"
          @click="props.copyText(props.accessCredential.password)"
          >{{ $t('experiment.current.credential.copy') }}</Button
        >
      </div>
    </div>

    <div>
      <div class="text-sm text-gray-500">
        {{ $t('experiment.current.credential.expiresLabel') }}
      </div>
      <div class="flex items-center gap-2">
        <span>{{ formattedEnd }}</span>
        <Button size="small" @click="onExtendClick">{{
          $t('experiment.current.credential.extendLicense')
        }}</Button>
      </div>
    </div>

    <div class="pt-2">
      <Button type="primary" block @click="props.copyCredentialAll">{{
        $t('experiment.current.credential.copyAll')
      }}</Button>
    </div>
  </div>
</template>
