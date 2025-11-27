<template>
  <div class="steady-speed-characteristic w-full max-w-full overflow-hidden">
    <div class="space-y-6">
      <!-- 使用工厂模式生成的表格配置进行渲染 -->
      <div
        v-for="tableConfig in tableConfigs"
        :key="tableConfig.key"
        class="w-full max-w-full"
      >
        <h3 class="mb-4 text-lg font-medium text-gray-800">
          {{ tableConfig.title }}
        </h3>
        <!-- 表格容器：添加水平滚动和响应式处理 -->
        <div
          class="w-full overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <div class="min-w-full">
            <component :is="tableConfig.component" />
          </div>
        </div>
      </div>
    </div>

    <!-- 稳态调速特性表格 -->
    <div class="mb-6">
      <div
        class="w-full overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
      >
        <div class="min-w-full">
          <SteadySpeedGrid />
        </div>
      </div>
    </div>

    <!-- 要求部分 -->
    <div class="mb-4">
      <div class="min-h-[40px] rounded border border-gray-300 bg-gray-50 p-3">
        <div class="text-sm text-gray-700">{{ requirement }}</div>
      </div>
    </div>

    <!-- 结论部分 -->
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium">
        {{ t('experiment.current.common.conclusionLabel') }}
      </label>
      <div class="min-h-[60px] rounded border border-gray-300 p-3">
        <textarea
          v-model="conclusion"
          :disabled="!isEditable.value"
          class="h-full w-full resize-none border-0 outline-none"
          :placeholder="t('experiment.current.placeholders.inputConclusion')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from '@vben/locales';
import { useExperimentStore } from '#/store/experiment';
import { useUserRole } from '#/composables/useUserRole';
import { useDataCollector } from '#/composables/useDataCollector';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import {
  createSteadySpeedGridOptions,
  createSteadySpeedListData,
  createSteadySpeedMainGridOptions,
  createTableConfigs,
} from './steadySpeedConfig';
import type { TableConfig } from './steadySpeedConfig';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { canEditTable } from '#/composables/useExperimentPermissions';
const { t } = useI18n();

// 本组件内定义数据类型，避免依赖不存在的 store 导出类型
type SteadySpeedItem = Record<string, any>;
type SteadySpeedSubItem = Record<string, any>;
// 兼容不存在的综合试验消息类型，按需注册
const INTEGRATED_EXPERIMENT = (WebSocketMessageType as any)
  .INTEGRATED_EXPERIMENT;

// 在组件内部创建三个 ref 变量来管理表格数据
const steadySpeedSub1List = ref<SteadySpeedSubItem[]>([]);
const steadySpeedSub2List = ref<SteadySpeedSubItem[]>([]);
const steadySpeedSub3List = ref<SteadySpeedSubItem[]>([]);
// 保留完整数据（包含 visible=false 的行），用于提交
const fullSteadySpeedSub1List = ref<SteadySpeedSubItem[]>([]);
const fullSteadySpeedSub2List = ref<SteadySpeedSubItem[]>([]);
const fullSteadySpeedSub3List = ref<SteadySpeedSubItem[]>([]);

// 稳态调速特性表格数据和配置
const steadySpeedList = ref<SteadySpeedItem[]>(createSteadySpeedListData(t));
const steadySpeedGridOptions = createSteadySpeedMainGridOptions(
  steadySpeedList.value,
  t,
);
const [SteadySpeedGrid, SteadySpeedGridApi] = useVbenVxeGrid({
  gridOptions: steadySpeedGridOptions,
});

// 要求和结论
const requirement = ref(
  t('experiment.current.comprehensive.steady.speedCharacteristic.requirement'),
);
const conclusion = ref('');

const isEditable = computed(() => canEditTable());

// 使用工厂模式创建表格配置
const tableConfigs = computed(() =>
  createTableConfigs([
    {
      key: 'sub1',
      title: t(
        'experiment.current.comprehensive.steady.speedCharacteristic.subTable1Title',
      ),
      dataRef: steadySpeedSub1List,
      t,
      alwaysShow: true, // 第一个表格始终显示
    },
    {
      key: 'sub2',
      title: t(
        'experiment.current.comprehensive.steady.speedCharacteristic.subTable2Title',
      ),
      dataRef: steadySpeedSub2List,
      t,
    },
    {
      key: 'sub3',
      title: t(
        'experiment.current.comprehensive.steady.speedCharacteristic.subTable3Title',
      ),
      dataRef: steadySpeedSub3List,
      t,
    },
  ]),
);

// Store 实例和数据收集器
const experimentStore = useExperimentStore();
const { registerCollector, unregisterCollector } = useDataCollector();
const webSocketStore = useWebSocketStore();

// WebSocket 更新标志位，避免循环更新
const isUpdatingFromWebSocket = ref(false);

// WebSocket 监听器函数
const handleSteadySpeedData = async (data: any) => {
  if (isUpdatingFromWebSocket.value) return;
  // 空值与类型保护
  if (!data || typeof data !== 'object') return;

  try {
    isUpdatingFromWebSocket.value = true;

    if (Array.isArray(data?.steadySpeedList)) {
      steadySpeedList.value = data.steadySpeedList.slice(
        0,
        -1,
      ) as SteadySpeedItem[];
      conclusion.value = data.steadySpeedList.at(-1)?.conclusion || '';
    }
    if (Array.isArray(data?.steadySpeedSub1List)) {
      // 赋值完整数据
      fullSteadySpeedSub1List.value =
        data.steadySpeedSub1List as SteadySpeedSubItem[];
      // 渲染时仅显示 visible!==false 的行（未设置 visible 视为可见）
      steadySpeedSub1List.value = fullSteadySpeedSub1List.value.filter(
        (row: any) => row?.visible !== false,
      );
    }
    if (Array.isArray(data?.steadySpeedSub2List)) {
      fullSteadySpeedSub2List.value =
        data.steadySpeedSub2List as SteadySpeedSubItem[];
      steadySpeedSub2List.value = fullSteadySpeedSub2List.value.filter(
        (row: any) => row?.visible !== false,
      );
    }
    if (Array.isArray(data?.steadySpeedSub3List)) {
      fullSteadySpeedSub3List.value =
        data.steadySpeedSub3List as SteadySpeedSubItem[];
      steadySpeedSub3List.value = fullSteadySpeedSub3List.value.filter(
        (row: any) => row?.visible !== false,
      );
    }

    setTimeout(() => {
      SteadySpeedGridApi.grid?.loadData?.(steadySpeedList.value as any);
      const configs = tableConfigs.value;
      configs
        .find((c) => c.key === 'sub1')
        ?.GridApi.grid?.loadData?.(steadySpeedSub1List.value as any);
      configs
        .find((c) => c.key === 'sub2')
        ?.GridApi.grid?.loadData?.(steadySpeedSub2List.value as any);
      configs
        .find((c) => c.key === 'sub3')
        ?.GridApi.grid?.loadData?.(steadySpeedSub3List.value as any);
    }, 0);
  } catch (error) {
    console.error('处理稳态调速特性 WebSocket 数据时出错:', error);
  } finally {
    isUpdatingFromWebSocket.value = false;
  }
};

// 数据收集器
const collector = {
  id: 'steadySpeedCharacteristic',
  name: 'SteadySpeedCharacteristic',
  component: 'SteadySpeedCharacteristic',
  type: 'steadySpeedCharacteristic',
  collect: () => {
    // 收集主表格数据
    const mainGridData =
      SteadySpeedGridApi.grid?.getTableData()?.fullData.map((item) => ({
        ...item,
      })) || [];

    // 通过 GridApi 收集子表格数据
    const configs = tableConfigs.value;
    const sub1Edited =
      configs
        .find((c) => c.key === 'sub1')
        ?.GridApi.grid?.getTableData()
        ?.fullData.map((item) => ({
          ...item,
        })) || [];
    const sub2Edited =
      configs
        .find((c) => c.key === 'sub2')
        ?.GridApi.grid?.getTableData()
        ?.fullData.map((item) => ({
          ...item,
        })) || [];
    const sub3Edited =
      configs
        .find((c) => c.key === 'sub3')
        ?.GridApi.grid?.getTableData()
        ?.fullData.map((item) => ({
          ...item,
        })) || [];

    // 将可见表中的编辑合并回完整数据（按 serialNumber 合并）
    const mergeBySerialNumber = (fullList: any[], editedList: any[]) => {
      const editedMap = new Map(
        editedList
          .filter((i) => i && i.serialNumber != null)
          .map((i) => [i.serialNumber, i]),
      );
      return fullList.map((row) => {
        const sn = (row as any)?.serialNumber;
        if (sn != null && editedMap.has(sn)) {
          return { ...row, ...editedMap.get(sn) };
        }
        return row;
      });
    };

    const sub1Data = mergeBySerialNumber(
      fullSteadySpeedSub1List.value || [],
      sub1Edited,
    );
    const sub2Data = mergeBySerialNumber(
      fullSteadySpeedSub2List.value || [],
      sub2Edited,
    );
    const sub3Data = mergeBySerialNumber(
      fullSteadySpeedSub3List.value || [],
      sub3Edited,
    );

    // 收集结论数据
    const conclusionData = conclusion.value || '';
    const steadySpeedList = mainGridData.concat({
      conclusion: conclusionData,
      requirement: requirement.value || '',
    });

    return {
      steadySpeedList,
      steadySpeedSub1List: sub1Data,
      steadySpeedSub2List: sub2Data,
      steadySpeedSub3List: sub3Data,
    };
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store（使用可选调用，避免未实现方法导致报错）
    const storeAny = experimentStore as any;
    storeAny.updateSteadySpeedCharacteristic?.(data);
    storeAny.updateExperimentSettings?.({ steadySpeedCharacteristic: data });
  },
};

// 生命周期
onMounted(() => {
  // 从store中加载现有数据
  const currentExperiment = experimentStore.state.currentExperiment;
  handleSteadySpeedData(JSON.parse(JSON.stringify(currentExperiment)));

  registerCollector(collector);
  // 注册 WebSocket 监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleSteadySpeedData,
  );

  webSocketStore.registerMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleSteadySpeedData,
  );
});

onUnmounted(() => {
  unregisterCollector('steadySpeedCharacteristic');
  // 注销 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleSteadySpeedData,
  );
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleSteadySpeedData,
  );
});
</script>
