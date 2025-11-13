<template>
  <div class="fluctuation-test">
    <h3 class="text-foreground mb-4 text-lg font-semibold">
      波动试验 Fluctuation Test
    </h3>

    <Tabs :activeKey="activeTab" @change="activeTab = $event" type="line" size="default">
      <TabPane key="frequency" tab="转速波动率测定">
        <FrequencyWaveMotionTest />
      </TabPane>
      <TabPane key="voltage" tab="电压波动率测定">
        <VoltageFluctuationTest />
      </TabPane>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Tabs, TabPane } from 'ant-design-vue';
import FrequencyWaveMotionTest from './FrequencyWaveMotionTest.vue';
import VoltageFluctuationTest from './VoltageFluctuationTest.vue';

// 当前激活的tab
const activeTab = ref('frequency');
</script>
