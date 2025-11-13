<template>
  <div class="p-6">
    <!-- 标题区域 -->
    <div class="mb-6">
      <h3 class="text-foreground mb-2 text-lg font-semibold">
        Engine operation parameters - At startup
      </h3>

      <!-- 测定按钮 -->
      <div class="mb-4">
        <button
          @click="measureData"
          :disabled="isLoading"
          class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span v-if="isLoading">测定中...</span>
          <span v-else>测定</span>
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
        结论/Conclusion:
      </label>
      <textarea
        v-model="conclusion"
        placeholder="请输入结论..."
        class="h-20 w-full resize-none rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
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

// Store 实例
const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { registerCollector, unregisterCollector } = useDataCollector();

// 响应式数据
const isLoading = ref(false);
const conclusion = ref('');

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
    ? message.success('测定命令发送成功')
    : message.error('测定命令发送失败');
  isLoading.value = false;
};

// 表格配置
const gridOptions: VxeGridProps = {
  data: tableData.value,
  columns: [
    {
      field: 'item',
      title: '项目\nItem',
      width: 120,
      align: 'center',
      showOverflow: false,
    },
    {
      field: 'voltage',
      title: '电压 (V)\nVolt.',
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input' },
    },
    {
      field: 'frequency',
      title: '频率 (V)\nFrequency',
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input' },
    },
    {
      field: 'waterTemp',
      title: '水温 (℃)\nWater Temp.',
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input' },
    },
    {
      field: 'oilPressure',
      title: '油压 (Bar)\nOil Press.',
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input' },
    },
    {
      field: 'speed',
      title: '转速 (rpm)\nSpeed',
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input' },
    },
    {
      field: 'threeLeakage',
      title: '三漏',
      width: 100,
      align: 'center',
      showOverflow: false,
      editRender: { name: 'input' },
    },
  ],
  editConfig: {
    trigger: 'click',
    mode: 'cell',
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
