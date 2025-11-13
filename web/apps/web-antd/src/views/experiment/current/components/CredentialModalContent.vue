<script setup lang="ts">
// @ts-nocheck
import { Button } from 'ant-design-vue';

const props = defineProps<{
  accessCredential: { url: string; account: string; password: string };
  copyText: (text: string) => void | Promise<void>;
  copyCredentialAll: () => void | Promise<void>;
}>();
</script>

<template>
  <div class="space-y-3">
    <div>
      <div class="text-sm text-gray-500">临时访问地址</div>
      <div class="flex items-center gap-2">
        <span class="break-all text-blue-600">{{ props.accessCredential.url }}</span>
        <Button size="small" @click="props.copyText(props.accessCredential.url)">复制</Button>
      </div>
    </div>
    <div>
      <div class="text-sm text-gray-500">账号</div>
      <div class="flex items-center gap-2">
        <span>{{ props.accessCredential.account }}</span>
        <Button size="small" @click="props.copyText(props.accessCredential.account)">复制</Button>
      </div>
    </div>
    <div>
      <div class="text-sm text-gray-500">密码</div>
      <div class="flex items-center gap-2">
        <span>{{ props.accessCredential.password }}</span>
        <Button size="small" @click="props.copyText(props.accessCredential.password)">复制</Button>
      </div>
    </div>
    <div class="pt-2">
      <Button type="primary" block @click="props.copyCredentialAll">一键复制全部</Button>
    </div>
  </div>
</template>