<template>
  <div class="steady-range-check-container min-h-[400px] p-4">
    <div class="mb-4">
      <h3 class="mb-1 text-lg font-semibold">
        机组稳态调速率可调范围和空载电压检查
      </h3>
      <p class="text-gray-600">
        Steady State Speed Regulation Range and No-load Voltage Check
      </p>
    </div>

    <div class="vp-raw w-full">
      <Descriptions title="稳态调速参数" bordered :column="3">
        <!-- 空载电压部分 -->
        <DescriptionsItem label="空载电压检查" :span="3">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium"
                >额定电压（V）</label
              >
              <Input
                v-model:value="formData.ratedVoltage"
                placeholder="请输入标准电压"
                :disabled="!isEditable"
                class="w-full"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium"
                >空载最大电压 +5% Volt（V）</label
              >
              <Input
                v-model:value="formData.noLoadMaxVoltage"
                placeholder="请输入+5%电压"
                :disabled="!isEditable"
                class="w-full"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium"
                >空载最小电压 -5% Volt（V）</label
              >
              <Input
                v-model:value="formData.noLoadMinVoltage"
                placeholder="请输入-5%电压"
                :disabled="!isEditable"
                class="w-full"
              />
            </div>
          </div>
        </DescriptionsItem>

        <!-- 最大调速率部分 -->
        <DescriptionsItem label="最大调速率" :span="3">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium"
                >0% 空载频率 (Hz)</label
              >
              <Input
                v-model:value="formData.maxSpeedRegulationNoLoadFreq"
                placeholder="请输入频率"
                :disabled="!isEditable"
                class="w-full"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium"
                >100% 满载频率 (Hz)</label
              >
              <Input
                v-model:value="formData.maxSpeedRegulationFullLoadFreq"
                placeholder="请输入频率"
                :disabled="!isEditable"
                class="w-full"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium"
                >稳态调速率 δ(%)</label
              >
              <Input
                v-model:value="formData.maxSteadyStateSpeedRegulation"
                placeholder="请输入调速率"
                :disabled="!isEditable"
                class="w-full"
              />
            </div>
          </div>
        </DescriptionsItem>

        <!-- 最小调速率部分 -->
        <DescriptionsItem label="最小调速率" :span="3">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium"
                >0% 空载频率 (Hz)</label
              >
              <Input
                v-model:value="formData.minSpeedRegulationNoLoadFreq"
                placeholder="请输入频率"
                :disabled="!isEditable"
                class="w-full"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium"
                >100% 满载频率 (Hz)</label
              >
              <Input
                v-model:value="formData.minSpeedRegulationFullLoadFreq"
                placeholder="请输入频率"
                :disabled="!isEditable"
                class="w-full"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium"
                >稳态调速率 δ(%)</label
              >
              <Input
                v-model:value="formData.minSteadyStateSpeedRegulation"
                placeholder="请输入调速率"
                :disabled="!isEditable"
                class="w-full"
              />
            </div>
          </div>
        </DescriptionsItem>
      </Descriptions>
    </div>

    <!-- 结论部分 -->
    <div class="mt-6">
      <label class="mb-2 block text-sm font-medium">结论/Conclusion:</label>
      <div class="min-h-[60px] rounded border border-gray-300 p-3">
        <textarea
          v-model="formData.conclusion"
          :readonly="!isEditable"
          class="h-full w-full resize-none border-0 outline-none"
          placeholder="请输入结论..."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useExperimentStore } from '#/store/experiment';
import { useUserRole } from '#/composables/useUserRole';
import { canEditTable } from '#/composables/useExperimentPermissions';
import { useDataCollector } from '#/composables/useDataCollector';
import { useWebSocketStore, WebSocketMessageType } from '#/store/websocket';
import { Input, Descriptions, DescriptionsItem } from 'ant-design-vue';

// 使用 stores
const experimentStore = useExperimentStore();
const { isAdmin } = useUserRole();
const isEditable = computed(() => canEditTable());
const webSocketStore = useWebSocketStore();

// WebSocket 更新标志位，避免循环更新
const isUpdatingFromWebSocket = ref(false);
const { registerCollector, unregisterCollector } = useDataCollector();

// 表单数据
const formData = ref({
  id: '',
  ratedVoltage: '',
  noLoadMaxVoltage: '',
  noLoadMinVoltage: '',
  maxSpeedRegulationNoLoadFreq: '',
  maxSpeedRegulationFullLoadFreq: '',
  maxSteadyStateSpeedRegulation: '',
  minSpeedRegulationNoLoadFreq: '',
  minSpeedRegulationFullLoadFreq: '',
  minSteadyStateSpeedRegulation: '',
  conclusion: '',
});

// 更新字段值
const updateField = (field: string, value: any) => {
  if (isEditable.value) {
    formData.value[field] = value;
  }
};

// 初始化数据
onMounted(() => {
  // 从store中加载现有数据
  const currentExperiment = experimentStore.state.currentExperiment;
  handleSteadyRangeData(JSON.parse(JSON.stringify(currentExperiment)));

  // 注册数据收集器
  registerDataCollector();
  // 注册 WebSocket 监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleSteadyRangeData,
  );

  // 注册综合试验数据监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleSteadyRangeData,
  );
});

onUnmounted(() => {
  // 组件销毁时注销数据收集器
  unregisterCollector('steady-range-check');
  // 注销 WebSocket 监听器
  webSocketStore.unregisterMessageListener(
    WebSocketMessageType.EXPERIMENT,
    handleSteadyRangeData,
  );

  // 注册综合试验数据监听器
  webSocketStore.registerMessageListener(
    WebSocketMessageType.INTEGRATED_EXPERIMENT,
    handleSteadyRangeData,
  );
});

// WebSocket 监听器函数
const handleSteadyRangeData = async (data: any) => {
  if (isUpdatingFromWebSocket.value) return;
  // 空值与类型保护，避免读取 null 属性
  if (!data || typeof data !== 'object') return;

  try {
    isUpdatingFromWebSocket.value = true;

    // 更新稳态调整数据
    if (data.steadyAdjustment) {
      const steadyData = data.steadyAdjustment;

      // 更新额定电压
      if (steadyData.ratedVoltage !== undefined) {
        formData.value.ratedVoltage = steadyData.ratedVoltage;
      }

      // 更新空载最大电压
      if (steadyData.noLoadMaxVoltage !== undefined) {
        formData.value.noLoadMaxVoltage = steadyData.noLoadMaxVoltage;
      }

      // 更新空载最小电压
      if (steadyData.noLoadMinVoltage !== undefined) {
        formData.value.noLoadMinVoltage = steadyData.noLoadMinVoltage;
      }

      // 更新最大调速率相关数据
      if (steadyData.maxSpeedRegulationNoLoadFreq !== undefined) {
        formData.value.maxSpeedRegulationNoLoadFreq =
          steadyData.maxSpeedRegulationNoLoadFreq;
      }
      if (steadyData.maxSpeedRegulationFullLoadFreq !== undefined) {
        formData.value.maxSpeedRegulationFullLoadFreq =
          steadyData.maxSpeedRegulationFullLoadFreq;
      }
      if (steadyData.maxSteadyStateSpeedRegulation !== undefined) {
        formData.value.maxSteadyStateSpeedRegulation =
          steadyData.maxSteadyStateSpeedRegulation;
      }

      // 更新最小调速率相关数据
      if (steadyData.minSpeedRegulationNoLoadFreq !== undefined) {
        formData.value.minSpeedRegulationNoLoadFreq =
          steadyData.minSpeedRegulationNoLoadFreq;
      }
      if (steadyData.minSpeedRegulationFullLoadFreq !== undefined) {
        formData.value.minSpeedRegulationFullLoadFreq =
          steadyData.minSpeedRegulationFullLoadFreq;
      }
      if (steadyData.minSteadyStateSpeedRegulation !== undefined) {
        formData.value.minSteadyStateSpeedRegulation =
          steadyData.minSteadyStateSpeedRegulation;
      }

      // 更新结论
      if (steadyData.conclusion !== undefined) {
        formData.value.conclusion = steadyData.conclusion;
      }
    }

    await nextTick();
  } catch (error) {
    console.error('处理稳态范围检查 WebSocket 数据时出错:', error);
  } finally {
    isUpdatingFromWebSocket.value = false;
  }
};

// 注册数据收集器
function registerDataCollector() {
  const collector = {
    id: 'steady-range-check',
    name: 'SteadyRangeCheck',
    component: 'SteadyRangeCheck',
    type: 'steadyAdjustment',
    hasChanges: () => {
      return true;
    },
    collect: () => {
      return {
        id: formData.value.id || '',
        ratedVoltage: String(formData.value.ratedVoltage || ''),
        noLoadMaxVoltage: String(formData.value.noLoadMaxVoltage || ''),
        noLoadMinVoltage: String(formData.value.noLoadMinVoltage || ''),
        maxSpeedRegulationNoLoadFreq: String(
          formData.value.maxSpeedRegulationNoLoadFreq || '',
        ),
        maxSpeedRegulationFullLoadFreq: String(
          formData.value.maxSpeedRegulationFullLoadFreq || '',
        ),
        maxSteadyStateSpeedRegulation: String(
          formData.value.maxSteadyStateSpeedRegulation || '',
        ),
        minSpeedRegulationNoLoadFreq: String(
          formData.value.minSpeedRegulationNoLoadFreq || '',
        ),
        minSpeedRegulationFullLoadFreq: String(
          formData.value.minSpeedRegulationFullLoadFreq || '',
        ),
        minSteadyStateSpeedRegulation: String(
          formData.value.minSteadyStateSpeedRegulation || '',
        ),
        conclusion: formData.value.conclusion || '',
      };
    },
    syncToStore: async (data: any) => {
      // 更新到experiment store
      experimentStore.updateSteadyAdjustment(data);
    },
  };

  registerCollector(collector);
  console.log('SteadyRangeCheck数据收集器已注册');
}

// 监听WebSocket消息更新（仅非admin用户）
if (!isAdmin.value) {
  watch(
    () => experimentStore.state.currentExperiment?.steadyAdjustment,
    (newData) => {
      if (newData) {
        console.log(
          'SteadyAdjustment data updated from WebSocket for non-admin user:',
          newData,
        );
        // 更新本地显示数据（来自WebSocket推送）
        formData.value = {
          id: newData.id || '',
          ratedVoltage: newData.ratedVoltage || '',
          noLoadMaxVoltage: newData.noLoadMaxVoltage || '',
          noLoadMinVoltage: newData.noLoadMinVoltage || '',
          maxSpeedRegulationNoLoadFreq:
            newData.maxSpeedRegulationNoLoadFreq || '',
          maxSpeedRegulationFullLoadFreq:
            newData.maxSpeedRegulationFullLoadFreq || '',
          maxSteadyStateSpeedRegulation:
            newData.maxSteadyStateSpeedRegulation || '',
          minSpeedRegulationNoLoadFreq:
            newData.minSpeedRegulationNoLoadFreq || '',
          minSpeedRegulationFullLoadFreq:
            newData.minSpeedRegulationFullLoadFreq || '',
          minSteadyStateSpeedRegulation:
            newData.minSteadyStateSpeedRegulation || '',
          conclusion: newData.conclusion || '',
        };
      }
    },
    { deep: true },
  );
}
</script>

<style scoped>
.steady-range-check-container {
  /* 自定义样式 */
}
</style>
