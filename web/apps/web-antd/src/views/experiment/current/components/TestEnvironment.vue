<template>
  <div class="test-environment-container min-h-[400px] p-4">
    <div class="mb-4">
      <h3 class="mb-1 text-lg font-semibold">{{ t('experiment.current.environment.titleEn') }}</h3>
      <p class="text-gray-600">{{ t('experiment.current.environment.title') }}</p>
    </div>

    <div class="vp-raw w-full">
      <Descriptions :title="t('experiment.current.environment.descriptionsTitle')" bordered :column="2">
        <DescriptionsItem :label="t('experiment.current.environment.fields.testPlace')">
          <Input
            v-model:value="localData.testPlace"
            :placeholder="t('experiment.current.environment.placeholders.testPlace')"
            :disabled="!isEditable"
          />
        </DescriptionsItem>
        <DescriptionsItem :label="t('experiment.current.environment.fields.temperature')">
          <InputNumber
            v-model:value="localData.temperature"
            :placeholder="t('experiment.current.environment.placeholders.temperature')"
            addon-after="°C"
            :disabled="!isEditable"
          />
        </DescriptionsItem>
        <DescriptionsItem :label="t('experiment.current.environment.fields.relativeHumidity')">
          <InputNumber
            v-model:value="localData.relativeHumidity"
            :placeholder="t('experiment.current.environment.placeholders.relativeHumidity')"
            addon-after="%"
            :disabled="!isEditable"
          />
        </DescriptionsItem>
        <DescriptionsItem :label="t('experiment.current.environment.fields.atmosphere')">
          <InputNumber
            v-model:value="localData.atmosphericPressure"
            :placeholder="t('experiment.current.environment.placeholders.atmosphere')"
            addon-after="kPa"
            :disabled="!isEditable"
          />
        </DescriptionsItem>
        <DescriptionsItem :label="t('experiment.current.environment.fields.dateOfTest')" :span="2">
          <DatePicker
            v-model:value="localData.testDate"
            format="YYYY-MM-DD"
            :placeholder="t('experiment.current.environment.placeholders.dateOfTest')"
            valueFormat="YYYY-MM-DDTHH:mm:ss"
            class="w-full"
            :disabled="!isEditable"
          />
        </DescriptionsItem>
      </Descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useExperimentStore } from '#/store/experiment';
import { useDataCollector } from '#/composables/useDataCollector';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import dayjs from 'dayjs';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { useI18n } from '@vben/locales';
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
const { t } = useI18n();

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

// 是否可编辑：权限+实验状态
const isEditable = computed(() => canEditTable());

// 初始化本地数据
const initializeLocalData = () => {
  const env = experimentStore.state?.currentExperiment?.env || null;
  if (env) {
    localData.value = {
      testPlace: env.testPlace || '',
      temperature: env.temperature || 0,
      relativeHumidity: env.relativeHumidity || 0,
      atmosphericPressure: env.atmosphericPressure || 0,
      testDate: dateTransform(env.testDate),
    };
  }
};

const dateTransform = (value: any) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number')
    return dayjs(value).format('YYYY-MM-DDTHH:mm:ss');
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DDTHH:mm:ss');
  if (typeof value === 'string') {
    if (/^\d{13}$/.test(value))
      return dayjs(Number(value)).format('YYYY-MM-DDTHH:mm:ss');
    return value;
  }
  return null;
};

// WebSocket 监听器函数 - 处理环境数据更新
const handleEnvironmentData = (data: any) => {
  console.log('收到环境数据更新:', data.env);

  // 检查是否有环境数据
  if (!data.env) return;

  // 设置标志位，避免触发循环更新
  if (isUpdatingFromStore.value) return;
  isUpdatingFromStore.value = true;
  console.log('localData.value:', localData.value);

  // 更新本地数据
  localData.value = {
    ...localData.value,
    ...data.env,
    testDate: dateTransform(data.env.testDate),
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
    WebSocketMessageType.EXPERIMENT,
    handleEnvironmentData,
  );
});

onUnmounted(() => {
  // 取消注册数据收集器
  unregisterCollector('testEnvironment');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleEnvironmentData,
  );
});
</script>

<style scoped></style>
