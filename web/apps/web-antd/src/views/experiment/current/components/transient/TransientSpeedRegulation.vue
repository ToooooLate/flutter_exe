<template>
  <div class="space-y-6">
    <!-- 标题部分 -->
    <div class="mb-6">
      <h4 class="text-base font-semibold text-gray-800">
        {{ $t('experiment.current.transient.title') }}
      </h4>
      <p class="mt-1 text-sm text-gray-600">
        {{ $t('experiment.current.transient.subtitle') }}
      </p>
    </div>

    <!-- 测试数据表格 -->
    <div class="mb-6">
      <Button
        type="primary"
        class="mr-2"
        :disabled="!isEditable"
        @click="handleEditProject"
      >
        {{ $t('experiment.current.transient.editProject') }}
      </Button>
      <!-- <Button type="primary">打印曲线</Button> -->
      <Grid>
        <template #action="{ row }">
          <div class="flex gap-2">
            <Button
              type="button"
              :disabled="!isEditable"
              class="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
              @click="handleMeasure(row)"
            >
              {{ $t('experiment.current.transient.measure') }}
            </Button>
            <Button
              type="button"
              class="rounded bg-purple-500 px-3 py-1 text-sm text-white hover:bg-purple-600"
              @click="handleCurve(row)"
            >
              {{ $t('experiment.current.transient.curve') }}
            </Button>
          </div>
        </template>
      </Grid>
    </div>

    <!-- 稳定时间范围设置 -->
    <div class="mb-6">
      <div class="flex items-center gap-4">
        <label class="whitespace-nowrap text-sm font-medium text-gray-700">
          {{ $t('experiment.current.transient.stabilizationRange') }}
        </label>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600"> ± </span>
          <Input
            :value="stabilizationTimeRange"
            @update:value="(val) => (stabilizationTimeRange.value = val)"
            type="text"
            :disabled="!isEditable"
            class="w-20 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-600">%</span>
        </div>
      </div>
    </div>

    <!-- 结论部分 -->
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium">{{ $t('experiment.current.transient.conclusionLabel') }}</label>
      <div class="min-h-[60px] rounded border border-gray-300 p-3">
        <textarea
          v-model="conclusion"
          :readonly="!isEditable"
          class="h-full w-full resize-none border-0 outline-none"
          :placeholder="$t('experiment.current.transient.placeholderConclusion')"
        />
      </div>
    </div>

    <!-- 项目控制弹窗 -->
    <ProjectControlModal class="w-[600px]" :title="$t('experiment.current.transient.projectControl')">
      <div class="p-4">
        <div class="mb-4">
          <span class="text-sm text-gray-600">{{ $t('experiment.current.transient.selectItemsLabel') }}</span>
        </div>
        <CheckboxGroup
          :value="selectedRows"
          @update:value="onSelectedRowsUpdate"
          :options="checkboxOptions"
          class="flex flex-col gap-2"
        />
      </div>
    </ProjectControlModal>

    <!-- 曲线展示（与表格行对应） -->
    <div class="mt-6">
      <div class="mb-2 flex items-center justify-between">
        <h5 class="text-sm font-medium text-gray-700">{{ $t('experiment.current.transient.chartSectionTitle') }}</h5>
        <Button
          type="primary"
          :disabled="renderedCount === 0"
          @click="handleDownloadAllCharts"
          >{{ $t('experiment.current.transient.downloadAllPng') }}</Button
        >
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div
          v-for="row in tableData.filter(
            (r) => r.visible && renderedIds.includes(String(r.serialNumber)),
          )"
          :key="row.serialNumber"
          class="rounded border border-gray-200 p-3"
        >
          <LineChart
            :ref="setChartRef(String(row.serialNumber))"
            :data="chartsData[String(row.serialNumber)] || []"
            :title="
              chartsTitles[String(row.serialNumber)] ||
              `${row.loadChangeState} - ${$t('experiment.current.transient.chartTitleSuffix')}`
            "
            :range-area="
              chartsRangeAreas[String(row.serialNumber)] || defaultRangeArea
            "
            :x-axis-name="$t('experiment.current.transient.xAxisTime')"
            :y-axis-name="$t('experiment.current.transient.yAxisFrequency')"
            height="468px"
            line-color="#1890ff"
            :auto-resize="true"
          />
        </div>
      </div>
    </div>

    <!-- 倒计时弹窗 -->
    <CountdownModal
      ref="countdownModalRef"
      :countdown-seconds="15"
      :title="$t('experiment.current.transient.countdownTitle')"
      :message="$t('experiment.current.transient.countdownMessage')"
      :show-return-button="true"
      @countdown-end="handleCountdownEnd"
      @return-static="handleReturnStatic"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-ignore vite/vue typing workaround for lifecycle hooks in current env
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import {
  Button,
  message,
  CheckboxGroup,
  Input,
  Descriptions,
  DescriptionsItem,
} from 'ant-design-vue';
import { useVbenModal } from '@vben/common-ui';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useUserRole } from '#/composables/useUserRole';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { CountdownModal } from '../modal';
import {
  stabilityCheckApi,
  sendDcuDeviceMonitoringCommandApi,
} from '#/api/core';
import { LineChart } from '../charts';
import type { ChartDataPoint, RangeArea } from '../charts/types';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { $t } from '#/locales';

interface RowType {
  id: string;
  serialNumber: number;
  loadChangeState: string;
  beforeChangeFrequency: string;
  beforeChangePower: string;
  instantaneousFrequencyMaxMin: string;
  afterChangeFrequency: string;
  afterChangePower: string;
  stabilityTime: string;
  transientSpeedRegulationRate: string;
  curveInfo?: string;
  conclusion?: string;
  stableFrequencyDeviationRange?: string;
  visible: boolean;
}

// 响应式数据
const tableData = ref<RowType[]>([
  {
    id: '1',
    serialNumber: 1,
    loadChangeState: '100%突卸0%（第1次）',
    beforeChangeFrequency: '',
    beforeChangePower: '',
    instantaneousFrequencyMaxMin: '',
    afterChangeFrequency: '',
    afterChangePower: '',
    visible: true,
    stabilityTime: '',
    transientSpeedRegulationRate: '',
  },
  {
    id: '2',
    serialNumber: 2,
    loadChangeState: '100%突卸0%（第2次）',
    beforeChangeFrequency: '',
    beforeChangePower: '',
    instantaneousFrequencyMaxMin: '',
    afterChangeFrequency: '',
    afterChangePower: '',
    visible: true,
    stabilityTime: '',
    transientSpeedRegulationRate: '',
  },
  {
    id: '3',
    serialNumber: 3,
    loadChangeState: '100%突卸0%（第3次）',
    beforeChangeFrequency: '',
    beforeChangePower: '',
    instantaneousFrequencyMaxMin: '',
    afterChangeFrequency: '',
    afterChangePower: '',
    visible: true,
    stabilityTime: '',
    transientSpeedRegulationRate: '',
  },
  {
    id: '4',
    serialNumber: 4,
    loadChangeState: '0%突加50%（第1次）',
    beforeChangeFrequency: '',
    beforeChangePower: '',
    instantaneousFrequencyMaxMin: '',
    afterChangeFrequency: '',
    afterChangePower: '',
    visible: true,
    stabilityTime: '',
    transientSpeedRegulationRate: '',
  },
  {
    id: '5',
    serialNumber: 5,
    loadChangeState: '0%突加50%（第2次）',
    beforeChangeFrequency: '',
    beforeChangePower: '',
    instantaneousFrequencyMaxMin: '',
    afterChangeFrequency: '',
    afterChangePower: '',
    visible: true,
    stabilityTime: '',
    transientSpeedRegulationRate: '',
  },
  {
    id: '6',
    serialNumber: 6,
    loadChangeState: '0%突加50%（第3次）',
    beforeChangeFrequency: '',
    beforeChangePower: '',
    instantaneousFrequencyMaxMin: '',
    afterChangeFrequency: '',
    afterChangePower: '',
    visible: true,
    stabilityTime: '',
    transientSpeedRegulationRate: '',
  },
  {
    id: '7',
    serialNumber: 7,
    loadChangeState: '50%突加100%（第1次）',
    beforeChangeFrequency: '',
    beforeChangePower: '',
    instantaneousFrequencyMaxMin: '',
    afterChangeFrequency: '',
    afterChangePower: '',
    visible: true,
    stabilityTime: '',
    transientSpeedRegulationRate: '',
  },
  {
    id: '8',
    serialNumber: 8,
    loadChangeState: '50%突加100%（第2次）',
    beforeChangeFrequency: '',
    beforeChangePower: '',
    instantaneousFrequencyMaxMin: '',
    afterChangeFrequency: '',
    afterChangePower: '',
    visible: true,
    stabilityTime: '',
    transientSpeedRegulationRate: '',
  },
  {
    id: '9',
    serialNumber: 9,
    loadChangeState: '50%突加100%（第3次）',
    beforeChangeFrequency: '',
    beforeChangePower: '',
    instantaneousFrequencyMaxMin: '',
    afterChangeFrequency: '',
    afterChangePower: '',
    visible: true,
    stabilityTime: '',
    transientSpeedRegulationRate: '',
  },
]);

const stabilizationTimeRange = ref('');
const conclusion = ref('');

// Store 实例
const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { registerCollector, unregisterCollector, executeSyncQueue } =
  useDataCollector();

// 标志位，用于避免循环更新
const isUpdatingFromStore = ref(false);

// 倒计时弹窗
const countdownModalRef = ref<any>(null);
let commandParams: any = {};

// 折线图相关状态（多图，每行对应一个图表）
const chartsData = ref<Record<string, ChartDataPoint[]>>({});
const chartsTitles = ref<Record<string, string>>({});
const chartsRangeAreas = ref<Record<string, RangeArea>>({});
const renderedIds = ref<string[]>([]);
const renderedCount = computed(() => renderedIds.value.length);
const chartRefs: Record<string, any> = {};
const setChartRef = (id: string) => (el: any) => {
  chartRefs[id] = el;
};
// 统一编辑权限开关
const isEditable = computed(() => canEditTable());

// 项目控制弹窗
const selectedRows = ref<string[]>([]);
const onSelectedRowsUpdate = (vals: string[]) => {
  selectedRows.value = Array.isArray(vals) ? vals : [];
};

// 默认范围区间（使用当前实验的额定频率的 ±1%）
const defaultRangeArea = computed<RangeArea>(() => {
  const baseVoltage = Number(
    experimentStore.state.currentExperiment?.ratedFrequency ?? 50,
  );
  const deviationPercent = parseFloat(stabilizationTimeRange.value);
  const p = isNaN(deviationPercent) ? 3 : deviationPercent; // 默认±5%
  const min = Number((baseVoltage * (1 - p / 100)).toFixed(2));
  const max = Number((baseVoltage * (1 + p / 100)).toFixed(2));
  return {
    min,
    max,
    color: '#ff4d4f',
    name: '稳定频率范围',
  };
});

const updateAllData = async () => {
  // 执行数据同步队列
  const syncSuccess = await executeSyncQueue();

  if (syncSuccess) {
    await experimentStore.submitExperimentData();
    message.success($t('experiment.current.message.syncSuccess'));
  } else {
    message.error($t('experiment.current.message.collectorSyncFailed'));
    return;
  }
};

// 按钮处理函数
const handleMeasure = async (row: RowType) => {
  await updateAllData();
  if (!experimentStore.state.currentExperiment?.benchPosition) {
    message.error($t('experiment.current.message.benchPositionEmpty'));
    return;
  }
  // 调用瞬态调速率检测 API
  commandParams = {
    experimentId: experimentStore.state.currentExperiment?.id || '',
    loadChangeState: row.loadChangeState,
    serialNumber: row.serialNumber,
  };
  //终止实时数据推送
  sendDcuDeviceMonitoringCommand(0);
  stabilityCheckApi({
    ...commandParams,
    experimentStatus: true,
  }).then((res) => {
    res
      ? message.success($t('experiment.current.message.measureCommandSent'))
      : message.error($t('experiment.current.message.measureCommandFailed'));
  });
};

// 倒计时结束处理函数
const handleCountdownEnd = () => {
  message.info($t('experiment.current.message.countdownEndMeasureDone'));
  // 发送DCU监控命令，开启实时数据推送
  sendDcuDeviceMonitoringCommand(1);
  stabilityCheckApi({
    ...commandParams,
    experimentStatus: false,
  }).then((res) => {
    res
      ? message.success($t('experiment.current.message.callCommandSent'))
      : message.error($t('experiment.current.message.callCommandFailed'));
  });
};

// 返回静态处理函数
const handleReturnStatic = async () => {
  // 这里可以添加返回静态的API调用
  message.info($t('experiment.current.message.returningStatic'));
};

const handleCurve = (row: RowType) => {
  // 仅使用后端返回的曲线数据，移除模拟数据后备逻辑
  if (!row.curveInfo) {
    message.error($t('experiment.current.message.curveDataEmpty'));
    return;
  }
  const points = parseCurveInfoToPoints(row.curveInfo);
  if (points.length === 0) {
    message.error($t('experiment.current.message.curveDataParseFailed'));
    return;
  }

  const key = String(row.serialNumber);
  chartsData.value[key] = points;
  chartsTitles.value[key] = `${row.loadChangeState} - ${$t('experiment.current.transient.chartTitleSuffix')}`;
  chartsRangeAreas.value[key] = defaultRangeArea.value;
  if (!renderedIds.value.includes(key)) {
    renderedIds.value.push(key);
  }
  message.success(
    $t('experiment.current.message.generatedCurve', {
      state: row.loadChangeState,
      count: points.length,
    }),
  );
};

function parseCurveInfoToPoints(info: string): ChartDataPoint[] {
  try {
    const parsed = JSON.parse(info);
    // 支持对象映射形式 { "time": "value" } 或数组形式 [{ x, y }]
    if (Array.isArray(parsed)) {
      // 尝试标准化数组元素为 ChartDataPoint
      return parsed
        .map((p: any) => ({ x: Number(p.x), y: Number(p.y) }))
        .filter((p) => !isNaN(p.x) && !isNaN(p.y))
        .sort((a, b) => a.x - b.x);
    }
    if (parsed && typeof parsed === 'object') {
      const points: ChartDataPoint[] = Object.keys(parsed)
        .map((k) => ({ x: Number(k), y: Number((parsed as any)[k]) }))
        .filter((p) => !isNaN(p.x) && !isNaN(p.y))
        .sort((a, b) => a.x - b.x);
      return points;
    }
  } catch (e) {
    // 解析错误时返回空数组
  }
  return [];
}

function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_');
}

const sendDcuDeviceMonitoringCommand = async (state: 0 | 1) => {
  const experimentId = experimentStore.state.currentExperiment?.id || '';
  if (!experimentId) {
    message.error($t('experiment.current.message.experimentIdEmpty'));
    return;
  }
  const res = await sendDcuDeviceMonitoringCommandApi({
    experimentId,
    state,
  });
  if (res) {
    message.success($t('experiment.current.message.realtimeCommandSuccess'));
  } else {
    message.error($t('experiment.current.message.realtimeCommandFailed'));
  }
};

function handleDownloadAllCharts() {
  const rowsToDownload = tableData.value.filter(
    (r) => r.visible && renderedIds.value.includes(String(r.serialNumber)),
  );
  if (rowsToDownload.length === 0) {
    message.warning($t('experiment.current.message.noChartsToDownload'));
    return;
  }
  rowsToDownload.forEach((row) => {
    const ref = chartRefs[String(row.serialNumber)];
    if (ref && typeof ref.downloadChart === 'function') {
      const filename = `${$t('experiment.current.transient.chartTitleSuffix')}_${sanitizeFileName(`${row.serialNumber}_${row.loadChangeState}`)}`;
      ref.downloadChart(filename);
    }
  });
}

const handleEditProject = (row: RowType) => {
  modalApi.open();
};

// 构建 checkbox 选项
const checkboxOptions = computed(() => {
  return tableData.value.map((item) => ({
    label: `${item.serialNumber}. ${item.loadChangeState}`,
    value: String(item.serialNumber),
  }));
});

const [ProjectControlModal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    // 确认时更新visible状态
    handleConfirmProjectControl();
    updateAllData();
    modalApi.close();
  },
  onOpened() {
    // 弹窗打开时初始化选中行
    initSelectedRows();
  },
});

// 初始化选中行
function initSelectedRows() {
  selectedRows.value = tableData.value
    .filter((item) => item.visible)
    .map((item) => String(item.serialNumber));
}

// 显示项目控制弹窗
function handleShowProjectControl() {
  modalApi.open();
}

// 确认项目控制
function handleConfirmProjectControl() {
  tableData.value.forEach((item) => {
    item.visible = selectedRows.value.includes(String(item.serialNumber));
  });
  // 使用 loadData 方法更新表格数据，将 Proxy 对象转换为普通对象
  const filteredData = tableData.value
    .filter((item) => item.visible)
    .map((item) => ({ ...item })); // 使用展开运算符将 Proxy 转换为普通对象
  setTimeout(() => {
    GridApi.grid.loadData(filteredData);
  });
}

// WebSocket 监听器函数 - 处理瞬态调速率数据更新（区分推送类型）
const handleTransientSpeedData = (type: WebSocketMessageType, data: any) => {
  if (!data) {
    message.error(data.msg || '瞬态数据推送失败');
    return;
  }

  // 设置标志位，避免触发循环更新
  isUpdatingFromStore.value = true;
  if (type === WebSocketMessageType.TRANSIENT_SPEED && data.experimentStatus) {
    countdownModalRef.value?.open();
    return;
  }
  // 更新表格数据
  if (data.transientSpeedList && Array.isArray(data.transientSpeedList)) {
    const newTableData = data.transientSpeedList.slice(0, -1);
    tableData.value = newTableData;

    // 重新加载表格数据
    const filteredData = tableData.value
      .filter((item) => item.visible)
      .map((item) => ({ ...item }));
    setTimeout(() => {
      GridApi.grid.loadData(filteredData);
    });

    console.log('filteredData', filteredData);

    // 更新其他配置数据
    const lastItem = data.transientSpeedList.at(-1);
    if (lastItem) {
      stabilizationTimeRange.value =
        lastItem.stableFrequencyDeviationRange || '';
      conclusion.value = lastItem.conclusion || '';
    }
  }

  // 重置标志位
  nextTick(() => {
    isUpdatingFromStore.value = false;
  });
};

// 保存注册的消息监听器引用，便于卸载
let onExperimentMessage: (data: any) => void;
let onTransientSpeedMessage: (data: any) => void;

const collector = {
  id: 'transientSpeedRegulation',
  name: 'TransientSpeedRegulation',
  component: 'TransientSpeedRegulation',
  type: 'transientSpeedRegulation',
  collect: () => {
    const gridData = GridApi.grid.getTableData()?.fullData || [];
    const transientSpeedData = tableData.value.map((item) => {
      // 如果项目可见，优先使用表格中的编辑数据，否则使用原始数据
      const dataSource = item.visible
        ? gridData.find((row) => row.serialNumber === item.serialNumber) || item
        : item;
      return { ...dataSource };
    });

    const result = transientSpeedData.concat({
      stableFrequencyDeviationRange: stabilizationTimeRange.value,
      conclusion: conclusion.value || '',
    });
    return result;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store
    experimentStore.updateTransientSpeedRegulationList(data);
  },
};

// 生命周期钩子
onMounted(() => {
  // 初始化时从 store 加载数据
  const { transientSpeedList = [] } =
    experimentStore.state?.currentExperiment || {};
  if (transientSpeedList.length > 0) {
    // 将 Proxy 对象转换为普通数据对象后提交
    handleTransientSpeedData(WebSocketMessageType.EXPERIMENT, {
      transientSpeedList: JSON.parse(JSON.stringify(transientSpeedList)),
    });
  }

  registerCollector(collector);

  // 注册 WebSocket 监听器 - 监听瞬态调速率数据更新
  onExperimentMessage = (data: any) =>
    handleTransientSpeedData(WebSocketMessageType.EXPERIMENT, data);
  onTransientSpeedMessage = (data: any) =>
    handleTransientSpeedData(WebSocketMessageType.TRANSIENT_SPEED, data);

  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    onExperimentMessage,
  );

  webSocketStore.registerMessageListener(
    WebSocketMessageType.TRANSIENT_SPEED,
    onTransientSpeedMessage,
  );
});

onUnmounted(() => {
  unregisterCollector('transientSpeedRegulation');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    onExperimentMessage,
  );

  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.TRANSIENT_SPEED,
    onTransientSpeedMessage,
  );
});

// VXE Table 配置
const gridOptions: VxeGridProps = {
  data: tableData.value,
  columns: [
    { field: 'serialNumber', title: $t('experiment.current.columns.serialNumber'), width: 80 },
    {
      field: 'loadChangeState',
      title: $t('experiment.current.columns.loadChangeState'),
      width: 200,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'beforeChangeFrequency',
      title: $t('experiment.current.columns.beforeChangeFrequency'),
      width: 130,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'beforeChangePower',
      title: $t('experiment.current.columns.beforeChangePower'),
      width: 130,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'instantaneousFrequencyMaxMin',
      title: $t('experiment.current.columns.instantaneousFrequencyMaxMin'),
      width: 180,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'afterChangeFrequency',
      title: $t('experiment.current.columns.afterChangeFrequency'),
      width: 130,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'afterChangePower',
      title: $t('experiment.current.columns.afterChangePower'),
      width: 130,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'stabilityTime',
      title: $t('experiment.current.columns.stabilityTime'),
      width: 120,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'transientSpeedRegulationRate',
      title: $t('experiment.current.columns.transientSpeedRegulationRate'),
      width: 140,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'action',
      title: $t('experiment.current.columns.action'),
      width: 206,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  editConfig: { trigger: 'click', mode: 'cell', beforeEditMethod: () => canEditTable() },
  checkboxConfig: {
    labelField: 'serialNumber',
    checkStrictly: true,
    highlight: true,
  },
  pagerConfig: {
    enabled: false,
  },
  rowConfig: {
    height: 48,
  },
  border: true,
  stripe: true,
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });
</script>

<style scoped></style>
