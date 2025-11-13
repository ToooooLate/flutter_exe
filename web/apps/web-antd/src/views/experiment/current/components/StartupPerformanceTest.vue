<template>
  <div class="p-6">
    <!-- 标题 -->
    <div class="mb-6">
      <h2 class="text-foreground mb-2 text-xl font-bold">
        Check start performance at ambient temperature (Start Batteries)
      </h2>
    </div>

    <!-- 测量设备 -->
    <div class="mb-4">
      <span class="text-foreground text-sm font-medium">测量设备：示波器</span>
    </div>

    <!-- 计算方法 -->
    <div class="mb-6">
      <span class="text-foreground text-sm font-medium">
        计算方法：传感器输出频率 = 飞轮齿数 × 额定转速 / 周期
      </span>
    </div>

    <!-- 输入字段 -->
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- 机组飞轮齿数 -->
      <div class="flex items-center gap-4">
        <label class="text-foreground whitespace-nowrap text-sm font-medium">
          机组飞轮齿数：
        </label>
        <input
          v-model.number="flywheelTeeth"
          type="number"
          step="1"
          class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入飞轮齿数"
        />
      </div>

      <!-- 机组达到怠速转速 -->
      <div class="flex items-center gap-4">
        <label class="text-foreground whitespace-nowrap text-sm font-medium">
          机组达到怠速转速：
        </label>
        <div class="flex flex-1 items-center gap-2">
          <input
            v-model="targetSpeed"
            type="number"
            class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="转速"
          />
          <span class="text-foreground text-sm">rpm 转即为</span>
          <input
            v-model="frequency"
            type="number"
            class="w-20 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="频率"
          />
          <span class="text-foreground text-sm">Hz 视为启动成功</span>
        </div>
      </div>
    </div>

    <!-- 启动次数表格 -->
    <div class="mb-8">
      <Grid />
    </div>

    <!-- 自起动试验 -->
    <div class="mb-6">
      <h3 class="text-foreground mb-4 text-lg font-semibold">自起动试验</h3>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="flex items-center gap-2">
          <label class="text-foreground whitespace-nowrap text-sm font-medium">
            自起动试验
          </label>
          <input
            v-model="autoStartTest"
            type="text"
            class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder=""
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-foreground whitespace-nowrap text-sm font-medium">
            自动停机试验
          </label>
          <input
            v-model="autoStopTest"
            type="text"
            class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder=""
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-foreground whitespace-nowrap text-sm font-medium">
            3次启动失败
          </label>
          <input
            v-model="threeFailures"
            type="text"
            class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder=""
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-foreground whitespace-nowrap text-sm font-medium">
            紧急停机
          </label>
          <input
            v-model="emergencyStop"
            type="text"
            class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder=""
          />
        </div>
      </div>
    </div>

    <!-- 结论 -->
    <div class="mb-6">
      <label class="text-foreground mb-2 block text-sm font-medium"
        >结论：</label
      >
      <textarea
        v-model="conclusion"
        rows="4"
        class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="请输入结论"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted } from 'vue';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useDataCollector } from '#/composables/useDataCollector';
import { useExperimentStore } from '#/store/experiment';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';

// Store 实例
const experimentStore = useExperimentStore();
const { registerCollector, unregisterCollector } = useDataCollector();
const webSocketStore = useWebSocketStore();
const isUpdatingFromStore = ref(false);

// 响应式数据
const flywheelTeeth = ref('');
const targetSpeed = ref('');
const frequency = ref('');
const autoStartTest = ref('');
const autoStopTest = ref('');
const threeFailures = ref('');
const emergencyStop = ref('');
const conclusion = ref('');

// 表格数据
const tableList = [
  {
    startNumber: '1',
    ambientTemperature: 0,
    startupTime: 0,
    startupStatus: '',
  },
  {
    startNumber: '2',
    ambientTemperature: 0,
    startupTime: 0,
    startupStatus: '',
  },
  {
    startNumber: '3',
    ambientTemperature: 0,
    startupTime: 0,
    startupStatus: '',
  },
  {
    startNumber: '4',
    ambientTemperature: 0,
    startupTime: 0,
    startupStatus: '',
  },
  {
    startNumber: '5',
    ambientTemperature: 0,
    startupTime: 0,
    startupStatus: '',
  },
  {
    startNumber: '6',
    ambientTemperature: 0,
    startupTime: 0,
    startupStatus: '',
  },
  {
    startNumber: '要求',
    ambientTemperature: 0,
    startupTime: 0,
    startupStatus: '',
  },
];
const tableData = ref(tableList);

// 表格配置
const gridOptions = {
  data: tableData.value,
  columns: [
    {
      field: 'startNumber',
      title: '启动次数\nNumber of starts',
      align: 'center',
      width: 200,
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
      field: 'ambientTemperature',
      title: '环境温度(℃)\nAmbient Temp. (℃)',
      align: 'center',
      showOverflow: false,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          type: 'number',
          precision: 1,
        },
      },
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
      field: 'startupTime',
      title: '启动时间(s)\nStart-up time(s)',
      align: 'center',
      showOverflow: false,
      editRender: {
        name: 'VxeNumberInput',
        props: {
          type: 'number',
          precision: 2,
        },
      },
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
      field: 'startupStatus',
      title: '启动状态\nStarting status',
      align: 'center',
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

// 数据收集器
const collector = {
  id: 'startupPerformanceTest',
  name: 'StartupPerformanceTest',
  component: 'StartupPerformanceTest',
  type: 'startPerformance',
  collect: () => {
    const subList = GridApi.grid.getTableData().fullData.map((item) => ({
      ...item,
    }));
    console.log('subList', subList, conclusion.value);
    const StartupPerformanceTestData = {
      ratedIdleSpeed: Number(targetSpeed.value) || 0,
      startSuccessCriteria: frequency.value || '',
      autoStartExperimentResult: autoStartTest.value || '',
      autoShutdownExperimentResult: autoStopTest.value || '',
      threeStartFailureResult: threeFailures.value || '',
      emergencyShutdownResult: emergencyStop.value || '',
      conclusion: conclusion.value || '',
      flywheelTeeth: Number(flywheelTeeth.value) || 0,
      subList: subList,
    };
    console.log('StartupPerformanceTestData', StartupPerformanceTestData);
    return StartupPerformanceTestData;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store
    experimentStore.updateStartPerformance(data);
  },
};

// 生命周期钩子
onMounted(() => {
  // 初始从 store 同步数据
  const { startPerformance } = experimentStore.state?.currentExperiment || {};
  if (startPerformance) {
    // 将 Proxy 对象转换为普通数据对象后提交
    handleStartupPerformanceData({
      startPerformance: JSON.parse(JSON.stringify(startPerformance)),
    });
  }

  // 注册数据收集器
  registerCollector(collector);

  // 注册 WebSocket 监听器 - 监听启动性能数据更新
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleStartupPerformanceData,
  );
});

onUnmounted(() => {
  unregisterCollector('startupPerformanceTest');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleStartupPerformanceData,
  );
});
// WebSocket 监听器函数 - 处理启动性能数据更新
const handleStartupPerformanceData = (experimentData: any) => {
  // 设置标志位，避免触发循环更新

  isUpdatingFromStore.value = true;
  const data = experimentData?.startPerformance || {};

  // 更新输入字段
  targetSpeed.value = data?.ratedIdleSpeed ?? '';
  frequency.value = data?.startSuccessCriteria ?? '';
  autoStartTest.value = data?.autoStartExperimentResult ?? '';
  autoStopTest.value = data?.autoShutdownExperimentResult ?? '';
  threeFailures.value = data?.threeStartFailureResult ?? '';
  emergencyStop.value = data?.emergencyShutdownResult ?? '';
  conclusion.value = data?.conclusion ?? '';
  flywheelTeeth.value = data?.flywheelTeeth ?? '';

  // 更新表格数据（保留第7行“要求”标签）
  const list =
    Array.isArray(data?.subList) && data.subList.length > 0
      ? data.subList
      : tableList;

  tableData.value = list;

  setTimeout(() => {
    GridApi.grid.loadData(tableData.value);
    isUpdatingFromStore.value = false;
  });
};
</script>

<style scoped></style>
