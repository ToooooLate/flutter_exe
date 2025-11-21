<template>
  <div class="integrated-check-form">
    <!-- 操作按钮区域 -->
    <div class="mb-2 gap-2">
      <p class="text-lg font-bold">第{{ experimentIndex }}次数据测定实验</p>
      <Button type="primary" :disabled="!isEditable" @click="handleEditProject"> 编辑项目 </Button>
    </div>

    <!-- 表格区域 -->
    <Grid>
      <template #action="{ row }">
        <Button type="link" size="small" :disabled="!isEditable" @click="handleMeasure(row)">
          测定
        </Button>
        <Button
          type="link"
          size="small"
          :disabled="!isEditable"
          @click="handleMeasurehandleVoltageModulation(row)"
        >
          电压调制
        </Button>
      </template>
    </Grid>

    <!-- 项目控制弹窗 -->
    <ProjectControlModal title="编辑项目" :width="600">
      <div class="p-4">
        <div class="mb-4">
          <h4 class="mb-2">选择要显示的项目：</h4>
          <CheckboxGroup v-model:value="selectedRows">
            <div class="grid grid-cols-2 gap-2">
              <Checkbox
                v-for="opt in checkboxOptions"
                :key="opt.value"
                :value="opt.value"
                class="w-full"
              >
                <span class="block truncate">{{ opt.label }}</span>
              </Checkbox>
            </div>
          </CheckboxGroup>
        </div>
      </div>
    </ProjectControlModal>

    <!-- 倒计时弹窗 -->
    <CountdownModal
      ref="countdownModalRef"
      :countdown-seconds="60"
      title="测定进行中"
      message="测定正在进行中，请耐心等待..."
      :show-return-button="true"
      @countdown-end="handleCountdownEnd"
      @return-static="handleReturnStatic"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { Button, CheckboxGroup, Checkbox, message } from 'ant-design-vue';
import { initialTableData, createGridOptions } from './integratedCheckConfig';
import type { IntegratedCheckItem } from '#/store';
import { useVbenModal } from '@vben/common-ui';
import type { VxeGridProps } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  integratedCheckApi,
  sendVoltageModulationCommandApi,
  sendDcuDeviceMonitoringCommandApi,
} from '#/api';
import { useExperimentStore } from '#/store/experiment';
import { CountdownModal } from '../modal';
import { useDataCollector } from '#/composables/useDataCollector';
import { canEditTable } from '#/composables/useExperimentPermissions';

// 使用实验store
const experimentStore = useExperimentStore();

const { executeSyncQueue } = useDataCollector();

// Props 定义
interface Props {
  experimentIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  experimentIndex: 1,
});

// 统一编辑权限开关
const isEditable = computed(() => canEditTable());

// 本地数据 - 为每个实例创建独立的数据副本
const localData = ref<IntegratedCheckItem[]>(
  JSON.parse(JSON.stringify(initialTableData)),
);

// 创建静态的 Grid 配置，避免响应式循环
const staticGridOptions = createGridOptions([]);

// 创建 Grid 实例 - 使用静态配置
const [Grid, GridApi] = useVbenVxeGrid({
  gridOptions: {
    ...staticGridOptions,
    data: localData.value, // 初始数据
  },
});

// 项目控制弹窗
const selectedRows = ref<string[]>([]);

// 构建 checkbox 选项
const checkboxOptions = computed(() => {
  return localData.value.map((item) => ({
    label: `${item.serialNumber}. 负载${item.loadPercent} - ${item.timeMin}`,
    value: item.id,
  }));
});

// 倒计时弹窗相关状态
const countdownModalRef = ref();

let commandParams = {};

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

// 测定按钮处理函数
const handleMeasure = async (row: IntegratedCheckItem) => {
  await updateAllData();
  if (!experimentStore.state.currentExperiment?.benchPosition) {
    message.error('实验台位为空');
    return;
  }
  // 调用集成检测 API
  commandParams = {
    experimentId: experimentStore.state.currentExperiment?.id || '',
    testCount: props.experimentIndex,
    serialNumber: row.serialNumber,
    loadPercent: row.loadPercent,
    timeMin: row.timeMin,
  };
  //终止实时数据推送
  sendDcuDeviceMonitoringCommand(0);
  integratedCheckApi({
    ...commandParams,
    experimentStatus: true,
  }).then((res) => {
    res ? message.success('测定指令已发送') : message.error('测定指令发送失败');
  });
};

const sendDcuDeviceMonitoringCommand = async (state: 0 | 1) => {
  const experimentId = experimentStore.state.currentExperiment?.id || '';
  if (!experimentId) {
    message.error('实验ID为空');
    return;
  }
  const res = await sendDcuDeviceMonitoringCommandApi({
    experimentId,
    state,
  });
  if (res) {
    message.success('实时数据指令发送成功');
  } else {
    message.error('实时数据指令发送失败');
  }
};

const handleMeasurehandleVoltageModulation = (row: IntegratedCheckItem) => {
  // 调用电压调制 API
  commandParams = {
    experimentId: experimentStore.state.currentExperiment?.id || '',
    serialNumber: row.serialNumber,
  };
  sendVoltageModulationCommandApi({
    ...commandParams,
  }).then((res) => {
    res
      ? message.success('电压调制指令已发送')
      : message.error('电压调制指令发送失败');
  });
};

// 倒计时结束处理函数
const handleCountdownEnd = () => {
  message.info('倒计时结束，测定完成');
  //终止实时数据推送
  sendDcuDeviceMonitoringCommand(1);
  integratedCheckApi({
    ...commandParams,
    experimentStatus: false,
  }).then((res) => {
    res
      ? message.success('返回静态指令已发送')
      : message.error('返回静态指令发送失败');
  });
};

// 返回静态处理函数
const handleReturnStatic = async () => {
  // 这里可以添加返回静态的API调用
  message.info('正在返回静态状态...');
};

// 编辑项目按钮处理函数
const handleEditProject = () => {
  modalApi.open();
};

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
  selectedRows.value = localData.value
    .filter((item) => item.visible)
    .map((item) => item.id);
}

// 确认项目控制
function handleConfirmProjectControl() {
  // 深拷贝选中状态，确保每个实例独立
  const currentSelectedRows = [...selectedRows.value];
  localData.value.forEach((item) => {
    item.visible = currentSelectedRows.includes(item.id);
  });
  // 使用 reloadData 方法更新表格数据，将 Proxy 对象转换为普通对象
  const filteredData = localData.value
    .filter((item) => item.visible)
    .map((item) => ({ ...item })); // 使用展开运算符将 Proxy 转换为普通对象
  console.log('filteredData:', filteredData);
  setTimeout(() => {
    GridApi.grid?.loadData?.(filteredData as any);
  });
}

// 对外暴露的函数
const getTableData = () => {
  return {
    fullData: GridApi.grid.getTableData().fullData || [],
    localData: localData.value || [],
  };
};

const updateTableData = (
  data: IntegratedCheckItem[],
  testCount: number,
  type: string,
  experimentStatus: boolean,
) => {
  if (
    type === 'INTEGRATED_EXPERIMENT' &&
    experimentStatus &&
    testCount === props.experimentIndex
  ) {
    countdownModalRef.value?.open();
  } else {
    // 深拷贝数据，确保每个实例的数据独立
    localData.value = JSON.parse(JSON.stringify(data));
    initSelectedRows();
    handleConfirmProjectControl();
  }
};

// 暴露给父组件
defineExpose({
  getTableData,
  updateTableData,
});
</script>

<style scoped>
.integrated-check-form {
  padding: 16px;
}
</style>
