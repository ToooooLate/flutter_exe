<template>
  <div class="test-environment-container min-h-[400px] p-4">
    <div class="mb-4">
      <h3 class="mb-1 text-lg font-semibold">TEST CONDITION</h3>
      <p class="text-gray-600">试验环境参数（可编辑）</p>
    </div>

    <div class="vp-raw w-full">
      <Descriptions title="试验环境参数" bordered :column="2">
        <DescriptionsItem label="地点 / Test place">
          <Input v-model:value="localData.testPlace" placeholder="请输入地点" />
        </DescriptionsItem>
        <DescriptionsItem label="试验温度 / Temperature">
          <InputNumber
            v-model:value="localData.temperature"
            placeholder="请输入温度"
            addon-after="°C"
          />
        </DescriptionsItem>
        <DescriptionsItem label="空气湿度 / Relative humidity">
          <InputNumber
            v-model:value="localData.relativeHumidity"
            placeholder="请输入湿度"
            addon-after="%"
          />
        </DescriptionsItem>
        <DescriptionsItem label="大气压力 / Atmosphere">
          <InputNumber
            v-model:value="localData.atmosphericPressure"
            placeholder="请输入压力"
            addon-after="kPa"
          />
        </DescriptionsItem>
        <DescriptionsItem label="检验日期 / Date of test" :span="2">
          <DatePicker
            v-model:value="localData.testDate"
            format="YYYY-MM-DD"
            placeholder="请选择日期"
            valueFormat="YYYY-MM-DDTHH:mm:ss"
            class="w-full"
          />
        </DescriptionsItem>
      </Descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { useExperimentStore } from '#/store/experiment';
import { useDataCollector } from '#/composables/useDataCollector';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import {
  Input,
  InputNumber,
  DatePicker,
  Descriptions,
  DescriptionsItem,
} from 'ant-design-vue';

// 定义环境数据类型
interface EnvironmentData {
  testPlace?: string;
  temperature?: number;
  relativeHumidity?: number;
  atmosphericPressure?: number;
  testDate?: string;
}

const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { registerCollector, unregisterCollector } = useDataCollector();

// 标志位，用于避免循环更新
const isUpdatingFromStore = ref(false);

// 本地数据状态
const localData = ref<EnvironmentData>({
  testPlace: '',
  temperature: 0,
  relativeHumidity: 0,
  atmosphericPressure: 0,
  testDate: null,
});

// 初始化本地数据
const initializeLocalData = () => {
  const env = experimentStore.state?.currentExperiment?.env || null;
  if (env) {
    localData.value = {
      testPlace: env.testPlace || '',
      temperature: env.temperature || 0,
      relativeHumidity: env.relativeHumidity || 0,
      atmosphericPressure: env.atmosphericPressure || 0,
      testDate: env.testDate || null,
    };
  }
};

// WebSocket 监听器函数 - 处理环境数据更新
const handleEnvironmentData = (data: Partial<EnvironmentData>) => {
  console.log('收到环境数据更新:', data);

  // 设置标志位，避免触发循环更新
  isUpdatingFromStore.value = true;

  // 更新本地数据
  localData.value = {
    ...localData.value,
    ...data,
  };

  // 重置标志位
  nextTick(() => {
    isUpdatingFromStore.value = false;
  });
};

// 数据收集器
const collector = {
  id: 'testEnvironment',
  name: 'TestEnvironment',
  component: 'TestEnvironment',
  type: 'environment',
  collect: async () => {
    // 过滤掉值为 undefined 的数据
    const filteredData = Object.fromEntries(
      Object.entries(localData.value).filter(
        ([key, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    console.log('收集环境数据:', filteredData);
    return filteredData;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    console.log('同步环境数据到store:', data);
    // 同步数据到store
    experimentStore.updateEnvironmentData(data);
  },
};

// 生命周期钩子
onMounted(() => {
  // 初始化本地数据
  initializeLocalData();

  // 注册数据收集器
  registerCollector(collector);

  // 注册 WebSocket 监听器 - 监听环境数据更新
  webSocketStore.registerMessageListener(
    WebSocketMessageType.ENVIRONMENT,
    handleEnvironmentData,
  );
});

onUnmounted(() => {
  // 取消注册数据收集器
  unregisterCollector('testEnvironment');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.ENVIRONMENT,
    handleEnvironmentData,
  );
});
</script>

<style scoped></style>
