<template>
  <div class="load-test">
    <h3 class="text-foreground mb-2 text-lg font-semibold">Load Test</h3>

    <div class="table-container">
      <Grid />
    </div>

    <div class="form-section">
      <div class="form-row">
        <label>结论 Conclusion:</label>
        <textarea
          v-model="conclusion"
          placeholder="请输入结论..."
          class="h-20 w-full resize-none rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';

// 响应式数据
const conclusion = ref('');

// Store 实例
const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { registerCollector, unregisterCollector } = useDataCollector();

// 标志位，用于避免循环更新
const isUpdatingFromWebSocket = ref(false);

// 测试配置 - 定义每个测试项目的基本参数
const testConfigs = [
  { loadPercent: '0 %', timeMin: '10 min' },
  { loadPercent: '25 %', timeMin: '10 min' },
  { loadPercent: '50 %', timeMin: '10 min' },
  { loadPercent: '75 %', timeMin: '10 min' },
  { loadPercent: '100 %', timeMin: '30 min' },
  { loadPercent: '100 %', timeMin: '30 min' },
  { loadPercent: '100 %', timeMin: '30 min' },
  { loadPercent: '100 %', timeMin: '30 min' },
  { loadPercent: '110 %', timeMin: '30 min' },
];

// 创建空的测量字段模板
const createEmptyMeasurementFields = () => ({
  serialNumber: null,
  powerStandard: '',
  powerMeasured: '',
  frequency: '',
  powerFactor: '',
  ua: '',
  ub: '',
  uc: '',
  ia: '',
  ib: '',
  ic: '',
  speed: '',
  oilTemperature: '',
  oilPressure: '',
  coolantTemp: '',
  crankcasePress: '',
  fuelRate: '',
  percentPower: '',
  fuelAccumulatorPress: '',
  fuelSupplyPress: '',
  exhaustTempLb: '',
  exhaustTempRb: '',
  coolantPress: '',
  seaWaterPress: '',
  fuelTemp: '',
  boostPressL: '',
  boostPressR: '',
  exhaustTemp: '',
  intakeManifoldTempLbf: '',
  intakeManifoldTempLbb: '',
  intakeManifoldTempRbf: '',
  intakeManifoldTempRbb: '',
});

// 生成表格数据
const generateTableData = () => {
  return testConfigs.map((config, index) => ({
    id: index + 1,
    ...createEmptyMeasurementFields(),
    timeMin: config.timeMin,
    loadPercent: config.loadPercent,
    serialNumber: index + 1,
  }));
};

// 全量数据（含不可见行），用于提交
const fullTableData = ref<any[]>([]);
// 表格数据 - 仅渲染可见行
const tableData = ref(generateTableData());

// 表格配置
const gridOptions: VxeGridProps = {
  data: tableData.value,
  columns: [
    {
      field: 'serialNumber',
      title: '序号\nSerial Number',
      width: 80,
      align: 'center',
      fixed: 'left',
    },
    {
      field: 'timeMin',
      title: '时间 (min)\nTime',
      width: 100,
      align: 'center',
      fixed: 'left',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'loadPercent',
      title: '负载 (%)\nLoad',
      width: 100,
      align: 'center',
      fixed: 'left',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'powerStandard',
      title: '功率要求(kW)\nPower Standard',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'powerMeasured',
      title: '功率测定(kW)\nPower Measured',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'frequency',
      title: '频率 (Hz)\nFrequency',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'powerFactor',
      title: '功率因数\nPower Factor',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ua',
      title: 'UA (V)',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ub',
      title: 'UB (V)',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'uc',
      title: 'UC (V)',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ia',
      title: 'IA (A)',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ib',
      title: 'IB (A)',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ic',
      title: 'IC (A)',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'speed',
      title: '转速 (rpm)\nSpeed',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'oilTemperature',
      title: '油温 (℃)\nOil Temp',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'oilPressure',
      title: '油压 (Bar)\nOil Pressure',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'coolantTemp',
      title: '冷却液温度 (℃)\nCoolant Temp',
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'crankcasePress',
      title: '曲轴箱压力 (mbar)\nCrankcase Press',
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'fuelRate',
      title: '燃油流量 (L/h)\nFuel Rate',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'exhaustTemp',
      title: '排气温度 (℃)\nExhaust Temp',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'percentPower',
      title: 'Percent Power\n(%)',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },

    {
      field: 'fuelAccumulatorPress',
      title: 'Fuel Accumulator\nPress(Mpa)',
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'fuelSupplyPress',
      title: 'Fuel Supply Press\n(Bar)',
      width: 130,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'exhaustTempLb',
      title: 'Exhaust Temp. LB\n(°C)',
      width: 130,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'exhaustTempRb',
      title: 'Exhaust Temp. RB\n(°C)',
      width: 130,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'coolantPress',
      title: 'Coolant Press\n(Bar)',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'seaWaterPress',
      title: 'Sea Water Press\n(Bar)',
      width: 130,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'fuelTemp',
      title: 'Fuel Temp\n(°C)',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'boostPressL',
      title: 'Boost Press L\n(Bar)',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'boostPressR',
      title: 'Boost Press R\n(Bar)',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'intakeManifoldTempLbf',
      title: 'Intake Manif Temp\nLBF (°C)',
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'intakeManifoldTempLbb',
      title: 'Intake Manif Temp\nLBB (°C)',
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'intakeManifoldTempRbf',
      title: 'Intake Manif Temp\nRBF (°C)',
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'intakeManifoldTempRbb',
      title: 'Intake Manif Temp\nRBB (°C)',
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
  ],
  pagerConfig: {
    enabled: false,
  },
  editConfig: {
    trigger: 'click',
    mode: 'cell',
  },
  border: true,
  showOverflow: false,
  cellConfig: {
    height: 'auto',
  },
  toolbarConfig: {
    custom: true,
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });

// WebSocket 监听器函数 - 处理负载测试数据更新
const handleLoadTestData = (data: any) => {
  // 避免循环更新
  if (isUpdatingFromWebSocket.value) return;
  // 空值与类型保护
  if (!data || typeof data !== 'object') return;

  // 设置标志位
  isUpdatingFromWebSocket.value = true;

  try {
    // 更新表格数据 - 从 WebSocket 数据中提取 loadList
    if (Array.isArray((data as any).loadList)) {
      // 缓存全量数据（含不可见行）用于提交
      fullTableData.value = data.loadList.slice(0, -1);
      // 仅渲染可见行
      tableData.value = fullTableData.value.filter((item) => item.visible);

      // 更新结论 - 从最后一个项目的 conclusion 字段获取
      const lastItem = (data as any).loadList.at(-1);
      if (lastItem && lastItem.conclusion) {
        conclusion.value = lastItem.conclusion;
      }
      setTimeout(() => {
        GridApi.grid?.reloadData(tableData.value);
      }, 0);
    }
  } catch (error) {
    console.error('处理负载测试 WebSocket 数据时出错:', error);
  } finally {
    // 重置标志位
    nextTick(() => {
      isUpdatingFromWebSocket.value = false;
    });
  }
};

// 数据收集器
const collector = {
  id: 'loadTestReport',
  name: 'LoadTestReport',
  component: 'LoadTestReport',
  type: 'loadTestReport',
  collect: () => {
    // 从表格读取已编辑的可见行数据
    const visibleEdited = GridApi.grid?.getTableData()?.fullData || [];
    // 将可见行的编辑结果合并回全量数据（根据 serialNumber 匹配）
    const mergedFull = fullTableData.value.map((item) => {
      const updated = visibleEdited.find(
        (r: any) => r.serialNumber === item.serialNumber,
      );
      return updated ? { ...item, ...updated } : item;
    });
    // 追加结论行
    const loadTestData = mergedFull.concat({
      conclusion: conclusion.value || '',
    });
    return loadTestData;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store
    experimentStore.updateLoadTestReport(data);
  },
};

// 生命周期钩子
onMounted(() => {
  const currentExperiment = experimentStore.state.currentExperiment;
  handleLoadTestData(JSON.parse(JSON.stringify(currentExperiment)));

  registerCollector(collector);

  // 注册 WebSocket 监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleLoadTestData,
  );

  // 注册综合试验数据监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleLoadTestData,
  );
});

onUnmounted(() => {
  unregisterCollector('loadTestReport');

  // 注销 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleLoadTestData,
  );

  // 注销综合试验数据监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleLoadTestData,
  );
});
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
  text-align: center;
  padding: 8px 4px;
  white-space: pre-line;
  line-height: 1.2;
}

:deep(.ant-table-tbody > tr > td) {
  text-align: center;
  padding: 8px 4px;
}

:deep(.ant-table-fixed-left) {
  background-color: #f5f5f5;
}
</style>
