<template>
  <div class="steady-voltage-adjustment">
    <h3 class="text-foreground mb-2 text-lg font-semibold">
      {{ t('experiment.current.comprehensive.steady.voltageAdjustment.title') }}
    </h3>

    <div class="table-container">
      <Grid />
    </div>

    <div class="form-section">
      <p class="mb-1">
        {{
          t(
            'experiment.current.comprehensive.steady.voltageAdjustment.labels.standard',
          )
        }}
      </p>
      <div class="form-row">
        <label>{{
          t(
            'experiment.current.comprehensive.steady.voltageAdjustment.labels.conclusion',
          )
        }}</label>
        <textarea
          v-model="conclusion"
          :readonly="!isEditable"
          :placeholder="
            t(
              'experiment.current.comprehensive.steady.voltageAdjustment.placeholders.conclusion',
            )
          "
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
import { useExperimentStore } from '#/store/experiment';
import { useUserRole } from '#/composables/useUserRole';
import { useDataCollector } from '#/composables/useDataCollector';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { useI18n } from '@vben/locales';

const { t } = useI18n();

// 响应式数据
const conclusion = ref('');

// Store 和权限
const experimentStore = useExperimentStore();
const { isAdmin } = useUserRole();
const isEditable = computed(() => canEditTable());
const { registerCollector, unregisterCollector } = useDataCollector();

// WebSocket 相关
const webSocketStore = useWebSocketStore();
const isUpdatingFromWebSocket = ref(false);

// 创建空的测量字段模板
const createEmptyMeasurementFields = () => ({
  id: '',
  serialNumber: null,
  loadPercent: '',
  power: '',
  frequency: '',
  powerFactor: '',
  ua: '',
  ub: '',
  uc: '',
  ia: '',
  ib: '',
  ic: '',
  phaseAVoltage: '',
  steadyVoltageDeviation: '',
  conclusion: '',
});

// 表格数据
const tableData = ref([]);
// 保留完整数据（包含 visible=false 的行），用于提交
const fullTableData = ref<any[]>([]);

// 表格配置
const gridOptions: VxeGridProps = {
  data: tableData.value,
  columns: [
    {
      field: 'serialNumber',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.serialNumber',
      ),
      width: 60,
      align: 'center',
    },
    {
      field: 'loadPercent',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.loadPercent',
      ),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'power',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.power',
      ),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'frequency',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.frequency',
      ),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'powerFactor',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.powerFactor',
      ),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ua',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.ua',
      ),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ub',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.ub',
      ),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'uc',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.uc',
      ),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ia',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.ia',
      ),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ib',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.ib',
      ),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'ic',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.ic',
      ),
      width: 100,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'phaseAVoltage',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.phaseAVoltage',
      ),
      width: 120,
      align: 'center',
      editRender: { name: 'VxeInput' },
    },
    {
      field: 'steadyVoltageDeviation',
      title: t(
        'experiment.current.comprehensive.steady.voltageAdjustment.columns.steadyVoltageDeviation',
      ),
      width: 160,
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

// 数据收集器
const collector = {
  id: 'steadyVoltageAdjustment',
  name: 'SteadyVoltageAdjustment',
  component: 'SteadyVoltageAdjustment',
  type: 'steadyVoltageList',
  collect: () => {
    const editedVisible = GridApi.grid?.getTableData()?.fullData || [];

    // 合并可见表的编辑回完整数据（优先使用 serialNumber 作为键，退化到 id）
    const mergeByKey = (fullList: any[], editedList: any[]) => {
      const editedMap = new Map(
        editedList
          .filter((i) => i && (i.serialNumber != null || i.id != null))
          .map((i) => [i.serialNumber ?? i.id, i]),
      );
      return (fullList || []).map((row) => {
        const key = row?.serialNumber ?? row?.id;
        if (key != null && editedMap.has(key)) {
          return { ...row, ...editedMap.get(key) };
        }
        return row;
      });
    };

    const merged = mergeByKey(fullTableData.value || [], editedVisible);
    return merged.concat({ conclusion: conclusion.value || '' });
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store
    experimentStore.updateSteadyVoltageList(data);
  },
};

// WebSocket 监听器函数
const handleSteadyVoltageData = async (data: any) => {
  if (isUpdatingFromWebSocket.value) return;
  // 空值与类型保护
  if (!data || typeof data !== 'object') return;

  try {
    isUpdatingFromWebSocket.value = true;

    // 处理稳态电压调整数据
    if (Array.isArray((data as any).steadyVoltageList)) {
      // 更新完整数据（包含不可见行）
      fullTableData.value = (data as any).steadyVoltageList
        .slice(0, -1)
        .map((item: any) => ({ ...item }));

      // 渲染时仅显示 visible!==false 的行（未设置 visible 视为可见）
      tableData.value = fullTableData.value.filter((row: any) => row?.visible);

      // 如果有结论数据，更新结论字段
      const lastItem = (data as any).steadyVoltageList.at(-1);
      if (lastItem && lastItem.conclusion) {
        conclusion.value = lastItem.conclusion;
      }

      setTimeout(() => {
        GridApi.grid?.loadData(tableData.value);
      }, 0);
    }
  } finally {
    isUpdatingFromWebSocket.value = false;
  }
};

// 初始化数据
onMounted(() => {
  // 初始化：从当前实验数据填充表格与结论
  const currentExperiment = experimentStore.state.currentExperiment;
  handleSteadyVoltageData(JSON.parse(JSON.stringify(currentExperiment)));

  // 注册数据收集器
  registerCollector(collector);
  // 注册 WebSocket 监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleSteadyVoltageData,
  );
  webSocketStore.registerMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleSteadyVoltageData,
  );
});

// 生命周期钩子
onUnmounted(() => {
  unregisterCollector('steadyVoltageAdjustment');
  // 注销 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleSteadyVoltageData,
  );
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleSteadyVoltageData,
  );
});
</script>

<style scoped>
.steady-voltage-adjustment {
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
