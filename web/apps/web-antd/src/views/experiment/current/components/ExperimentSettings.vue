<template>
  <Card class="mb-4">
    <template #title>
      <div class="flex items-center justify-between">
        <span>实验设置</span>
        <Button
          type="text"
          size="small"
          @click="toggleExpanded"
          class="flex items-center"
        >
          <span class="text-sm">{{ expanded ? '收起' : '展开' }}</span>
        </Button>
      </div>
    </template>

    <div v-show="expanded" class="transition-all duration-300">
      <VbenForm />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { Card, Button } from 'ant-design-vue';
import { message } from 'ant-design-vue';
// @ts-ignore 依赖的类型由本地 src/env.d.ts 提供
import { useVbenForm } from '@vben/common-ui';
// @ts-ignore 依赖的类型由本地 src/env.d.ts 提供
import type { VbenFormSchema } from '@vben/common-ui';
import { useExperimentStore } from '#/store/experiment';
import { useDataCollector } from '#/composables/useDataCollector';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { getDcuDeviceListApi, enableDcuDeviceApi } from '#/api';
import { canEditTable } from '#/composables/useExperimentPermissions';

// 定义 ExperimentData 类型的部分字段
interface ExperimentData {
  testPerson?: string;
  inspector?: string;
  reviewer?: string;
  benchPosition?: string;
  communicationPort?: string;
  generatorBaudRate?: string;
  customer?: string;
  projectName?: string;
  unitModel?: string;
  engineModel?: string;
  generatorModel?: string;
  ratedVoltage?: string;
  shipyard?: string;
  shipNumber?: string;
  unitSerial?: string;
  engineSerial?: string;
  generatorSerial?: string;
  ratedFrequency?: string;
  voltageRatio?: string;
  currentRatio?: string;
  powerFactor?: string;
  noLoadFrequency?: string;
  fullLoadFrequency?: string;
  engineBaudRate?: string;
}

const props = defineProps<{
  modelValue?: Record<string, any>;
  expanded?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void;
  (e: 'update:expanded', value: boolean): void;
}>();

const experimentStore = useExperimentStore();
const webSocketStore = useWebSocketStore();
const { registerCollector, unregisterCollector } = useDataCollector();

// 标志位，用于避免循环更新
const isUpdatingFromStore = ref(false);
const expanded = computed(() => props.expanded ?? false);
// 是否可编辑：权限+实验状态
const isEditable = computed(() => canEditTable());

const toggleExpanded = () => {
  emit('update:expanded', !expanded.value);
};

const formSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入测试人员',
    },
    fieldName: 'testPerson',
    label: '测试人员',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入检验人员',
    },
    fieldName: 'inspector',
    label: '检验人员',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入审核人员',
    },
    fieldName: 'reviewer',
    label: '审核人员',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Divider',
    componentProps: {
      orientation: 'left',
    },
    fieldName: 'divider1',
    label: '连接参数',
    formItemClass: 'col-span-5',
    layout: 'vertical',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择相位',
      options: [
        { label: '单相', value: 'singlePhase' },
        { label: '三相', value: 'threePhase' },
      ],
    },
    fieldName: 'phaseType',
    label: '相位类型',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择台位',
      options: [
        { label: '台位1', value: 1 },
        { label: '台位2', value: 2 },
        { label: '台位3', value: 3 },
        { label: '台位4', value: 4 },
        { label: '台位5', value: 5 },
        { label: '台位6', value: 6 },
      ],
    },
    fieldName: 'benchPosition',
    label: '台位选择',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择发电机通讯端口',
      options: [
        { label: 'COM1', value: 1 },
        { label: 'COM2', value: 2 },
        { label: 'COM3', value: 3 },
        { label: 'COM4', value: 4 },
        { label: 'COM5', value: 5 },
        { label: 'COM6', value: 6 },
      ],
    },
    fieldName: 'generatorComPort',
    label: '发电机通讯端口',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择发动机通讯端口',
      options: [
        { label: 'COM1', value: 1 },
        { label: 'COM2', value: 2 },
        { label: 'COM3', value: 3 },
        { label: 'COM4', value: 4 },
        { label: 'COM5', value: 5 },
        { label: 'COM6', value: 6 },
      ],
    },
    fieldName: 'engineComPort',
    label: '发动机通讯端口',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入波特率',
      precision: 0,
    },
    fieldName: 'generatorBaudRate',
    label: '发电机波特率',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入发动机信号波特率',
      precision: 0,
    },
    fieldName: 'engineBaudRate',
    label: '发动机波特率',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择发电机DCU配置',
      options: [],
    },
    fieldName: 'DCUSetting',
    label: 'DCU配置',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Divider',
    componentProps: {
      orientation: 'left',
    },
    fieldName: 'divider2',
    label: '设备参数',
    formItemClass: 'col-span-5',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入客户',
    },
    fieldName: 'customer',
    label: '客户',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入项目名称',
    },
    fieldName: 'projectName',
    label: '项目名称',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入船厂',
    },
    fieldName: 'shipyard',
    label: '船厂',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入船号',
    },
    fieldName: 'shipNumber',
    label: '船号',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入机组型号',
    },
    fieldName: 'unitModel',
    label: '机组型号',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入机组编号',
    },
    fieldName: 'unitSerial',
    label: '机组编号',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入发动机型号',
    },
    fieldName: 'engineModel',
    label: '发动机型号',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入发电机型号',
    },
    fieldName: 'generatorModel',
    label: '发电机型号',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入发动机编号',
    },
    fieldName: 'engineSerial',
    label: '发动机编号',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入发电机编号',
    },
    fieldName: 'generatorSerial',
    label: '发电机编号',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入额定频率',
    },
    fieldName: 'ratedFrequency',
    label: '额定频率 (Hz)',
    formItemClass: 'col-span-1',
  },
  // {
  //   component: 'InputNumber',
  //   componentProps: {
  //     placeholder: '请输入电压倍率',
  //   },
  //   fieldName: 'voltageRatio',
  //   label: '电压倍率',
  //   formItemClass: 'col-span-1',
  // },
  // {
  //   component: 'InputNumber',
  //   componentProps: {
  //     placeholder: '请输入电流倍率',
  //   },
  //   fieldName: 'currentRatio',
  //   label: '电流倍率',
  //   formItemClass: 'col-span-1',
  // },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入功率因数',
    },
    fieldName: 'powerFactor',
    label: '功率因数',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入空载频率',
    },
    fieldName: 'noLoadFrequency',
    label: '空载频率 (Hz)',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入满载频率',
    },
    fieldName: 'fullLoadFrequency',
    label: '满载频率 (Hz)',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入视在功率',
    },
    fieldName: 'apparentPower',
    label: '视在功率 (kW)',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入额定功率',
    },
    fieldName: 'ratedPower',
    label: '额定功率 (kW)',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入额定电流',
    },
    fieldName: 'ratedCurrent',
    label: '额定电流 (A)',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入额定电压',
    },
    fieldName: 'ratedVoltage',
    label: '额定电压 (V)',
    formItemClass: 'col-span-1',
  },
];

const [VbenForm, formApi] = useVbenForm({
  schema: formSchema,
  // 设置为一排四个输入框的布局，响应式设计
  wrapperClass:
    'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4',
  layout: 'horizontal',
  showDefaultActions: false,
  // 所有表单项共用配置，确保组件占满宽度
  commonConfig: {
    componentProps: {
      class: 'w-full',
      disabled: !isEditable.value,
    },
  },
});

// 监听 isEditable 变化，动态更新所有字段的 disabled 属性（保证切换后实时生效）
watch(
  isEditable,
  (val) => {
    // 延后一帧，确保表单已初始化
    nextTick(() => {
      try {
        const updates = (formSchema || [])
          .filter((s) => !!s.fieldName && s.component !== 'Divider')
          .map((s) => ({
            fieldName: s.fieldName,
            componentProps: {
              ...(s.componentProps || {}),
              disabled: !val,
            },
          }));
        // 批量更新 schema，达到动态禁用/启用效果
        formApi?.updateSchema?.(updates);
      } catch {}
    });
  },
  { immediate: true },
);

// DCU 选项（后端加载）
const dcuOptions = ref<{ label: string; value: string; status?: number }[]>([]);

function mapStatusLabel(status?: number) {
  return status === 1 ? '启用中' : '未启用';
}

async function loadDcuOptions() {
  const res = await getDcuDeviceListApi({ pageNo: 1, pageSize: 999 });
  const records: any[] = (res as any)?.records ?? [];
  dcuOptions.value = records.map((item) => {
    const name = item.name ?? item.nameCh ?? item.nameEn ?? item.id;
    const statusText = mapStatusLabel(item.status);
    return {
      label: `${name}（${statusText}）`,
      value: item.id,
      status: item.status ?? 0,
    };
  });
  // 更新表单 schema 的选项、默认值和变更事件
  formApi?.updateSchema?.([
    {
      fieldName: 'DCUSetting',
      componentProps: {
        options: dcuOptions.value,
        onChange: onSelectDcu,
      },
    },
  ]);
  // 计算唯一启用中的设备
  const active = dcuOptions.value.find((opt) => opt.status === 1);
  // 再次写入字段值，确保显示选中标签
  if (active) {
    await nextTick();
    await formApi?.setFieldValue?.('DCUSetting', active.value, false);
  }
}

async function onSelectDcu(value: string) {
  try {
    const res = await enableDcuDeviceApi({
      id: value,
      experimentId: experimentStore.state.currentExperiment?.id || '',
    });
    if (res) {
      message.success('DCU启用成功');
      // 重新加载 DCU 列表以刷新“启用中/未启用”状态标签
      await loadDcuOptions();
    } else {
      message.error('DCU启用失败');
    }
  } catch (error) {
    message.error('DCU启用失败');
  }
}

// WebSocket 监听器函数 - 处理实验设置数据更新
const handleExperimentSettingsData = (data: Partial<ExperimentData>) => {
  console.log('收到实验设置数据更新:', data);

  if (!formApi) {
    return;
  }

  // 设置标志位，避免触发循环更新
  isUpdatingFromStore.value = true;

  // 更新表单数据
  formApi.setValues(data);

  // 重置标志位
  nextTick(() => {
    isUpdatingFromStore.value = false;
  });
};

// 数据收集器
const collector = {
  id: 'experimentSettings',
  name: 'ExperimentSettings',
  component: 'ExperimentSettings',
  type: 'experimentSettings',
  collect: async () => {
    if (!formApi) {
      return {};
    }
    const formValues = await formApi.getValues();

    // 过滤掉值为 undefined 的数据
    const filteredValues = Object.fromEntries(
      Object.entries(formValues).filter(([key, value]) => value !== undefined),
    );

    return filteredValues;
  },
  hasChanges() {
    // 检查是否有数据变更
    return true;
  },
  syncToStore(data: any) {
    // 同步数据到store
    experimentStore.updateExperimentSettings(data);
  },
};

// 生命周期钩子
onMounted(() => {
  // 注册数据收集器
  registerCollector(collector);

  // 加载 DCU 下拉选项
  loadDcuOptions();

  // 注册 WebSocket 监听器 - 监听实验数据更新
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleExperimentSettingsData,
  );
});

onUnmounted(() => {
  // 取消注册数据收集器
  unregisterCollector('experimentSettings');

  // 取消注册 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleExperimentSettingsData,
  );
});
</script>

<style scoped>
.settings-collapse-enter-active,
.settings-collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.settings-collapse-enter-from,
.settings-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.settings-collapse-enter-to,
.settings-collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
