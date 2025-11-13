<template>
  <div class="fluctuation-report">
    <Tabs
      :activeKey="activeTab"
      :destroyInactiveTabPane="false"
      type="card"
      class="fluctuation-tabs"
      @change="handleTabChange"
    >
      <TabPane key="speed" tab="机组转速波动率测定" :force-render="true">
        <keep-alive>
          <SpeedFluctuationTest v-show="activeTab === 'speed'" />
        </keep-alive>
      </TabPane>

      <TabPane key="voltage" tab="机组电压波动率测定" :force-render="true">
        <keep-alive>
          <VoltageFluctuationTest v-show="activeTab === 'voltage'" />
        </keep-alive>
      </TabPane>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Tabs, TabPane } from 'ant-design-vue';
// @ts-ignore
import SpeedFluctuationTest from './fluctuation/SpeedFluctuationTest.vue';
// @ts-ignore
import VoltageFluctuationTest from './fluctuation/VoltageFluctuationTest.vue';

// 当前激活的 Tab
const activeTab = ref('speed');

const handleTabChange = (key: string) => {
  activeTab.value = key;
};
</script>

<style scoped>
.fluctuation-tabs {
  /* Tab 样式 */
}
</style>
