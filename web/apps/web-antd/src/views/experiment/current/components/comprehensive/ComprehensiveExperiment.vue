<template>
  <div class="comprehensive-experiment">
    <!-- 功能模块选择 -->
    <div class="mb-6">
      <Tabs
        :activeKey="activeSubTab"
        :destroyInactiveTabPane="false"
        @change="handleSubTabChange"
      >
        <TabPane
          v-for="tab in subTabs"
          :key="tab.key"
          :tab="tab.label"
          :force-render="true"
        >
          <!-- 每个子功能内容放入对应 TabPane，强制渲染保证初始即挂载 -->
          <div class="min-h-[300px] rounded-lg bg-gray-50 p-4">
            <component
              :is="subComponentMap[tab.key]"
              :key="tab.key"
              v-show="activeSubTab === tab.key"
            />
          </div>
        </TabPane>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Card, Button, Tabs, TabPane, message } from 'ant-design-vue';
import { useI18n } from '@vben/locales';
// @ts-ignore
import DataMeasurement from './DataMeasurement.vue';
// @ts-ignore
import LoadTestReport from './LoadTestReport.vue';
// @ts-ignore
import SteadyStateReport from './SteadyStateReport.vue';
// @ts-ignore
import FluctuationReport from './FluctuationReport.vue';

// 子功能标签页配置
const activeSubTab = ref('dataMeasurement');
const { t } = useI18n();

const subTabs = [
  { key: 'dataMeasurement', label: t('experiment.current.comprehensive.subTabs.dataMeasurement') },
  { key: 'loadTestReport', label: t('experiment.current.comprehensive.subTabs.loadTestReport') },
  { key: 'steadyStateReport', label: t('experiment.current.comprehensive.subTabs.steadyStateReport') },
  { key: 'fluctuationReport', label: t('experiment.current.comprehensive.subTabs.fluctuationReport') },
];

// 子组件映射
const subComponentMap = ref({
  dataMeasurement: DataMeasurement,
  loadTestReport: LoadTestReport,
  steadyStateReport: SteadyStateReport,
  fluctuationReport: FluctuationReport,
});

// 获取标签页图标
const getTabIcon = (key: string) => {
  const iconMap: Record<string, string> = {
    dataMeasurement: '📊',
    loadTestReport: '⚡',
    steadyStateReport: '🔒',
    fluctuationReport: '📈',
  };
  return iconMap[key] || '🔧';
};

// 处理子标签页切换
const handleSubTabChange = (key: string) => {
  activeSubTab.value = key;
  console.log('切换到子功能:', key);
};
</script>

<style scoped>
.comprehensive-experiment :deep(.ant-tabs-content-holder) {
  padding: 0;
}

.comprehensive-experiment :deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
}
</style>
