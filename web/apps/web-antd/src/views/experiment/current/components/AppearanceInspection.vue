<template>
  <div class="appearance-inspection-container min-h-[400px] p-4">
    <div class="mb-4">
      <h3 class="mb-1 text-lg font-semibold">{{ t('experiment.current.appearance.titleEn') }}</h3>
      <p class="text-gray-600">{{ t('experiment.current.appearance.title') }}</p>
    </div>

    <div class="vp-raw w-full">
      <Grid />
    </div>

    <!-- 结论部分 -->
    <div class="mt-6">
      <div class="mb-2">
        <label class="text-sm font-medium">{{ t('experiment.current.appearance.conclusionLabel') }}</label>
      </div>
      <div class="min-h-[60px] rounded border border-gray-300 p-3">
        <textarea
          v-model="conclusionValue"
          :readonly="!isEditable"
          class="h-full w-full resize-none border-none outline-none"
          :placeholder="t('experiment.current.appearance.placeholderConclusion')"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useExperimentStore } from '#/store/experiment';
import { useUserRole } from '#/composables/useUserRole';
import { useDataCollector } from '#/composables/useDataCollector';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { useI18n } from '@vben/locales';

// 类型定义
interface RowType {
  id: string;
  serialNumber: number;
  checkContent: string;
  checkRequirement: string;
  checkStatus: string;
  remarks: string;
}

// Store
const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { t } = useI18n();

// 编辑权限（基于权限码与实验状态）
const isEditable = computed(() => canEditTable());

// 标志位，用于避免循环更新
const isUpdatingFromStore = ref(false);

const conclusionValue = ref('');

// 数据收集器
const { registerCollector, unregisterCollector } = useDataCollector();
// 表格数据的计算属性
const tableData = ref<RowType[]>([]);

const gridOptions = () => {
  return {
    columns: [
      { field: 'serialNumber', title: t('experiment.current.columns.serialNumber'), width: 60, align: 'center' },
      {
        field: 'checkContent',
        title: t('experiment.current.columns.checkContent'),
        minWidth: 280,
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
        field: 'checkRequirement',
        title: t('experiment.current.columns.checkRequirement'),
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
        editRender: {
          name: 'input',
        },
        field: 'checkStatus',
        title: t('experiment.current.columns.checkStatus'),
        minWidth: 150,
        showOverflow: false,
      },
      {
        editRender: {
          name: 'input',
        },
        field: 'remarks',
        title: t('experiment.current.columns.remarks'),
        minWidth: 120,
        showOverflow: false,
      },
    ],
    data: tableData.value,
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
};

const [Grid, GridApi] = useVbenVxeGrid({ gridOptions: gridOptions() });

// WebSocket 监听器函数 - 处理外观检查数据更新
const handleAppearanceData = (data: any) => {
  // 设置标志位，避免触发循环更新
  isUpdatingFromStore.value = true;

  // 更新表格数据
  tableData.value = data.appearanceList.slice(0, -1);

  // 更新结论数据
  conclusionValue.value = data.appearanceList.at(-1)?.conclusion || '';
  console.log('conclusionValue.value:', data);

  setTimeout(() => {
    GridApi.grid.loadData(tableData.value);
  });

  // 重置标志位
  nextTick(() => {
    isUpdatingFromStore.value = false;
  });
};

// 数据收集器
onMounted(() => {
  const { appearanceList = [] } =
    experimentStore.state?.currentExperiment || {};
  if (appearanceList.length > 0) {
    // 将 Proxy 对象转换为普通数据对象后提交
    handleAppearanceData({
      appearanceList: JSON.parse(JSON.stringify(appearanceList)),
    });
  }

  registerCollector({
    id: 'appearanceInspection',
    name: 'appearanceInspection',
    component: 'AppearanceInspection',
    type: 'appearance',
    collect: () => {
      const arr = GridApi.grid
        .getTableData()
        .fullData.map((item) => ({
          ...item,
        }))
        .concat({
          conclusion: conclusionValue.value,
        });
      console.log('收集到的外观检查数据:', arr, GridApi.grid.getTableData());
      return arr;
    },
    hasChanges: () => {
      // 简单返回 true，表示总是有数据需要收集
      return true;
    },
    syncToStore: async (data) => {
      // 如果传入了数据，使用传入的数据；否则使用当前组件的数据
      experimentStore.updateAppearanceList(data);
    },
  });

  // 注册 WebSocket 监听器 - 监听外观检查数据更新
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleAppearanceData,
  );
});

// 组件销毁时注销收集器
onUnmounted(() => {
  unregisterCollector('appearanceInspection');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleAppearanceData,
  );
});
</script>

<style scoped></style>
