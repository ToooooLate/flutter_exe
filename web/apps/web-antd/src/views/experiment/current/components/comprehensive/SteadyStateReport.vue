<template>
  <div class="steady-state-report">
    <Tabs
      :activeKey="activeTab"
      :destroyInactiveTabPane="false"
      type="card"
      class="steady-tabs"
      @change="handleTabChange"
    >
      <TabPane key="speed" tab="机组稳态调速特性测定" :force-render="true">
        <keep-alive>
          <SteadySpeedCharacteristic v-show="activeTab === 'speed'" />
        </keep-alive>
      </TabPane>

      <TabPane key="voltage" tab="机组稳态电压调整率测定" :force-render="true">
        <keep-alive>
          <SteadyVoltageAdjustment v-show="activeTab === 'voltage'" />
        </keep-alive>
      </TabPane>

      <TabPane key="range" tab="机组稳态调速率可调范围和空载电压检查" :force-render="true">
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
// @ts-ignore
import SteadySpeedCharacteristic from './steady/SteadySpeedCharacteristic.vue';
// @ts-ignore
import SteadyVoltageAdjustment from './steady/SteadyVoltageAdjustment.vue';
// @ts-ignore
import SteadyRangeCheck from './steady/SteadyRangeCheck.vue';

// 当前激活的 Tab
const activeTab = ref('speed');

// 处理标签切换（避免 v-model 规则误报）
const handleTabChange = (key: string) => {
  activeTab.value = key;
};
</script>
