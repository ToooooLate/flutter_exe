<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted, computed } from 'vue';
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
  ub: '10.00',
  uc: '10.00',
  ia: '10.00',
  ib: '10.00',
  ic: '10.00',
  power: '10.00',
  frequency: '10.00',
  powerFactor: '10.00',
  speed: '10.00',
  oilTemperature: '10.00',
  coolantTemperature: '10.00',
  exhaustTemp: '10.00',
  oilPressure: '10.00',
  umodMax: '10.00',
  umodMin: '10.00',
  umodSPercent: '10.00',
});

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
    message.error('请检查实验ID、实验台位或同步数据后操作');
    return;
  }
  const res = await sendDcuDeviceMonitoringCommandApi({
    experimentId,
    state: 1,
  });
  if (res) {
    message.success('实时数据指令发送成功');
  } else {
    message.error('实时数据指令发送失败');
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- 读数呈列：Ant Design Vue Descriptions（带边框与背景） -->
    <Descriptions bordered title="实时数据" :column="2" size="small">
      <template #extra>
        <Button type="primary" size="small" @click="handlePushData"
          >数据推送</Button
        >
      </template>
      <DescriptionsItem label="UA (V)">{{ data.ua }}</DescriptionsItem>
      <DescriptionsItem label="IA (A)">{{ data.ia }}</DescriptionsItem>
      <DescriptionsItem label="UB (V)">{{ data.ub }}</DescriptionsItem>
      <DescriptionsItem label="IB (A)">{{ data.ib }}</DescriptionsItem>
      <DescriptionsItem label="UC (V)">{{ data.uc }}</DescriptionsItem>
      <DescriptionsItem label="IC (A)">{{ data.ic }}</DescriptionsItem>
      <DescriptionsItem label="功率(kW)">{{ data.power }}</DescriptionsItem>
      <DescriptionsItem label="频率 (Hz)">{{
        data.frequency
      }}</DescriptionsItem>
      <!-- <DescriptionsItem label="负载(%)">{{ data.load }}</DescriptionsItem> -->
      <DescriptionsItem label="功率因数(cosΦ)">{{
        data.powerFactor
      }}</DescriptionsItem>
      <DescriptionsItem label="转速(rpm)">{{ data.speed }}</DescriptionsItem>
      <DescriptionsItem label="机油温度(℃)">{{
        data.oilTemperature
      }}</DescriptionsItem>
      <DescriptionsItem label="冷却水温度(℃)">{{
        data.coolantTemperature
      }}</DescriptionsItem>
      <DescriptionsItem label="排气温度(℃)">{{
        data.exhaustTemp
      }}</DescriptionsItem>
      <DescriptionsItem label="机油压力(Bar)">{{
        data.oilPressure
      }}</DescriptionsItem>
    </Descriptions>

    <!-- 电压调制参数 -->
    <Descriptions bordered title="电压调制" :column="2" size="small">
      <DescriptionsItem label="Umod.max">{{ data.umodMax }}</DescriptionsItem>
      <DescriptionsItem label="Umod.min">{{ data.umodMin }}</DescriptionsItem>
      <DescriptionsItem label="Umod.s%">{{
        data.umodSPercent
      }}</DescriptionsItem>
    </Descriptions>
  </div>
</template>
