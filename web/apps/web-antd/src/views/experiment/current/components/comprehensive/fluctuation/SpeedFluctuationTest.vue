<template>
  <div class="speed-fluctuation-test">
    <h3 class="text-foreground mb-2 text-lg font-semibold">
      {{ t('experiment.current.comprehensive.fluctuation.speed.title') }}
    </h3>

    <div class="table-container">
      <Grid />
    </div>

    <div class="form-section">
      <div class="form-row">
        <label>{{
          t(
            'experiment.current.comprehensive.fluctuation.speed.labels.standard',
          )
        }}</label>
        <input
          v-model="speedFluctuationStandard"
          :disabled="!isEditable"
          :placeholder="
            t(
              'experiment.current.comprehensive.fluctuation.speed.placeholders.standard',
            )
          "
          class="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          :class="{ 'bg-gray-100': !isEditable }"
        />
      </div>
      <div class="form-row">
        <label>{{ t('experiment.current.common.conclusionLabel') }}</label>
        <textarea
          v-model="conclusion"
          :readonly="!isEditable"
          :placeholder="t('experiment.current.placeholders.inputConclusion')"
          class="h-20 w-full resize-none rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          :class="{ 'bg-gray-100': !isEditable }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useUserRole } from '#/composables/useUserRole';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { useI18n } from '@vben/locales';

// 响应式数据
const conclusion = ref('');
const speedFluctuationStandard = ref('');

// Store 和权限
const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { isAdmin } = useUserRole();
const isEditable = computed(() => canEditTable());
const { registerCollector, unregisterCollector } = useDataCollector();
const { t } = useI18n();

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
    {
      field: 'serialNumber',
      title: t('experiment.current.columns.serialNumber'),
      width: 60,
      align: 'center',
    },
    {
      field: 'load',
      title: t(
        'experiment.current.comprehensive.fluctuation.speed.columns.load',
      ),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'power',
      title: t(
        'experiment.current.comprehensive.fluctuation.speed.columns.power',
      ),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'frequency',
      title: t(
        'experiment.current.comprehensive.fluctuation.speed.columns.frequency',
      ),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'powerFactor',
      title: t(
        'experiment.current.comprehensive.fluctuation.speed.columns.powerFactor',
      ),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'measuredFreqBeforeExperiment',
      title: t(
        'experiment.current.comprehensive.fluctuation.speed.columns.measuredFreqBeforeExperiment',
      ),
      width: 160,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'frequencyWaveMax',
      title: t(
        'experiment.current.comprehensive.fluctuation.speed.columns.frequencyWaveMax',
      ),
      width: 160,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'frequencyWaveMin',
      title: t(
        'experiment.current.comprehensive.fluctuation.speed.columns.frequencyWaveMin',
      ),
      width: 160,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'frequencyWaveAve',
      title: t(
        'experiment.current.comprehensive.fluctuation.speed.columns.frequencyWaveAve',
      ),
      width: 160,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'speedFluctuationRate',
      title: t(
        'experiment.current.comprehensive.fluctuation.speed.columns.speedFluctuationRate',
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
