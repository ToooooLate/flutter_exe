<template>
  <div class="load-test">
    <h3 class="text-foreground mb-2 text-lg font-semibold">
      {{ $t('experiment.current.comprehensive.loadTitle') }}
    </h3>

    <div class="table-container">
      <Grid />
    </div>

    <div class="form-section">
      <div class="form-row">
        <label>{{ $t('experiment.current.common.conclusionLabel') }}</label>
        <textarea
          v-model="conclusion"
          :placeholder="$t('experiment.current.placeholders.inputConclusion')"
          class="h-20 w-full resize-none rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          :readonly="!isEditable"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { $t } from '#/locales';

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
      title: $t('experiment.current.columns.serialNumber'),
      width: 80,
      align: 'center',
      fixed: 'left',
    },
    {
      field: 'timeMin',
      title: $t('experiment.current.columns.timeMin'),
      width: 100,
      align: 'center',
      fixed: 'left',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'loadPercent',
      title: $t(
        'experiment.current.comprehensive.fluctuation.speed.columns.load',
      ),
      width: 100,
      align: 'center',
      fixed: 'left',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'powerStandard',
      title: $t('experiment.current.comprehensive.load.columns.powerStandard'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'powerMeasured',
      title: $t('experiment.current.comprehensive.load.columns.powerMeasured'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'frequency',
      title: $t('experiment.current.columns.frequency'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'powerFactor',
      title: $t('experiment.current.columns.powerFactor'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ua',
      title: $t('experiment.current.columns.ua'),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ub',
      title: $t('experiment.current.columns.ub'),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'uc',
      title: $t('experiment.current.columns.uc'),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ia',
      title: $t('experiment.current.columns.ia'),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ib',
      title: $t('experiment.current.columns.ib'),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ic',
      title: $t('experiment.current.columns.ic'),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'speed',
      title: $t('experiment.current.columns.speedRpm'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'oilTemperature',
      title: $t('experiment.current.comprehensive.load.columns.oilTemperature'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'oilPressure',
      title: $t('experiment.current.comprehensive.load.columns.oilPressure'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'coolantTemp',
      title: $t('experiment.current.comprehensive.load.columns.coolantTemp'),
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'crankcasePress',
      title: $t('experiment.current.comprehensive.load.columns.crankcasePress'),
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'fuelRate',
      title: $t('experiment.current.comprehensive.load.columns.fuelRate'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'exhaustTemp',
      title: $t('experiment.current.comprehensive.load.columns.exhaustTemp'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'percentPower',
      title: $t('experiment.current.comprehensive.load.columns.percentPower'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },

    {
      field: 'fuelAccumulatorPress',
      title: $t(
        'experiment.current.comprehensive.load.columns.fuelAccumulatorPress',
      ),
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'fuelSupplyPress',
      title: $t(
        'experiment.current.comprehensive.load.columns.fuelSupplyPress',
      ),
      width: 130,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'exhaustTempLb',
      title: $t('experiment.current.comprehensive.load.columns.exhaustTempLb'),
      width: 130,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'exhaustTempRb',
      title: $t('experiment.current.comprehensive.load.columns.exhaustTempRb'),
      width: 130,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'coolantPress',
      title: $t('experiment.current.comprehensive.load.columns.coolantPress'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'seaWaterPress',
      title: $t('experiment.current.comprehensive.load.columns.seaWaterPress'),
      width: 130,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'fuelTemp',
      title: $t('experiment.current.comprehensive.load.columns.fuelTemp'),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'boostPressL',
      title: $t('experiment.current.comprehensive.load.columns.boostPressL'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'boostPressR',
      title: $t('experiment.current.comprehensive.load.columns.boostPressR'),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'intakeManifoldTempLbf',
      title: $t(
        'experiment.current.comprehensive.load.columns.intakeManifoldTempLbf',
      ),
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'intakeManifoldTempLbb',
      title: $t(
        'experiment.current.comprehensive.load.columns.intakeManifoldTempLbb',
      ),
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'intakeManifoldTempRbf',
      title: $t(
        'experiment.current.comprehensive.load.columns.intakeManifoldTempRbf',
      ),
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'intakeManifoldTempRbb',
      title: $t(
        'experiment.current.comprehensive.load.columns.intakeManifoldTempRbb',
      ),
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
    beforeEditMethod: () => isEditable.value,
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
const isEditable = computed(() => canEditTable());

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
