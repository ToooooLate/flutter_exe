<template>
  <div class="protection-device-test-container min-h-[400px] p-4">
    <div class="mb-4">
      <h3 class="mb-1 text-lg font-semibold">机组保护装置试验</h3>
      <p class="text-gray-600">测试设备：压力表，油加热装置</p>
    </div>

    <!-- Tab 切换 -->
    <div class="mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-content">
      <!-- 超速保护试验 -->
      <div v-show="activeTab === 'overspeed'" class="overspeed-protection">
        <OverspeedProtectionTest />
      </div>

      <!-- 保护试验 -->
      <div v-show="activeTab === 'protection'" class="protection-test">
        <ProtectionTest />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import OverspeedProtectionTest from './OverspeedProtectionTest.vue';
import ProtectionTest from './ProtectionTest.vue';

const activeTab = ref('overspeed');

const tabs = [
  { key: 'overspeed', label: '超速保护试验' },
  { key: 'protection', label: '保护试验' },
];
</script>

<style scoped>
.tab-content {
  min-height: 400px;
}
</style>
