<template>
  <div class="load-test">
    <h3 class="text-foreground mb-2 text-lg font-semibold">Load Test</h3>

    <div class="table-container">
      <Grid />
    </div>

    <div class="form-section">
      <div class="form-row">
        <label>结论 Conclusion:</label>
        <textarea
          v-model="conclusion"
          placeholder="请输入结论..."
          class="h-20 w-full resize-none rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLoadTestMeasurementApi } from '#/api/core/load-test';

// 响应式数据
const remark = ref('');
const conclusion = ref('');

// 测试配置 - 定义每个测试项目的基本参数
const testConfigs = [
  { load: '0 %', time: '10 min' },
  { load: '25 %', time: '10 min' },
  { load: '50 %', time: '10 min' },
  { load: '75 %', time: '10 min' },
  { load: '100 %', time: '30 min' },
  { load: '100 %', time: '30 min' },
  { load: '100 %', time: '30 min' },
  { load: '100 %', time: '30 min' },
  { load: '100 %', time: '30 min' },
  { load: '100 %', time: '30 min' },
];

// 创建空的测量字段模板
const createEmptyMeasurementFields = () => ({
  powerStandard: '',
  powerMeasured: '',
  frequency: '',
  powerFactor: '',
  uA: '',
  uB: '',
  uC: '',
  iA: '',
  iB: '',
  iC: '',
  speed: '',
  oilTemp: '',
  oilPressure: '',
  coolantTemp: '',
  crankcasePress: '',
  fuelRate: '',
  percentPowerInsite1: '',
  percentPowerInsite2: '',
  fuelAccumulatorPress: '',
  fuelSupplyPress: '',
  exhaustTempLB: '',
  exhaustTempRB: '',
  coolantPress: '',
  seaWaterPress: '',
  fuelTemp: '',
  boostPressL: '',
  boostPressR: '',
  intakeManifTempLBF: '',
  intakeManifTempLBR: '',
  intakeManifTempRBF: '',
  intakeManifTempRBR: '',
});

// 生成表格数据
const generateTableData = () => {
  return testConfigs.map((config, index) => ({
    id: index + 1,
    item: String(index + 1),
    time: config.time,
    load: config.load,
    ...createEmptyMeasurementFields(),
  }));
};

// 表格数据 - 以测试项目为行
const tableData = ref(generateTableData());

// 测定相关函数
const measurementStatus = ref(Array(16).fill(false)); // 正在测定状态
const completedStatus = ref(Array(16).fill(false)); // 测定完成状态

const canMeasure = (itemId: number) => {
  // 如果当前项目正在测定，不能点击
  if (measurementStatus.value[itemId - 1]) {
    return false;
  }

  // 如果当前项目已完成，不能再次点击
  if (completedStatus.value[itemId - 1]) {
    return false;
  }

  // 第一个项目(id=1)总是可以点击
  if (itemId === 1) {
    return true;
  }

  // 其他项目需要前一个项目完成后才能点击
  return completedStatus.value[itemId - 2];
};

const startMeasurement = async (itemId: number) => {
  measurementStatus.value[itemId - 1] = true;

  try {
    // 调用后端API获取测定数据
    const measurementData = await getLoadTestMeasurementApi({ itemId });

    // 更新对应行的数据
    const targetRow = tableData.value.find((row) => row.id === itemId);
    if (targetRow) {
      // 更新所有测定字段
      Object.assign(targetRow, {
        powerMeasured: measurementData.powerMeasured,
        frequency: measurementData.frequency,
        powerFactor: measurementData.powerFactor,
        uA: measurementData.uA,
        uB: measurementData.uB,
        uC: measurementData.uC,
        iA: measurementData.iA,
        iB: measurementData.iB,
        iC: measurementData.iC,
        speed: measurementData.speed,
        oilTemp: measurementData.oilTemp,
        oilPressure: measurementData.oilPressure,
        coolantTemp: measurementData.coolantTemp,
        crankcasePress: measurementData.crankcasePress,
        fuelRate: measurementData.fuelRate,
      });

      // 标记当前项目为已完成
      completedStatus.value[itemId - 1] = true;
    }
  } catch (error) {
    console.error('测定失败:', error);
  } finally {
    measurementStatus.value[itemId - 1] = false;
  }
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  data: tableData.value,
  columns: [
    {
      field: 'item',
      title: '项目\nItem',
      width: 80,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '测定\nMeasure',
      width: 80,
      align: 'center',
      fixed: 'left',
      cellRender: {
        name: 'CellButton',
        props: ({ row }) => ({
          content: `测定${row.id}`,
          disabled: !canMeasure(row.id),
        }),
        events: ({ row }) => ({
          click: async () => {
            await startMeasurement(row.id);
          },
        }),
      },
    },
    {
      field: 'time',
      title: '时间 (min)\nTime',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      field: 'load',
      title: '负载 (%)\nLoad',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      field: 'powerStandard',
      title: '功率标准(kW)\nPower Standard',
      width: 120,
      align: 'center',
    },
    {
      field: 'powerMeasured',
      title: '功率测定(kW)\nPower Measured',
      width: 120,
      align: 'center',
    },
    {
      field: 'frequency',
      title: '频率 (Hz)\nFrequency',
      width: 120,
      align: 'center',
    },
    {
      field: 'powerFactor',
      title: '功率因数\nPower Factor',
      width: 120,
      align: 'center',
    },
    {
      field: 'uA',
      title: 'UA (V)',
      width: 100,
      align: 'center',
    },
    {
      field: 'uB',
      title: 'UB (V)',
      width: 100,
      align: 'center',
    },
    {
      field: 'uC',
      title: 'UC (V)',
      width: 100,
      align: 'center',
    },
    {
      field: 'iA',
      title: 'IA (A)',
      width: 100,
      align: 'center',
    },
    {
      field: 'iB',
      title: 'IB (A)',
      width: 100,
      align: 'center',
    },
    {
      field: 'iC',
      title: 'IC (A)',
      width: 100,
      align: 'center',
    },
    {
      field: 'speed',
      title: '转速 (rpm)\nSpeed',
      width: 120,
      align: 'center',
    },
    {
      field: 'oilTemp',
      title: '油温 (℃)\nOil Temp',
      width: 120,
      align: 'center',
    },
    {
      field: 'oilPressure',
      title: '油压 (Bar)\nOil Pressure',
      width: 120,
      align: 'center',
    },
    {
      field: 'coolantTemp',
      title: '冷却液温度 (℃)\nCoolant Temp',
      width: 140,
      align: 'center',
    },
    {
      field: 'crankcasePress',
      title: '曲轴箱压力 (mbar)\nCrankcase Press',
      width: 140,
      align: 'center',
    },
    {
      field: 'fuelRate',
      title: '燃油流量 (L/h)\nFuel Rate',
      width: 120,
      align: 'center',
    },
    {
      field: 'percentPowerInsite1',
      title: 'Percent Power\n(%) - Insite',
      width: 120,
      align: 'center',
    },
    {
      field: 'percentPowerInsite2',
      title: 'Percent Power\n(%) - Insite',
      width: 120,
      align: 'center',
    },
    {
      field: 'fuelAccumulatorPress',
      title: 'Fuel Accumulator\nPress(Mpa)',
      width: 140,
      align: 'center',
    },
    {
      field: 'fuelSupplyPress',
      title: 'Fuel Supply Press\n(Bar)',
      width: 130,
      align: 'center',
    },
    {
      field: 'exhaustTempLB',
      title: 'Exhaust Temp. LB\n(°C)',
      width: 130,
      align: 'center',
    },
    {
      field: 'exhaustTempRB',
      title: 'Exhaust Temp. RB\n(°C)',
      width: 130,
      align: 'center',
    },
    {
      field: 'coolantPress',
      title: 'Coolant Press\n(Bar)',
      width: 120,
      align: 'center',
    },
    {
      field: 'seaWaterPress',
      title: 'Sea Water Press\n(Bar)',
      width: 130,
      align: 'center',
    },
    {
      field: 'fuelTemp',
      title: 'Fuel Temp\n(°C)',
      width: 100,
      align: 'center',
    },
    {
      field: 'boostPressL',
      title: 'Boost Press L\n(Bar)',
      width: 120,
      align: 'center',
    },
    {
      field: 'boostPressR',
      title: 'Boost Press R\n(Bar)',
      width: 120,
      align: 'center',
    },
    {
      field: 'intakeManifTempLBF',
      title: 'Intake Manif Temp\nLBF (°C)',
      width: 140,
      align: 'center',
    },
    {
      field: 'intakeManifTempLBR',
      title: 'Intake Manif Temp\nLBR (°C)',
      width: 140,
      align: 'center',
    },
    {
      field: 'intakeManifTempRBF',
      title: 'Intake Manif Temp\nRBF (°C)',
      width: 140,
      align: 'center',
    },
    {
      field: 'intakeManifTempRBR',
      title: 'Intake Manif Temp\nRBR (°C)',
      width: 140,
      align: 'center',
    },
  ],
  pagerConfig: {
    enabled: false,
  },
  border: true,
  showOverflow: false,
  cellConfig: {
    height: 'auto',
  },
  scrollX: {
    enabled: true,
  },
  scrollY: {
    enabled: true,
    gt: 10,
  },
};

const [Grid] = useVbenVxeGrid({ gridOptions });
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
  text-align: center;
  padding: 8px 4px;
  white-space: pre-line;
  line-height: 1.2;
}

:deep(.ant-table-tbody > tr > td) {
  text-align: center;
  padding: 8px 4px;
}

:deep(.ant-table-fixed-left) {
  background-color: #f5f5f5;
}
</style>
