<template>
  <div class="speed-fluctuation-test">
    <h3 class="text-foreground mb-2 text-lg font-semibold">
      机组转速波动率测定 Speed Fluctuation Test
    </h3>

    <div class="table-container">
      <Grid />
    </div>

    <div class="form-section">
      <div class="form-row">
        <label>转速波动率要求/Standard:</label>
        <input
          v-model="speedFluctuationStandard"
          :readonly="!isAdmin"
          placeholder="请输入转速波动率要求..."
          class="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          :class="{ 'bg-gray-100': !isAdmin }"
        />
      </div>
      <div class="form-row">
        <label>结论 Conclusion:</label>
        <textarea
          v-model="conclusion"
          :readonly="!isAdmin"
          placeholder="请输入结论..."
          class="h-20 w-full resize-none rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          :class="{ 'bg-gray-100': !isAdmin }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useUserRole } from '#/composables/useUserRole';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';

// 响应式数据
const conclusion = ref('');
const speedFluctuationStandard = ref('');

// Store 和权限
const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { isAdmin } = useUserRole();
const { registerCollector, unregisterCollector } = useDataCollector();

// 标志位，用于避免循环更新
const isUpdatingFromStore = ref(false);

// 创建空的测量字段模板
const createEmptyMeasurementFields = () => ({
  id: '',
  serialNumber: null,
  load: '',
  power: '',
  frequency: '',
  powerFactor: '',
  measuredFreqBeforeExperiment: '',
  frequencyWaveMax: '',
  frequencyWaveMin: '',
  frequencyWaveAve: '',
  speedFluctuationRate: '',
  speedFluctuationStandard: '',
  conclusion: '',
});

// 表格数据
const tableData = ref([]);
// 保留完整数据（含 visible=false 的行），用于提交
const fullTableData = ref<any[]>([]);

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
      editRender: isAdmin ? { name: 'VxeInput' } : undefined,
    },
    {
      field: 'power',
      title: '功率 (kW)\nPower',
      width: 120,
      align: 'center',
      editRender: isAdmin ? { name: 'VxeInput' } : undefined,
    },
    {
      field: 'frequency',
      title: '频率 (Hz)\nFrequency',
      width: 120,
      align: 'center',
      editRender: isAdmin ? { name: 'VxeInput' } : undefined,
    },
    {
      field: 'powerFactor',
      title: '功率因数 COS Φ\nPower Factor',
      width: 120,
      align: 'center',
      editRender: isAdmin ? { name: 'VxeInput' } : undefined,
    },
    {
      field: 'measuredFreqBeforeExperiment',
      title: '波动试验前频率\nMeasured frequency before motion testing',
      width: 160,
      align: 'center',
      editRender: isAdmin ? { name: 'VxeInput' } : undefined,
    },
    {
      field: 'frequencyWaveMax',
      title: '频率 Max\nFrequency wave motion in 1 mins - Max',
      width: 160,
      align: 'center',
      editRender: isAdmin ? { name: 'VxeInput' } : undefined,
    },
    {
      field: 'frequencyWaveMin',
      title: '频率 Min\nFrequency wave motion in 1 mins - Min',
      width: 160,
      align: 'center',
      editRender: isAdmin ? { name: 'VxeInput' } : undefined,
    },
    {
      field: 'frequencyWaveAve',
      title: '频率 Ave\nFrequency wave motion in 1 mins Ave',
      width: 160,
      align: 'center',
      editRender: isAdmin ? { name: 'VxeInput' } : undefined,
    },
    {
      field: 'speedFluctuationRate',
      title: '转速波动值 %\nFrequency wave motion rate',
      width: 140,
      align: 'center',
      editRender: isAdmin ? { name: 'VxeInput' } : undefined,
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
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });

// WebSocket 监听器函数 - 处理转速波动测试数据更新
const handleSpeedFluctuationData = (data: any) => {
  // 设置标志位，避免触发循环更新
  isUpdatingFromStore.value = true;

  // 更新表格数据
  if (data?.speedFluctuationList && data.speedFluctuationList.length > 0) {
    // 分离表格数据和结论数据
    const conclusionItem = data.speedFluctuationList.at(-1);
    const tableItems = data.speedFluctuationList.slice(0, -1);

    // 保留完整数据（含隐藏行），渲染时仅显示 visible !== false 的行
    fullTableData.value = tableItems;
    tableData.value = fullTableData.value.filter(
      (row: any) => row?.visible !== false,
    );
    setTimeout(() => {
      GridApi.grid?.loadData(tableData.value);
    }, 0);

    // 更新结论数据
    if (conclusionItem) {
      conclusion.value = conclusionItem.conclusion || '';
      speedFluctuationStandard.value =
        conclusionItem.speedFluctuationStandard || '';
    }
  }

  // 重置标志位
  nextTick(() => {
    isUpdatingFromStore.value = false;
  });
};

// 数据收集器
const collector = {
  id: 'speedFluctuationTest',
  name: 'SpeedFluctuationTest',
  component: 'SpeedFluctuationTest',
  type: 'speedFluctuationList',
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
      return edited ? { ...row, ...edited } : row;
    });

    // 结论与标准值作为最后一项提交
    const speedFluctuationData = mergedFull.concat({
      conclusion: conclusion.value || '',
      speedFluctuationStandard: speedFluctuationStandard.value || '',
    });

    return speedFluctuationData;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store
    experimentStore.updateSpeedFluctuationList(data);
  },
};

// 初始化数据
onMounted(() => {
  // 初始化：从当前实验数据填充表格与结论
  const currentExperiment = experimentStore.state.currentExperiment;
  handleSpeedFluctuationData(JSON.parse(JSON.stringify(currentExperiment)));
  // 注册数据收集器
  registerCollector(collector);

  // 注册 WebSocket 监听器 - 监听转速波动测试数据更新
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleSpeedFluctuationData,
  );

  webSocketStore.registerMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleSpeedFluctuationData,
  );
});

// 生命周期钩子
onUnmounted(() => {
  unregisterCollector('speedFluctuationTest');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleSpeedFluctuationData,
  );

  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleSpeedFluctuationData,
  );
});
</script>

<style scoped>
.speed-fluctuation-test {
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
