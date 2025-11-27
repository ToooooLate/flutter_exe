<template>
  <div class="steady-state-report">
    <Tabs
      :activeKey="activeTab"
      :destroyInactiveTabPane="false"
      type="card"
      class="steady-tabs"
      @change="handleTabChange"
    >
      <TabPane key="speed" :tab="t('experiment.comprehensive.steady.tabs.speed')" :force-render="true">
        <keep-alive>
          <SteadySpeedCharacteristic v-show="activeTab === 'speed'" />
        </keep-alive>
      </TabPane>

      <TabPane key="voltage" :tab="t('experiment.comprehensive.steady.tabs.voltage')" :force-render="true">
        <keep-alive>
          <SteadyVoltageAdjustment v-show="activeTab === 'voltage'" />
        </keep-alive>
      </TabPane>

      <TabPane key="range" :tab="t('experiment.comprehensive.steady.tabs.range')" :force-render="true">
        <keep-alive>
          <SteadyRangeCheck v-show="activeTab === 'range'" />
        </keep-alive>
      </TabPane>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Tabs, TabPane } from 'ant-design-vue';
import { useI18n } from '@vben/locales';
// @ts-ignore
import SteadySpeedCharacteristic from './steady/SteadySpeedCharacteristic.vue';
// @ts-ignore
import SteadyVoltageAdjustment from './steady/SteadyVoltageAdjustment.vue';
// @ts-ignore
import SteadyRangeCheck from './steady/SteadyRangeCheck.vue';

// 当前激活的 Tab
const activeTab = ref('speed');

const { t } = useI18n();

// 处理标签切换（避免 v-model 规则误报）
const handleTabChange = (key: string) => {
  activeTab.value = key;
};
</script>
