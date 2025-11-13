<template>
  <Page>
    <template #title>
      <div class="flex w-full items-center justify-between">
        <div class="flex flex-col gap-2">
          <!-- 实验编号 -->
          <div class="text-lg font-semibold text-gray-800">
            {{ $t('page.report.title') }}
          </div>
          <div class="text-sm text-gray-600">
            实验编号: {{ experimentNo || 'N/A' }}
          </div>
        </div>
      </div>
    </template>

    <div class="report-page">
      <!-- 纵向 Tabs 布局 -->
      <div class="report-tabs-container">
        <Tabs
          :activeKey="activeTab"
          @update:activeKey="(key) => (activeTab = key)"
          tab-position="left"
          type="card"
        >
          <TabPane key="performance">
            <template #tab>
              <span
                class="flex h-10 w-40 items-center text-wrap text-center text-xs leading-tight"
              >
                Test report of generator set's performance
              </span>
            </template>
            <GeneratorPerformanceReport />
          </TabPane>
        </Tabs>
      </div>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { Button, Tabs, TabPane } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { useExperimentStore } from '#/store/experiment';
import { useRoute } from 'vue-router';
import GeneratorPerformanceReport from './components/GeneratorPerformanceReport.vue';

// 实验store
const experimentStore = useExperimentStore();
const route = useRoute();

// 实验编号
const experimentNo = computed(() => {
  const fromRoute = (route.params?.experimentNo ?? route.query?.experimentNo ?? '') as string;
  return String(fromRoute || experimentStore.state.currentExperiment?.experimentNo || '');
});

// 当前激活的tab
const activeTab = ref('performance');
</script>
