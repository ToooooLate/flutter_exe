<template>
  <div class="p-6">
    <!-- 标题部分 -->
    <div class="mb-6">
      <h3 class="mb-2 text-lg font-semibold">
        {{ $t('experiment.current.insulation.hot.title') }}
      </h3>
    </div>

    <!-- 发电机SN输入 -->
    <div class="mb-6">
      <div class="flex items-center gap-4">
        <label class="text-foreground whitespace-nowrap text-sm font-medium">
          {{ $t('experiment.current.insulation.labels.generatorSn') }}
        </label>
        <input
          v-model="generatorSN"
          type="text"
          class="max-w-md flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :placeholder="$t('experiment.current.insulation.placeholders.generatorSn')"
          :disabled="!isEditable"
        />
      </div>
    </div>

    <!-- 测量结果表格 -->
    <div class="mb-6">
      <Grid />
      <div class="mt-2 text-sm text-gray-500">{{ $t('experiment.current.insulation.units.mohm') }}</div>
    </div>

    <!-- 结论部分 -->
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium">{{ $t('experiment.current.common.conclusionLabel') }}</label>
      <div class="min-h-[60px] rounded border border-gray-300 p-3">
        <textarea
          v-model="conclusion"
          class="h-full w-full resize-none border-0 outline-none"
          :placeholder="$t('experiment.current.placeholders.inputConclusion')"
          :readonly="!isEditable"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useI18n } from '@vben/locales';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useExperimentStore } from '#/store/experiment';
import { useDataCollector } from '#/composables/useDataCollector';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { canEditTable } from '#/composables/useExperimentPermissions';

interface RowType {
  id: string;
  status: string;
  measured: number;
  standard: number;
}

const experimentStore = useExperimentStore();
const { registerCollector, unregisterCollector } = useDataCollector();
const webSocketStore = useWebSocketStore();

const generatorSN = ref('');
const conclusion = ref('');
const isEditable = computed(() => canEditTable());
const { t } = useI18n();

// 初始化数据
onMounted(() => {
  // 从store中加载现有数据
  const currentExperiment = experimentStore.state.currentExperiment;
  if (currentExperiment?.hotInsulation) {
    const currentExperimentData = JSON.parse(JSON.stringify(currentExperiment));
    handleExperimentHotInsulationUpdate(currentExperimentData);
  }

  // 注册数据收集器
  registerDataCollector();

  // 注册 WebSocket 实验数据监听，实时刷新热态绝缘测试数据
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleExperimentHotInsulationUpdate,
  );
});

onUnmounted(() => {
  // 组件销毁时注销数据收集器
  unregisterCollector('hot-insulation-test');

  // 取消注册 WebSocket 监听
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleExperimentHotInsulationUpdate,
  );
});

// 注册数据收集器
function registerDataCollector() {
  const collector = {
    id: 'hot-insulation-test',
    name: 'HotInsulationTest',
    component: 'HotInsulationTest',
    type: 'insulation',
    hasChanges: () => {
      return true;
    },
    collect: () => {
      // 获取当前表格数据
      const tableData = GridApi.grid?.getTableData().fullData?.[0];

      const hotInsulationData = {
        generatorSn: generatorSN.value,
        measured: Number(tableData?.measured) || 0,
        standard: 5,
        conclusion: conclusion.value,
      };

      return hotInsulationData;
    },
    syncToStore: async (data: any) => {
      // 更新到experiment store
      experimentStore.updateExperimentData({
        hotInsulation: data,
      });
    },
  };

  registerCollector(collector);
}

// WebSocket 消息处理：全量实验数据中的热态绝缘电阻
function handleExperimentHotInsulationUpdate(data: any) {
  const hot = data?.hotInsulation;
  if (!hot) return;

  generatorSN.value = hot.generatorSn || '';
  conclusion.value = hot.conclusion || '';

  const rows: RowType[] = [
    {
      id: hot.id || null,
      status: t('experiment.current.insulation.rows.hotStatus'),
      measured: Number(hot.measured) || 0,
      standard: 5,
    },
  ];

  gridOptions.data = rows;
  // 刷新表格数据
  setTimeout(() => {
    GridApi.grid?.loadData?.(rows as any);
  });
}

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    {
      field: 'status',
      title: t('experiment.current.insulation.columns.status'),
      minWidth: 250,
      showOverflow: false,
      cellRender: {
        name: 'VxeText',
        props: {
          style: {
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            padding: '8px',
          },
        },
      },
    },
    {
      editRender: {
        name: 'VxeNumberInput',
        props: {
          type: 'number',
          precision: 1,
          placeholder: t('experiment.current.insulation.placeholders.mohm'),
        },
      },
      field: 'measured',
      title: t('experiment.current.insulation.columns.measured'),
      minWidth: 180,
      showOverflow: false,
      align: 'center',
    },
    {
      field: 'standard',
      title: t('experiment.current.insulation.columns.standard'),
      minWidth: 180,
      showOverflow: false,
      align: 'center',
      cellRender: {
        name: 'VxeText',
        props: {
          text: t('experiment.current.insulation.thresholds.hot'),
        },
      },
      formatter: () => t('experiment.current.insulation.thresholds.hot'),
    },
  ],
  data: [
    {
      id: '1',
      status: t('experiment.current.insulation.rows.hotStatus'),
      measured: 0,
      standard: '≥5MΩ',
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
    height: 60,
  },
  'min-height': 0,
  headerHeight: 60,
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });
</script>

<style scoped></style>
