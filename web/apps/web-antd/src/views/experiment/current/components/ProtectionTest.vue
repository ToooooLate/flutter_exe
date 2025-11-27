<template>
  <div class="protection-test-container">
    <div class="mb-4">
      <h4 class="text-base font-medium">Alarm and safety test</h4>
    </div>

    <div class="vp-raw w-full">
      <Grid />
    </div>

    <!-- 备注和结论 -->
    <div class="mt-6">
      <div class="mb-2">
        <label class="text-sm font-medium">{{ t('experiment.current.protection.test.labels.remark') }}</label>
      </div>
      <div class="min-h-[60px] rounded border border-gray-300 p-3">
        <textarea
          v-model="remark"
          class="h-full w-full resize-none border-none outline-none"
          :placeholder="t('experiment.current.protection.test.placeholders.remark')"
          :readonly="!isEditable"
        ></textarea>
      </div>
    </div>

    <div class="mt-6">
      <div class="mb-2">
        <label class="text-sm font-medium">{{ t('experiment.current.protection.test.labels.conclusion') }}</label>
      </div>
      <div class="min-h-[60px] rounded border border-gray-300 p-3">
        <textarea
          v-model="conclusion"
          class="h-full w-full resize-none border-none outline-none"
          :placeholder="t('experiment.current.protection.test.placeholders.conclusion')"
          :readonly="!isEditable"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { useI18n } from '@vben/locales';

interface RowType {
  id: string;
  serialNumber: number;
  testItem: string;
  signalType: string;
  setValue: string;
  localDisplay: string;
  localAlarm: string;
  localShd: string;
  testResult: string;
  remark: string;
}

const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { t } = useI18n();
const tableData = [
  {
    id: '1',
    serialNumber: 1,
    testItem: t('experiment.current.protection.test.items.oilPressureLowAlarm'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '2',
    serialNumber: 2,
    testItem: t('experiment.current.protection.test.items.coolantTempHighAlarm'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '3',
    serialNumber: 3,
    testItem: t('experiment.current.protection.test.items.lubOilTempHighAlarm'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '4',
    serialNumber: 4,
    testItem: t('experiment.current.protection.test.items.fuelLeakage'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '5',
    serialNumber: 5,
    testItem: t('experiment.current.protection.test.items.controlPowerVoltageLowAlarm'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '6',
    serialNumber: 6,
    testItem: t('experiment.current.protection.test.items.overspeedAlarm'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '7',
    serialNumber: 7,
    testItem: t('experiment.current.protection.test.items.coolantLevelLowAlarm'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '8',
    serialNumber: 8,
    testItem: t('experiment.current.protection.test.items.highCoolantTemperatureShutdown'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '9',
    serialNumber: 9,
    testItem: t('experiment.current.protection.test.items.lowLubOilPressureShutdown'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '10',
    serialNumber: 10,
    testItem: t('experiment.current.protection.test.items.localEmergencyStop'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '11',
    serialNumber: 11,
    testItem: t('experiment.current.protection.test.items.remoteEmergencyStop'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '12',
    serialNumber: 12,
    testItem: t('experiment.current.protection.test.items.overspeedShutdown'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  {
    id: '13',
    serialNumber: 13,
    testItem: t('experiment.current.protection.test.items.startFailure'),
    signalType: '',
    setValue: '',
    localDisplay: '',
    localAlarm: '',
    localShd: '',
    testResult: '',
    remark: '',
  },
  // {
  //   id: '14',
  //   serialNumber: 14,
  //   testItem: 'Coolant Pressure',
  //   signalType: '',
  //   setValue: '',
  //   localDisplay: '',
  //   localAlarm: '',
  //   localShd: '',
  //   testResult: '',
  //   remark: '',
  // },
  // {
  //   id: '15',
  //   serialNumber: 15,
  //   testItem: 'Left Exhaust Temperature',
  //   signalType: '',
  //   setValue: '',
  //   localDisplay: '',
  //   localAlarm: '',
  //   localShd: '',
  //   testResult: '',
  //   remark: '',
  // },
  // {
  //   id: '16',
  //   serialNumber: 16,
  //   testItem: 'Right Exhaust Temperature',
  //   signalType: '',
  //   setValue: '',
  //   localDisplay: '',
  //   localAlarm: '',
  //   localShd: '',
  //   testResult: '',
  //   remark: '',
  // },
  // {
  //   id: '17',
  //   serialNumber: 17,
  //   testItem: 'Main Power Failure',
  //   signalType: '',
  //   setValue: '',
  //   localDisplay: '',
  //   localAlarm: '',
  //   localShd: '',
  //   testResult: '',
  //   remark: '',
  // },
  // {
  //   id: '18',
  //   serialNumber: 18,
  //   testItem: 'Second Power Failure',
  //   signalType: '',
  //   setValue: '',
  //   localDisplay: '',
  //   localAlarm: '',
  //   localShd: '',
  //   testResult: '',
  //   remark: '',
  // },
  // {
  //   id: '19',
  //   serialNumber: 19,
  //   testItem: 'Charger Fail Alarm',
  //   signalType: '',
  //   setValue: '',
  //   localDisplay: '',
  //   localAlarm: '',
  //   localShd: '',
  //   testResult: '',
  //   remark: '',
  // },
  // {
  //   id: '20',
  //   serialNumber: 20,
  //   testItem: 'Alternator Water Leakage',
  //   signalType: '',
  //   setValue: '',
  //   localDisplay: '',
  //   localAlarm: '',
  //   localShd: '',
  //   testResult: '',
  //   remark: '',
  // },
];

const gridOptions: VxeTableGridOptions<RowType> = {
  columns: [
    {
      field: 'serialNumber',
      title: t('experiment.current.protection.test.columns.serialNumber'),
      width: 60,
      align: 'center',
    },
    {
      field: 'testItem',
      title: t('experiment.current.protection.test.columns.testItem'),
      minWidth: 200,
      showOverflow: false,
      cellRender: {
        name: 'VxeText',
        props: {
          style: {
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          },
        },
      },
    },
    {
      field: 'signalType',
      title: t('experiment.current.protection.test.columns.signalType'),
      width: 100,
      editRender: { name: 'input' },
    },
    {
      field: 'setValue',
      title: t('experiment.current.protection.test.columns.setValue'),
      width: 100,
      editRender: { name: 'input' },
    },
    {
      field: 'localDisplay',
      title: t('experiment.current.protection.test.columns.localDisplay'),
      width: 120,
      editRender: { name: 'input' },
    },
    {
      field: 'localAlarm',
      title: t('experiment.current.protection.test.columns.localAlarm'),
      width: 120,
      editRender: { name: 'input' },
    },
    {
      field: 'localShd',
      title: t('experiment.current.protection.test.columns.localShd'),
      width: 120,
      editRender: { name: 'input' },
    },
    {
      field: 'testResult',
      title: t('experiment.current.protection.test.columns.testResult'),
      width: 120,
      editRender: { name: 'input' },
    },
    {
      field: 'remark',
      title: t('experiment.current.protection.test.columns.remark'),
      minWidth: 150,
      showOverflow: false,
      editRender: { name: 'input' },
      cellRender: {
        name: 'VxeText',
        props: {
          style: {
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          },
        },
      },
    },
  ],
  data: tableData,
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
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions });

// 响应式数据
const remark = ref('');
const conclusion = ref('');
const isEditable = computed(() => canEditTable());

// 数据收集器
const { registerCollector, unregisterCollector } = useDataCollector();

// 组件挂载时注册数据收集器
// WebSocket 监听器：处理服务端实验数据（全量）
const handleProtectExperimentFromServer = (payload: any) => {
  const list = payload?.protectExperimentList || [];
  if (!Array.isArray(list) || list.length === 0) return;
  console.log('list', list);
  // 行数据取前 N-1，末尾一项作为结论
  const rows =
    list.slice(0, -1).length > 0
      ? list.slice(0, -1).map((item: any) => ({
          ...item,
        }))
      : tableData;

  const last = list[list.length - 1];
  conclusion.value = last?.conclusion || '';

  setTimeout(() => {
    GridApi.grid.loadData(rows);
  });
};

onMounted(() => {
  // 初始化：从 store 同步一次数据
  const protectExperimentList =
    experimentStore.state.currentExperiment?.protectExperimentList || [];
  if (protectExperimentList.length > 0) {
    handleProtectExperimentFromServer({
      protectExperimentList: JSON.parse(JSON.stringify(protectExperimentList)),
    });
  }

  registerCollector({
    name: 'protectionTest',
    type: 'protectionTest',
    collect: () => {
      const tableData = GridApi.grid.getTableData()?.fullData || [];

      // 转换表格数据为符合接口的格式
      const protectionTestData = tableData
        .map((row: RowType) => ({
          id: row.id || '',
          serialNumber: row.serialNumber,
          testItem: row.testItem,
          signalType: row.signalType,
          setValue: row.setValue,
          localDisplay: row.localDisplay,
          localAlarm: row.localAlarm,
          localShd: row.localShd,
          testResult: row.testResult,
          remark: row.remark,
        }))
        .concat({
          description: remark.value,
          conclusion: conclusion.value,
        });

      return protectionTestData;
    },
    hasChanges: () => {
      return true;
    },
    syncToStore: async (data: any) => {
      // 同步数据到 experiment store
      await experimentStore.updateProtectExperimentList(data);
    },
  });

  // 注册 WebSocket 监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleProtectExperimentFromServer,
  );
});

// 组件卸载时注销数据收集器
onUnmounted(() => {
  unregisterCollector('protectionTest');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleProtectExperimentFromServer,
  );
});
</script>

<style scoped></style>
