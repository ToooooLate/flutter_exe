<template>
  <div class="overspeed-protection-test-container">
    <div class="mb-4">
      <h4 class="text-base font-medium">（1）超速保护试验</h4>
    </div>

    <div class="vp-raw w-full">
      <Grid />
    </div>

    <!-- 要求说明 -->
    <div class="mb-4 mt-4">
      <p class="text-sm">
        要求：转速调整到113%~115%额定转速，控制箱显示超速报警，发动机应立即停车，试验三次要全部成功。
      </p>
    </div>

    <!-- 结论部分 -->
    <div class="mt-6">
      <div class="mb-2">
        <label class="text-sm font-medium">结论:</label>
      </div>
      <div class="min-h-[60px] rounded border border-gray-300 p-3">
        <textarea
          v-model="conclusion"
          class="h-full w-full resize-none border-none outline-none"
          placeholder="请输入试验结论..."
          :readonly="!isEditable"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { canEditTable } from '#/composables/useExperimentPermissions';

interface RowType {
  id: string;
  sequence: number;
  speed: string;
  alarmStop: string;
  note: string;
}

// Store 实例
const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { registerCollector, unregisterCollector } = useDataCollector();

const conclusion = ref('');

const gridOptions: VxeTableGridOptions<RowType> = {
  columns: [
    {
      field: 'sequence',
      title: '序号',
      width: 80,
      align: 'center',
    },
    {
      field: 'speed',
      title: '转速(rpm)',
      minWidth: 150,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          type: 'number',
          precision: 0,
        },
      },
    },
    {
      field: 'alarmStop',
      title: '报警停车',
      minWidth: 150,
      editRender: { name: 'input' },
    },
    {
      field: 'note',
      title: '备注',
      minWidth: 150,
      editRender: { name: 'input' },
    },
  ],
  data: [
    {
      id: '1',
      sequence: 1,
      speed: '',
      alarmStop: '',
      note: '',
    },
    {
      id: '2',
      sequence: 2,
      speed: '',
      alarmStop: '',
      note: '',
    },
    {
      id: '3',
      sequence: 3,
      speed: '',
      alarmStop: '',
      note: '',
    },
  ],
  editConfig: {
    mode: 'cell',
    trigger: 'click',
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
  'min-height': 0,
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });
const isEditable = computed(() => canEditTable());

// 数据收集器
const collector = {
  id: 'overspeedProtectionTest',
  name: 'OverspeedProtectionTest',
  component: 'OverspeedProtectionTest',
  type: 'overspeedProtectionTest',
  collect: () => {
    const gridTableData = GridApi.grid.getTableData().fullData;
    console.log('gridTableData', gridTableData);
    const overspeedProtectionData = gridTableData
      .map((row) => ({
        serialNumber: row.sequence,
        speed: Number(row.speed),
        alarmShutdown: row.alarmStop,
        remarks: row.note,
      }))
      .concat({
        conclusion: conclusion.value || '',
      });
    console.log('overspeedProtectionData', overspeedProtectionData);
    return overspeedProtectionData;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store
    experimentStore.updateOverspeedProtectionList(data);
  },
};

// WebSocket 监听器：处理服务端实验数据（全量）
const handleOverspeedFromServer = (payload: any) => {
  const list = payload?.overspeedProtectList || [];
  if (!Array.isArray(list) || list.length === 0) return;

  const rows = list.slice(0, -1).map((item: any, idx: number) => ({
    sequence: Number(item.serialNumber) || idx + 1,
    speed: item.speed ?? '',
    alarmStop: item.alarmShutdown ?? '',
    note: item.remarks ?? '',
  }));

  // 结论取最后一条记录的 conclusion 字段
  const last = list[list.length - 1];
  conclusion.value = last?.conclusion || '';

  setTimeout(() => {
    GridApi.grid.loadData(rows);
  });
};

// 生命周期钩子
onMounted(() => {
  // 初始化：从 store 同步一次数据
  const overspeedProtectList =
    experimentStore.state.currentExperiment?.overspeedProtectList || [];
  if (overspeedProtectList.length > 0) {
    handleOverspeedFromServer({
      overspeedProtectList: JSON.parse(JSON.stringify(overspeedProtectList)),
    });
  }

  registerCollector(collector);

  // 注册 WebSocket 监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleOverspeedFromServer,
  );
});

onUnmounted(() => {
  unregisterCollector('overspeedProtectionTest');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleOverspeedFromServer,
  );
});
</script>

<style scoped></style>
