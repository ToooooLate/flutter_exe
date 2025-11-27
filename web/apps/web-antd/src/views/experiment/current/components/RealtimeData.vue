<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from '@vben/locales';
import {
  Button,
  message,
  Descriptions,
  DescriptionsItem,
} from 'ant-design-vue';
import {
  sendVoltageModulationCommandApi,
  sendDcuDeviceMonitoringCommandApi,
} from '#/api';
import { WebSocketMessageType, useWebSocketStore } from '#/store/websocket';
import { useExperimentStore } from '#/store/experiment';
import type { MonitoringData, VoltageModulationData } from '#/store/websocket';

// WebSocket 监听
const webSocketStore = useWebSocketStore();

// Experiment store
const experimentStore = useExperimentStore();

// 获取当前实验 ID，优先使用 store 中的值，如果没有则使用 props
const currentExperimentId = computed(() => experimentStore.currentExperimentId);

const data = ref({
  ua: '',
  ub: '',
  uc: '',
  ia: '',
  ib: '',
  ic: '',
  power: '',
  frequency: '',
  powerFactor: '',
  speed: '',
  oilTemperature: '',
  coolantTemperature: '',
  exhaustTemp: '',
  oilPressure: '',
  umodMax: '',
  umodMin: '',
  umodSPercent: '',
});

const { t } = useI18n();

// 通用数据更新函数
const updateDataFields = (
  source: Record<string, any>,
  target: Record<string, any>,
  transform?: (value: any) => any,
) => {
  if (!source || !target) return;
  Object.keys(source).forEach((key) => {
    if (source[key] !== undefined && key in target) {
      target[key] = transform ? transform(source[key]) : source[key];
    }
  });
};

// 更新数据的函数
const updateDataFromWebSocket = (monitoringData: MonitoringData) => {
  // 使用通用函数批量更新数据
  updateDataFields(monitoringData, data.value);
};

// 处理电压调制数据的函数
const updateVoltageModulationFromWebSocket = (
  voltageModulationData: VoltageModulationData,
) => {
  // 使用通用函数批量更新数据，并转换为字符串
  updateDataFields(voltageModulationData, data.value, String);
};

onMounted(() => {
  // 使用新的通用消息监听器注册监控数据监听
  webSocketStore.registerMessageListener(
    WebSocketMessageType.MONITORING,
    updateDataFromWebSocket,
  );

  // 注册电压调制数据监听
  webSocketStore.registerMessageListener(
    WebSocketMessageType.VOLTAGE_MODULATION,
    updateVoltageModulationFromWebSocket,
  );
});

onUnmounted(() => {
  // 取消注册监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.MONITORING,
    updateDataFromWebSocket,
  );

  // 取消注册电压调制数据监听
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.VOLTAGE_MODULATION,
    updateVoltageModulationFromWebSocket,
  );
});

// 标题右侧“数据推送”按钮点击处理
const handlePushData = async () => {
  const experimentId = experimentStore.state.currentExperiment?.id || '';
  const benchPosition =
    experimentStore.state.currentExperiment?.benchPosition || '';
  if (!experimentId || !benchPosition) {
    message.error(t('experiment.current.message.realtimeCheckInfo'));
    return;
  }
  const res = await sendDcuDeviceMonitoringCommandApi({
    experimentId,
    state: 1,
  });
  if (res) {
    message.success(t('experiment.current.message.realtimeCommandSuccess'));
  } else {
    message.error(t('experiment.current.message.realtimeCommandFailed'));
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- 读数呈列：Ant Design Vue Descriptions（带边框与背景） -->
    <Descriptions bordered :title="t('experiment.current.realtime.title')" :column="2" size="small">
      <template #extra>
        <Button type="primary" size="small" @click="handlePushData"
          >{{ t('experiment.current.realtime.pushButton') }}</Button
        >
      </template>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.ua')">{{ data.ua }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.ia')">{{ data.ia }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.ub')">{{ data.ub }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.ib')">{{ data.ib }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.uc')">{{ data.uc }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.ic')">{{ data.ic }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.powerKw')">{{ data.power }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.frequencyHz')">{{ data.frequency }}</DescriptionsItem>
      <!-- <DescriptionsItem label="负载(%)">{{ data.load }}</DescriptionsItem> -->
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.powerFactorCos')">{{ data.powerFactor }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.speedRpm')">{{ data.speed }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.oilTempC')">{{ data.oilTemperature }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.coolantTempC')">{{ data.coolantTemperature }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.exhaustTempC')">{{ data.exhaustTemp }}</DescriptionsItem>
      <DescriptionsItem :label="t('experiment.current.realtime.descriptions.oilPressureBar')">{{ data.oilPressure }}</DescriptionsItem>
    </Descriptions>

    <!-- 电压调制参数 -->
    <Descriptions bordered :title="t('experiment.current.realtime.voltageModulationTitle')" :column="2" size="small">
      <DescriptionsItem label="Umod.max">{{ data.umodMax }}</DescriptionsItem>
      <DescriptionsItem label="Umod.min">{{ data.umodMin }}</DescriptionsItem>
      <DescriptionsItem label="Umod.s%">{{
        data.umodSPercent
      }}</DescriptionsItem>
    </Descriptions>
  </div>
</template>
