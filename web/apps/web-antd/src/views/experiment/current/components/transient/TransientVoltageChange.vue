<template>
  <div class="space-y-6">
    <!-- 标题部分 -->
    <div class="mb-6">
      <h4 class="text-base font-semibold text-gray-800">
        {{ $t('experiment.current.transientVoltage.title') }}
      </h4>
      <p class="mt-1 text-sm text-gray-600">
        {{ $t('experiment.current.transientVoltage.subtitle') }}
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
        {{ $t('experiment.current.transientVoltage.editProject') }}
      </Button>

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

    <!-- 稳定电压偏差范围设置 -->
    <div class="mb-6">
      <div class="flex items-center gap-4">
        <label class="whitespace-nowrap text-sm font-medium text-gray-700">
          {{ $t('experiment.current.transientVoltage.labels.stableRange') }}
        </label>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600"> ± </span>
          <Input
            :value="stableVoltageDeviationRange"
            @update:value="onStableRangeUpdate"
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
      <label class="mb-2 block text-sm font-medium">{{
        $t('experiment.current.transient.conclusionLabel')
      }}</label>
      <div class="min-h-[60px] rounded border border-gray-300 p-3">
        <textarea
          v-model="conclusion"
          :readonly="!isEditable"
          class="h-full w-full resize-none border-0 outline-none"
          :placeholder="
            $t('experiment.current.transient.placeholderConclusion')
          "
        />
      </div>
    </div>

    <!-- 项目控制弹窗 -->
    <ProjectControlModal
      class="w-[600px]"
      :title="$t('experiment.current.transient.projectControl')"
    >
      <div class="p-4">
        <div class="mb-4">
          <span class="text-sm text-gray-600">{{
            $t('experiment.current.transient.selectItemsLabel')
          }}</span>
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
        <h5 class="text-sm font-medium text-gray-700">
          {{ $t('experiment.current.transient.chartSectionTitle') }}
        </h5>
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
              `${row.loadChangeState} - ${$t('experiment.current.transientVoltage.charts.titleSuffix')}`
            "
            :range-area="
              chartsRangeAreas[String(row.serialNumber)] || defaultRangeArea
            "
            x-axis-name="$t('experiment.current.transient.xAxisTime')"
            y-axis-name="$t('experiment.current.transientVoltage.charts.yAxisVoltage')"
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
import { Button, message, CheckboxGroup, Input } from 'ant-design-vue';
import { useI18n } from '@vben/locales';
import { useVbenModal } from '@vben/common-ui';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useUserRole } from '#/composables/useUserRole';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { CountdownModal } from '../modal';
import {
  transientVoltageCheckApi,
  sendDcuDeviceMonitoringCommandApi,
} from '#/api/core';
import { LineChart } from '../charts';
import type { ChartDataPoint, RangeArea } from '../charts/types';

interface RowType {
  id: string;
  serialNumber: number;
  loadChangeState: string;
  beforeChangeVoltage: string;
  beforeChangeCurrent: string;
  beforeChangePowerFactor: string;
  instantaneousVoltageMaxMin: string;
  afterChangeVoltage: string;
  afterChangeCurrent: string;
  afterChangePowerFactor: string;
  stabilityTime: string;
  transientVoltageChangeRate: string;
  curveInfo?: string;
  conclusion?: string;
  stableVoltageDeviationRange?: string;
  visible: boolean;
}

// 响应式数据
const tableData = ref<RowType[]>([
  {
    id: '1',
    serialNumber: 1,
    loadChangeState: '60%突卸10%（第1次）',
    beforeChangeVoltage: '',
    beforeChangeCurrent: '',
    beforeChangePowerFactor: '',
    instantaneousVoltageMaxMin: '',
    afterChangeVoltage: '',
    afterChangeCurrent: '',
    afterChangePowerFactor: '',
    stabilityTime: '',
    transientVoltageChangeRate: '',
    visible: true,
  },
  {
    id: '2',
    serialNumber: 2,
    loadChangeState: '60%突卸10%（第2次）',
    beforeChangeVoltage: '',
    beforeChangeCurrent: '',
    beforeChangePowerFactor: '',
    instantaneousVoltageMaxMin: '',
    afterChangeVoltage: '',
    afterChangeCurrent: '',
    afterChangePowerFactor: '',
    stabilityTime: '',
    transientVoltageChangeRate: '',
    visible: true,
  },
  {
    id: '3',
    serialNumber: 3,
    loadChangeState: '60%突卸10%（第3次）',
    beforeChangeVoltage: '',
    beforeChangeCurrent: '',
    beforeChangePowerFactor: '',
    instantaneousVoltageMaxMin: '',
    afterChangeVoltage: '',
    afterChangeCurrent: '',
    afterChangePowerFactor: '',
    stabilityTime: '',
    transientVoltageChangeRate: '',
    visible: true,
  },
  {
    id: '4',
    serialNumber: 4,
    loadChangeState: '0%突加60%（第1次）',
    beforeChangeVoltage: '',
    beforeChangeCurrent: '',
    beforeChangePowerFactor: '',
    instantaneousVoltageMaxMin: '',
    afterChangeVoltage: '',
    afterChangeCurrent: '',
    afterChangePowerFactor: '',
    stabilityTime: '',
    transientVoltageChangeRate: '',
    visible: true,
  },
  {
    id: '5',
    serialNumber: 5,
    loadChangeState: '0%突加60%（第2次）',
    beforeChangeVoltage: '',
    beforeChangeCurrent: '',
    beforeChangePowerFactor: '',
    instantaneousVoltageMaxMin: '',
    afterChangeVoltage: '',
    afterChangeCurrent: '',
    afterChangePowerFactor: '',
    stabilityTime: '',
    transientVoltageChangeRate: '',
    visible: true,
  },
  {
    id: '6',
    serialNumber: 6,
    loadChangeState: '0%突加60%（第3次）',
    beforeChangeVoltage: '',
    beforeChangeCurrent: '',
    beforeChangePowerFactor: '',
    instantaneousVoltageMaxMin: '',
    afterChangeVoltage: '',
    afterChangeCurrent: '',
    afterChangePowerFactor: '',
    stabilityTime: '',
    transientVoltageChangeRate: '',
    visible: true,
  },
]);

const stableVoltageDeviationRange = ref('');
const conclusion = ref('');
const onStableRangeUpdate = (val: string) => {
  stableVoltageDeviationRange.value = val ?? '';
};

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

const { t } = useI18n();

const defaultRangeArea = computed<RangeArea>(() => {
  const baseVoltage = Number(
    experimentStore.state.currentExperiment?.ratedVoltage ?? 220,
  );
  const deviationPercent = parseFloat(stableVoltageDeviationRange.value);
  const p = isNaN(deviationPercent) ? 5 : deviationPercent; // 默认±5%
  const min = Number((baseVoltage * (1 - p / 100)).toFixed(2));
  const max = Number((baseVoltage * (1 + p / 100)).toFixed(2));
  return {
    min,
    max,
    color: '#ff4d4f',
    name: t('experiment.current.transientVoltage.charts.rangeAreaName'),
  };
});

// 统一编辑权限开关
const isEditable = computed(() => canEditTable());

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

// 按钮处理函数
const handleMeasure = async (row: RowType) => {
  await updateAllData();
  if (!experimentStore.state.currentExperiment?.benchPosition) {
    message.error(t('experiment.current.message.benchPositionEmpty'));
    return;
  }
  // 调用瞬态电压变化检测 API
  commandParams = {
    experimentId: experimentStore.state.currentExperiment?.id || '',
    serialNumber: row.serialNumber,
    loadChangeState: row.loadChangeState,
  };
  // 终止实时数据推送
  await sendDcuDeviceMonitoringCommand(0);
  const res = await transientVoltageCheckApi({
    ...commandParams,
    experimentStatus: true,
  });
  res
    ? message.success(t('experiment.current.message.measureCommandSent'))
    : message.error(t('experiment.current.message.measureCommandFailed'));
};

// 倒计时结束处理函数
const handleCountdownEnd = async () => {
  message.info(t('experiment.current.message.countdownEndMeasureDone'));
  // 恢复实时数据推送
  await sendDcuDeviceMonitoringCommand(1);
  const res = await transientVoltageCheckApi({
    ...commandParams,
    experimentStatus: false,
  });
  res
    ? message.success(t('experiment.current.message.callCommandSent'))
    : message.error(t('experiment.current.message.callCommandFailed'));
};

// 返回静态处理函数
const handleReturnStatic = async () => {
  // 这里可以添加返回静态的API调用
  message.info(t('experiment.current.message.returningStatic'));
};

const handleCurve = (row: RowType) => {
  // 仅使用后端返回的曲线数据，移除示例数据后备逻辑
  if (!row.curveInfo) {
    message.error(t('experiment.current.message.curveDataEmpty'));
    return;
  }
  const points = parseCurveInfoToPoints(row.curveInfo);
  if (points.length === 0) {
    message.error(t('experiment.current.message.curveDataParseFailed'));
    return;
  }

  const key = String(row.serialNumber);
  chartsData.value[key] = points;
  chartsTitles.value[key] =
    `${row.loadChangeState} - ${t('experiment.current.transientVoltage.charts.titleSuffix')}`;
  chartsRangeAreas.value[key] = defaultRangeArea.value;
  if (!renderedIds.value.includes(key)) {
    renderedIds.value.push(key);
  }
  message.success(
    t('experiment.current.message.generatedCurve', {
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
    message.error(t('experiment.current.message.experimentIdEmpty'));
    return;
  }
  const res = await sendDcuDeviceMonitoringCommandApi({
    experimentId,
    state,
  });
  if (res) {
    message.success(t('experiment.current.message.realtimeCommandSuccess'));
  } else {
    message.error(t('experiment.current.message.realtimeCommandFailed'));
  }
};

function handleDownloadAllCharts() {
  const rowsToDownload = tableData.value.filter(
    (r) => r.visible && renderedIds.value.includes(String(r.serialNumber)),
  );
  if (rowsToDownload.length === 0) {
    message.warning(t('experiment.current.message.noChartsToDownload'));
    return;
  }
  rowsToDownload.forEach((row) => {
    const ref = chartRefs[String(row.serialNumber)];
    if (ref && typeof ref.downloadChart === 'function') {
      const filename = `${t('experiment.current.transient.tabs.voltage')}_${sanitizeFileName(`${row.serialNumber}_${row.loadChangeState}`)}`;
      ref.downloadChart(filename);
    }
  });
}

const handleEditProject = () => {
  modalApi.open();
};

// 项目控制弹窗
const selectedRows = ref<string[]>([]);
const onSelectedRowsUpdate = (vals: string[]) => {
  selectedRows.value = Array.isArray(vals) ? vals : [];
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

  console.log('selectedRows', selectedRows.value);
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
  GridApi.grid.reloadData(filteredData);
}

// 同步并提交实验数据，保持与瞬态调速组件一致
const updateAllData = async () => {
  // 执行数据同步队列
  const syncSuccess = await executeSyncQueue();
  if (syncSuccess) {
    await experimentStore.submitExperimentData();
    message.success('实验数据同步成功');
  } else {
    message.error('数据收集器同步失败');
    return;
  }
};

// WebSocket 监听器函数 - 处理瞬态电压变化数据更新（区分推送类型）
const handleTransientVoltageData = (type: WebSocketMessageType, data: any) => {
  if (!data) {
    message.error(data?.msg || '瞬态数据推送失败');
    return;
  }
  // 设置标志位，避免触发循环更新
  isUpdatingFromStore.value = true;
  if (
    type === WebSocketMessageType.TRANSIENT_VOLTAGE &&
    data.experimentStatus
  ) {
    // 打开倒计时弹窗
    // @ts-ignore countdownModalRef is a component instance ref
    countdownModalRef.value?.open();
    return;
  }

  // 更新表格数据
  if (data.transientVoltageList && Array.isArray(data.transientVoltageList)) {
    const newTableData = data.transientVoltageList.slice(0, -1);
    tableData.value = newTableData;

    // 重新加载表格数据
    const filteredData = tableData.value
      .filter((item) => item.visible)
      .map((item) => ({ ...item }));
    setTimeout(() => {
      GridApi.grid.loadData(filteredData);
    });

    // 更新其他配置数据
    const lastItem = data.transientVoltageList.at(-1);
    if (lastItem) {
      stableVoltageDeviationRange.value =
        lastItem.stableVoltageDeviationRange || '';
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
let onTransientVoltageMessage: (data: any) => void;

// 数据收集器
const collector = {
  id: 'transientVoltageChange',
  name: 'TransientVoltageChange',
  component: 'TransientVoltageChange',
  type: 'transientVoltageChange',
  collect: () => {
    const gridData = GridApi.grid.getTableData()?.fullData || [];
    const transientVoltageData = tableData.value.map((item) => {
      // 如果项目可见，优先使用表格中的编辑数据，否则使用原始数据
      const dataSource = item.visible
        ? gridData.find((row) => row.serialNumber === item.serialNumber) || item
        : item;

      return { ...dataSource };
    });

    const result = transientVoltageData.concat({
      stableVoltageDeviationRange: stableVoltageDeviationRange.value,
      conclusion: conclusion.value || '',
    });

    console.log('transientVoltageData', result);
    return result;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store
    experimentStore.updateTransientVoltageChangeList(data);
  },
};

// 生命周期钩子
onMounted(() => {
  // 初始化时从 store 加载数据
  const { transientVoltageList = [] } =
    experimentStore.state?.currentExperiment || {};
  if (transientVoltageList.length > 0) {
    // 将 Proxy 对象转换为普通数据对象后提交
    handleTransientVoltageData(WebSocketMessageType.EXPERIMENT, {
      transientVoltageList: JSON.parse(JSON.stringify(transientVoltageList)),
    });
  }

  registerCollector(collector);

  // 注册 WebSocket 监听器 - 监听瞬态电压变化数据更新
  onExperimentMessage = (data: any) =>
    handleTransientVoltageData(WebSocketMessageType.EXPERIMENT, data);
  onTransientVoltageMessage = (data: any) =>
    handleTransientVoltageData(WebSocketMessageType.TRANSIENT_VOLTAGE, data);

  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    onExperimentMessage,
  );

  // 注册 WebSocket 监听器 - 监听瞬态电压变化数据更新
  webSocketStore.registerMessageListener(
    WebSocketMessageType.TRANSIENT_VOLTAGE,
    onTransientVoltageMessage,
  );
});

onUnmounted(() => {
  unregisterCollector('transientVoltageChange');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    onExperimentMessage,
  );
  // 取消注册 WebSocket 监听器 - 监听瞬态电压数据更新
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.TRANSIENT_VOLTAGE,
    onTransientVoltageMessage,
  );
});

// VXE Table 配置
const gridOptions: VxeGridProps = {
  data: tableData.value,
  columns: [
    {
      field: 'serialNumber',
      title: t('experiment.current.transientVoltage.columns.serialNumber'),
      width: 80,
    },
    {
      field: 'loadChangeState',
      title: t('experiment.current.transientVoltage.columns.loadChangeState'),
      width: 200,
      editRender: {
        name: 'VxeInput',
        props: { type: 'text' },
      },
    },
    {
      field: 'beforeChangeVoltage',
      title: t(
        'experiment.current.transientVoltage.columns.beforeChangeVoltage',
      ),
      width: 130,
      editRender: { name: 'VxeInput', props: { type: 'text' } },
    },
    {
      field: 'beforeChangeCurrent',
      title: t(
        'experiment.current.transientVoltage.columns.beforeChangeCurrent',
      ),
      width: 130,
      editRender: { name: 'VxeInput', props: { type: 'text' } },
    },
    {
      field: 'beforeChangePowerFactor',
      title: t(
        'experiment.current.transientVoltage.columns.beforeChangePowerFactor',
      ),
      width: 180,
      editRender: { name: 'VxeInput', props: { type: 'text' } },
    },
    {
      field: 'instantaneousVoltageMaxMin',
      title: t(
        'experiment.current.transientVoltage.columns.instantaneousVoltageMaxMin',
      ),
      width: 180,
      editRender: { name: 'VxeInput', props: { type: 'text' } },
    },
    {
      field: 'afterChangeVoltage',
      title: t(
        'experiment.current.transientVoltage.columns.afterChangeVoltage',
      ),
      width: 130,
      editRender: { name: 'VxeInput', props: { type: 'text' } },
    },
    {
      field: 'afterChangeCurrent',
      title: t(
        'experiment.current.transientVoltage.columns.afterChangeCurrent',
      ),
      width: 130,
      editRender: { name: 'VxeInput', props: { type: 'text' } },
    },
    {
      field: 'afterChangePowerFactor',
      title: t(
        'experiment.current.transientVoltage.columns.afterChangePowerFactor',
      ),
      width: 180,
      editRender: { name: 'VxeInput', props: { type: 'text' } },
    },
    {
      field: 'stabilityTime',
      title: t('experiment.current.transientVoltage.columns.stabilityTime'),
      width: 120,
      editRender: { name: 'VxeInput', props: { type: 'text' } },
    },
    {
      field: 'transientVoltageChangeRate',
      title: t(
        'experiment.current.transientVoltage.columns.transientVoltageChangeRate',
      ),
      width: 180,
      editRender: { name: 'VxeInput', props: { type: 'text' } },
    },
    {
      field: 'action',
      title: t('experiment.current.transientVoltage.columns.action'),
      width: 200,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    beforeEditMethod: () => canEditTable(),
  },
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
