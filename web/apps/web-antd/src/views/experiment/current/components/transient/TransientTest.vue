<template>
  <div class="p-6">
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800">瞬态实验</h3>
      <p class="text-sm text-gray-600">瞬态条件下的性能测试</p>
    </div>

    <!-- Tab 切换 -->
    <div class="mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'speed'"
            :class="[
              'whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium',
              activeTab === 'speed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ]"
          >
            瞬态调速率和稳定时间测定
          </button>
          <button
            @click="activeTab = 'voltage'"
            :class="[
              'whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium',
              activeTab === 'voltage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ]"
          >
            瞬态电压变化率和稳定时间测定
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-content">
      <TransientSpeedRegulation v-show="activeTab === 'speed'" />
      <TransientVoltageChange v-show="activeTab === 'voltage'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TransientSpeedRegulation from './TransientSpeedRegulation.vue';
import TransientVoltageChange from './TransientVoltageChange.vue';

// 当前激活的tab
const activeTab = ref<'speed' | 'voltage'>('speed');
</script>

<style scoped>
.tab-content {
  min-height: 400px;
}
</style>
