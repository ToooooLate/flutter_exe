<template>
  <div class="p-6">
    <!-- 标题区域 -->
    <div class="mb-6">
      <h3 class="text-foreground mb-2 text-lg font-semibold">
        {{ t('experiment.current.operation.title') }}
      </h3>

      <!-- 测定按钮 -->
      <div class="mb-4">
        <button
          @click="measureData"
          :disabled="isLoading || !isEditable"
          class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span v-if="isLoading">{{
            t('experiment.current.operation.measuring')
          }}</span>
          <span v-else>{{ t('experiment.current.operation.measure') }}</span>
        </button>
      </div>
    </div>

    <!-- 参数表格 -->
    <div class="mb-6">
      <Grid />
    </div>

    <!-- 结论区域 -->
    <div class="mt-6">
      <label class="text-foreground mb-2 block text-sm font-medium">
        {{ t('experiment.current.common.conclusionLabel') }}
      </label>
      <textarea
        v-model="conclusion"
        :placeholder="t('experiment.current.placeholders.inputConclusion')"
        :readonly="!isEditable"
        class="h-20 w-full resize-none rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from '@vben/locales';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import {
  useWebSocketStore,
  WebSocketMessageType,
  type CheckStartupData,
} from '#/store/websocket';
import { checkStartupApi } from '#/api';
import { message } from 'ant-design-vue';
import { canEditTable } from '#/composables/useExperimentPermissions';

// Store 实例
const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { registerCollector, unregisterCollector } = useDataCollector();

// 响应式数据
const isLoading = ref(false);
const conclusion = ref('');
const isEditable = computed(() => canEditTable());
const { t } = useI18n();

// 表格数据
const tableData = ref([]);

// 测定数据函数
const measureData = async () => {
  isLoading.value = true;
  const result = await checkStartupApi({
    experimentId: experimentStore.state.currentExperiment?.id || '',
    serialNumber: 2,
  });
  result
    ? message.success(t('experiment.current.operation.measureSuccess'))
    : message.error(t('experiment.current.operation.measureFailed'));
  isLoading.value = false;
};

// 表格配置
const gridOptions: VxeGridProps = {
  data: tableData.value,
  columns: [
    {
      field: 'item',
      title: t('experiment.current.operation.columns.item'),
      width: 120,
      align: 'center',
      showOverflow: false,
    },
    {
      field: 'voltage',
      title: t('experiment.current.operation.columns.voltage'),
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input', props: { disabled: !isEditable.value } },
    },
    {
      field: 'frequency',
      title: t('experiment.current.operation.columns.frequency'),
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input', props: { disabled: !isEditable.value } },
    },
    {
      field: 'waterTemp',
      title: t('experiment.current.operation.columns.waterTemp'),
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input', props: { disabled: !isEditable.value } },
    },
    {
      field: 'oilPressure',
      title: t('experiment.current.operation.columns.oilPressure'),
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input', props: { disabled: !isEditable.value } },
    },
    {
      field: 'speed',
      title: t('experiment.current.operation.columns.speed'),
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input', props: { disabled: !isEditable.value } },
    },
    {
      field: 'threeLeakage',
      title: t('experiment.current.operation.columns.threeLeakage'),
      width: 100,
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input', props: { disabled: !isEditable.value } },
    },
  ],
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    beforeEditMethod: () => isEditable.value,
  },
  pagerConfig: {
    enabled: false,
  },
  border: true,
  showOverflow: false,
  cellConfig: {
    height: 'auto',
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });

// WebSocket 监听器函数
const handleCheckStartupData = (data: CheckStartupData) => {
  console.log('收到机组运转检查数据:', data);

  // 更新表格第二行（实测数据）
  if (GridApi.grid && data) {
    const fullData = GridApi.grid.getTableData().fullData;

    // 更新实测数据

    const newData = [fullData[0], { ...data }];
    console.log('newData', newData);
    // 刷新表格显示
    setTimeout(() => {
      GridApi.grid.loadData(newData);
    }, 0);
  }
};

const handleCheckStartupDataFromServer = (data: any) => {
  if (!data.operationCheckList || data.operationCheckList.length === 0) {
    return;
  }
  // 更新表格第二行（实测数据）
  tableData.value = data.operationCheckList.slice(0, -1);
  // 更新结论数据
  conclusion.value = data.operationCheckList.at(-1)?.conclusion || '';

  setTimeout(() => {
    GridApi.grid.loadData(tableData.value);
  });
};

// 数据收集器
const collector = {
  id: 'operationInspection',
  name: 'OperationInspection',
  component: 'OperationInspection',
  type: 'operationInspection',
  collect: () => {
    const gridTableData = GridApi.grid.getTableData().fullData;
    const operationInspectionData = gridTableData
      .map((row) => ({
        ...row,
      }))
      .concat({
        conclusion: conclusion.value || '',
      });
    return operationInspectionData;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store
    experimentStore.updateOperationInspectionList(data);
  },
};

// 生命周期钩子
onMounted(() => {
  const operationCheckList =
    experimentStore.state.currentExperiment?.operationCheckList || [];
  if (operationCheckList.length > 0) {
    handleCheckStartupDataFromServer({
      operationCheckList: JSON.parse(JSON.stringify(operationCheckList)),
    });
  }
  registerCollector(collector);

  // 注册 WebSocket 监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.CHECK_STARTUP,
    handleCheckStartupData,
  );
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleCheckStartupDataFromServer,
  );
});

onUnmounted(() => {
  unregisterCollector('operationInspection');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.CHECK_STARTUP,
    handleCheckStartupData,
  );
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleCheckStartupDataFromServer,
  );
});
</script>

<style scoped></style>
