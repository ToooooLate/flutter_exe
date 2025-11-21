<template>
  <div class="voltage-fluctuation-test">
    <h3 class="text-foreground mb-2 text-lg font-semibold">
      机组电压波动率测定 Voltage Fluctuation Test
    </h3>

    <div class="table-container">
      <Grid />
    </div>

    <div class="form-section">
      <div class="form-row">
        <label>电压波动率标准值:</label>
        <input
          v-model="voltageFluctuationStandard"
          type="text"
          placeholder="请输入电压波动率标准值..."
          class="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          :disabled="!isEditable"
        />
      </div>
      <div class="form-row">
        <label>结论 Conclusion:</label>
        <textarea
          v-model="conclusion"
          :readonly="!isEditable"
          placeholder="请输入结论..."
          class="h-20 w-full resize-none rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          :class="{ 'bg-gray-100': !isEditable }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useUserRole } from '#/composables/useUserRole';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';

// Store 和权限
const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { isAdmin } = useUserRole();
const isEditable = computed(() => canEditTable());
const { registerCollector, unregisterCollector } = useDataCollector();

// 标志位，用于避免循环更新
const isUpdatingFromStore = ref(false);

// 表格数据
const tableData = ref<any[]>([]);
// 保留完整数据（含 visible=false 的行），用于提交
const fullTableData = ref<any[]>([]);
const voltageFluctuationStandard = ref('');
// 响应式数据
const conclusion = ref('');

// 表格配置
const gridOptions: VxeGridProps = {
  data: tableData.value,
  columns: [
    { field: 'serialNumber', title: '序号', width: 60, align: 'center' },
    {
      field: 'load',
      title: '负载 (%)\nLoad',
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'power',
      title: '功率 (kW)\nPower',
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
      title: '功率因数 COS Φ\nPower Factor',
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
      field: 'measuredVoltageBeforeExperiment',
      title: '波动试验前电压(V)\nMeasured Voltage\nBefore Experiment',
      width: 140,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'voltageWaveMax',
      title: '电压 Max\nVoltage Wave\nMax',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'voltageWaveMin',
      title: '电压 Min\nVoltage Wave\nMin',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'voltageWaveAve',
      title: '电压 Ave\nVoltage Wave\nAve',
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'voltageFluctuationRate',
      title: '电压波动值 △u%\nVoltage Fluctuation\nRate',
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
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });

// WebSocket 监听器函数 - 处理电压波动测试数据更新
const handleVoltageFluctuationData = (data: any) => {
  // 避免循环更新
  if (isUpdatingFromStore.value) return;
  // 空值与类型保护
  if (!data || !Array.isArray((data as any).voltageFluctuationList)) return;

  // 设置标志位，避免触发循环更新
  isUpdatingFromStore.value = true;

  // 更新表格数据
  if ((data as any).voltageFluctuationList.length > 0) {
    // 分离表格数据和结论数据
    const conclusionItem = (data as any).voltageFluctuationList.at(-1);
    const tableItems = (data as any).voltageFluctuationList.slice(0, -1);

    // 更新完整数据与可见数据（渲染时仅显示 visible !== false 的行）
    fullTableData.value = tableItems;
    tableData.value = fullTableData.value.filter(
      (row: any) => row?.visible !== false,
    );
    setTimeout(() => {
      GridApi.grid?.loadData(tableData.value);
    }, 0);

    // 更新结论和标准值数据
    if (conclusionItem) {
      conclusion.value = conclusionItem.conclusion || '';
      voltageFluctuationStandard.value =
        conclusionItem.voltageFluctuationStandard || '';
    }
  }

  // 重置标志位
  nextTick(() => {
    isUpdatingFromStore.value = false;
  });
};

// 数据收集器
const collector = {
  id: 'voltage-fluctuation-test',
  name: 'VoltageFluctuationTest',
  component: 'VoltageFluctuationTest',
  type: 'voltageFluctuationList',
  collect: () => {
    // 仅渲染的可见数据（用户可能对其做了编辑）
    const visibleData = GridApi.grid?.getTableData()?.fullData || [];
    // 以 serialNumber 或 id 作为合并键，回填编辑结果到完整数据
    const editedMap = new Map<string | number, any>();
    visibleData.forEach((row: any, idx: number) => {
      const key = row?.serialNumber ?? row?.id ?? idx;
      editedMap.set(key, row);
    });
    const mergedFull = fullTableData.value.map((row: any, idx: number) => {
      const key = row?.serialNumber ?? row?.id ?? idx;
      const edited = editedMap.get(key);
      const merged = edited ? { ...row, ...edited } : row;
      if (merged?.id === undefined && row?.id !== undefined) merged.id = row.id;
      return merged;
    });

    const voltageFluctuationData = mergedFull.concat([
      {
        voltageFluctuationStandard: voltageFluctuationStandard.value || '',
        conclusion: conclusion.value || '',
      },
    ]);

    return voltageFluctuationData;
  },
  hasChanges() {
    return true;
  },
  syncToStore(data: VoltageFluctuationItem[]) {
    experimentStore.updateVoltageFluctuationList(data);
  },
};

const handleWebSocketData = (data: any) => {};

// 生命周期钩子
onMounted(() => {
  const currentExperiment = experimentStore.state.currentExperiment;
  handleVoltageFluctuationData(JSON.parse(JSON.stringify(currentExperiment)));
  // 注册数据收集器
  registerCollector(collector);

  // 注册 WebSocket 监听器 - 监听电压波动测试数据更新
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleVoltageFluctuationData,
  );

  // 注册 WebSocket 监听器 - 监听集成实验数据更新
  webSocketStore.registerMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleVoltageFluctuationData,
  );
});

onUnmounted(() => {
  unregisterCollector('voltage-fluctuation-test');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleVoltageFluctuationData,
  );

  // 取消注册 WebSocket 监听器 - 监听集成实验数据更新
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleVoltageFluctuationData,
  );
});
</script>

<style scoped>
.voltage-fluctuation-test {
  padding: 16px;
}

.table-container {
  margin-bottom: 16px;
}

.form-section {
  margin-top: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row label {
  font-weight: 600;
  color: #374151;
}

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
