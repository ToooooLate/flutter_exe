<template>
  <div class="fluctuation-report">
    <Tabs
      :activeKey="activeTab"
      :destroyInactiveTabPane="false"
      type="card"
      class="fluctuation-tabs"
      @change="handleTabChange"
    >
      <TabPane
        key="speed"
        :tab="t('experiment.current.comprehensive.fluctuation.speed.title')"
        :force-render="true"
      >
        <keep-alive>
          <SpeedFluctuationTest v-show="activeTab === 'speed'" />
        </keep-alive>
      </TabPane>

      <TabPane
        key="voltage"
        :tab="t('experiment.current.comprehensive.fluctuation.voltage.title')"
        :force-render="true"
      >
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
import { useI18n } from '@vben/locales';
// @ts-ignore
import SpeedFluctuationTest from './fluctuation/SpeedFluctuationTest.vue';
// @ts-ignore
import VoltageFluctuationTest from './fluctuation/VoltageFluctuationTest.vue';

// 当前激活的 Tab
const activeTab = ref('speed');

const { t } = useI18n();

const handleTabChange = (key: string) => {
  activeTab.value = key;
};
</script>

<style scoped>
.fluctuation-tabs {
  /* Tab 样式 */
}
</style>
