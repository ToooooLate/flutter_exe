<template>
  <div class="data-measurement">
    <Tabs v-model="activeTab" type="card" :destroy-inactive-tab-pane="false">
      <TabPane
        v-for="(experiment, index) in experiments"
        :key="experiment.key"
        :tab="experiment.tab"
        :force-render="true"
      >
        <IntegratedCheckForm
          :ref="(el) => (integratedFormRefs[index] = el)"
          :data="experiment.data"
          :experiment-index="experiment.index"
          @update:data="experiment.updateHandler"
          @save="handleSave"
        />
      </TabPane>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Tabs, TabPane, message } from 'ant-design-vue';
import { useExperimentStore } from '#/store/experiment';
import { useDataCollector } from '#/composables/useDataCollector';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import type { IntegratedCheckItem } from '#/store';
import IntegratedCheckForm from './IntegratedCheckForm.vue';
import { $t } from '#/locales';

const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore(); // 数据收集器
const { registerCollector, unregisterCollector } = useDataCollector();

// 避免循环更新的标志位
const isUpdatingFromWebSocket = ref(false);

// WebSocket 监听器函数
const handleExperimentData = (data: any) => {
  if (isUpdatingFromWebSocket.value) return;

  try {
    isUpdatingFromWebSocket.value = true;

    // 处理全量实验数据更新
    experimentConfigs.forEach((config, index) => {
      // 使用子组件的 getTableData 方法获取数据
      const formRef = integratedFormRefs.value[index];
      if (
        formRef &&
        formRef?.updateTableData &&
        data?.[config.storeKey] &&
        data?.[config.storeKey].length > 0
      ) {
        formRef.updateTableData(data[config.storeKey]);
      }
    });
  } catch (error) {
    console.error('处理数据测量 WebSocket 消息时出错:', error);
  } finally {
    isUpdatingFromWebSocket.value = false;
  }
};

const handleIntegratedExperimentData = (data: any) => {
  if (!data) {
    message.error($t('experiment.current.message.integratedPushFailed'));
    return;
  }
  if (data.experimentStatus === false) {
    handleExperimentData(data);
  } else {
    if (isUpdatingFromWebSocket.value) return;

    experimentConfigs.forEach((config, index) => {
      // 使用子组件的 getTableData 方法获取数据
      const formRef = integratedFormRefs.value[index];
      if (
        formRef &&
        formRef?.updateTableData &&
        data?.[config.storeKey] &&
        data?.[config.storeKey].length > 0
      ) {
        formRef.updateTableData(
          data[config.storeKey],
          data.testCount,
          'INTEGRATED_EXPERIMENT',
          data?.experimentStatus,
        );
      }
    });
  }
};

const activeTab = ref('1');

// 实验配置
const experimentConfigs = [
  { key: '1', tab: $t('experiment.current.comprehensive.experiments.first'), index: 1, storeKey: 'integratedList' },
  { key: '2', tab: $t('experiment.current.comprehensive.experiments.second'), index: 2, storeKey: 'integrated2List' },
  { key: '3', tab: $t('experiment.current.comprehensive.experiments.third'), index: 3, storeKey: 'integrated3List' },
] as const;

// 函数工厂：创建更新函数
const createUpdateHandler = (storeKey: keyof typeof experimentStore) => {
  return (data: IntegratedCheckItem[]) => {
    (experimentStore.state.currentExperiment as any)[storeKey] = data;
  };
};

// 计算属性：实验数据配置
const experiments = computed(() => {
  return experimentConfigs.map((config) => ({
    ...config,
    data: computed(() => {
      const cur = experimentStore.state.currentExperiment as any;
      return cur?.[config.storeKey] ?? [];
    }),
    updateHandler: createUpdateHandler(config.storeKey),
  }));
});

// 获取组件引用
const integratedFormRefs = ref<InstanceType<typeof IntegratedCheckForm>[]>([]);

// 保存数据
const handleSave = (experimentIndex: number) => {
  console.log(`保存第${experimentIndex}次实验数据`);
  // 这里可以添加保存到后端的逻辑
};

// 数据收集器
const collector = {
  id: 'dataMeasurement',
  name: 'DataMeasurement',
  component: 'DataMeasurement',
  type: 'dataMeasurement',
  collect: () => {
    const result: Record<string, any> = {};
    experimentConfigs.forEach((config, index) => {
      // 使用子组件的 getTableData 方法获取数据
      const formRef = integratedFormRefs.value[index];
      if (formRef && formRef?.getTableData) {
        const tableData = formRef.getTableData();
        result[config.storeKey] = tableData.localData.map((item) => {
          const dataSource = item.visible
            ? tableData.fullData.find(
                (row) => row.serialNumber === item.serialNumber,
              ) || item
            : item;
          return { ...dataSource };
        });
      } else {
        result[config.storeKey] = [];
      }
    });
    return result;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 使用新的 API 函数更新 store
    console.log('syncToStore 调用，数据:', data);
    experimentStore.updateIntegratedList(data);
  },
};

// 生命周期钩子
onMounted(() => {
  const currentExperiment = experimentStore.state.currentExperiment;
  handleExperimentData(JSON.parse(JSON.stringify(currentExperiment)));

  registerCollector(collector);

  // 注册 WebSocket 监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleExperimentData,
  );

  // 注册综合试验数据监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleIntegratedExperimentData,
  );
});

onUnmounted(() => {
  unregisterCollector('dataMeasurement');

  // 注销 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleExperimentData,
  );

  // 注销综合试验数据监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleIntegratedExperimentData,
  );
});
</script>

<style scoped>
.integrated-tabs :deep(.ant-tabs-content-holder) {
  padding: 16px 0;
}

.integrated-tabs :deep(.ant-tabs-tab) {
  font-weight: 500;
}
</style>
