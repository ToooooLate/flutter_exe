<template>
  <div class="frequency-wave-motion-test">
    <h4 class="text-foreground mb-4 text-base font-medium">
      转速波动率测定 Frequency wave motion rate test
    </h4>

    <div class="table-container">
      <Grid />
    </div>

    <div class="form-section mt-6">
      <div class="form-row mb-4">
        <label class="form-label">转速波动率要求/Standard:</label>
        <input
          v-model="standard"
          type="text"
          placeholder="请输入标准要求..."
          class="form-input"
        />
      </div>

      <div class="form-row">
        <label class="form-label">结论/Conclusion:</label>
        <textarea
          v-model="conclusion"
          placeholder="请输入结论..."
          class="form-textarea"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import type { VxeTableGridOptions } from 'vxe-table';
import { useVbenVxeGrid } from '@vben/plugins/vxe-table';
import { getLoadTestMeasurementApi } from '#/api/core/load-test';

// 响应式数据
const standard = ref('');
const conclusion = ref('');

// 负载配置 - 根据设计稿定义
const loadConfigs = [
  { load: '100 %', label: '100%' },
  { load: '75 %', label: '75%' },
  { load: '50 %', label: '50%' },
  { load: '25 %', label: '25%' },
  { load: '0 %', label: '0%' },
];

// 测量项目配置 - 根据设计稿定义
const measurementItems = [
  { field: 'load', title: '负荷 (%)', unit: '%' },
  { field: 'power', title: '功率 (kW)', unit: 'kW' },
  { field: 'frequency', title: '频率 (Hz)', unit: 'Hz' },
  { field: 'powerFactor', title: '功率因数 COS Φ', unit: '' },
  { field: 'measuredFreqBefore', title: '测定前频率', unit: 'Hz' },
  {
    field: 'freqMax',
    title: 'Frequency wave motion in 1 mins - Max',
    unit: 'Hz',
  },
  {
    field: 'freqMin',
    title: 'Frequency wave motion in 1 mins - Min',
    unit: 'Hz',
  },
  {
    field: 'freqAve',
    title: 'Frequency wave motion in 1 mins - Ave',
    unit: 'Hz',
  },
  { field: 'motionRate', title: '转速波动率 %', unit: '%' },
];

// 创建行列颠倒的表格数据
const createTableData = () => {
  const data = [];

  // 为每个测量项目创建一行数据
  measurementItems.forEach((item, index) => {
    const rowData: any = {
      id: index + 1,
      measurementItem: item.title,
      unit: item.unit,
    };

    // 为每个负载点添加数据列
    loadConfigs.forEach((config, loadIndex) => {
      if (item.field === 'load') {
        // 负荷行显示负载配置
        rowData[`load_${loadIndex}`] = config.load;
      } else {
        // 其他行初始为空，等待测定
        rowData[`load_${loadIndex}`] = '';
      }
    });

    data.push(rowData);
  });

  return data;
};

// 表格数据
const tableData = ref(createTableData());

// 测定状态管理
const measurementStatus = ref<boolean[]>(
  new Array(loadConfigs.length).fill(false),
);
const completedStatus = ref<boolean[]>(
  new Array(loadConfigs.length).fill(false),
);

// 判断是否可以测定
const canMeasure = (loadIndex: number): boolean => {
  // 如果正在测定或已完成，不可点击
  if (measurementStatus.value[loadIndex] || completedStatus.value[loadIndex]) {
    return false;
  }

  // 第一个负载点始终可以开始测定
  if (loadIndex === 0) {
    return true;
  }

  // 其他负载点需要前一个完成后才能测定
  return completedStatus.value[loadIndex - 1];
};

// 开始测定
const startMeasurement = async (loadIndex: number) => {
  if (!canMeasure(loadIndex)) return;

  measurementStatus.value[loadIndex] = true;

  try {
    // 调用API获取测定数据 (暂时使用负载测试API)
    const data = await getLoadTestMeasurementApi({ itemId: loadIndex + 1 });

    // 更新表格数据
    tableData.value.forEach((row, rowIndex) => {
      const item = measurementItems[rowIndex];
      if (item.field !== 'load') {
        // 模拟数据映射
        const mockValue = `${(Math.random() * 100).toFixed(2)}`;
        row[`load_${loadIndex}`] = mockValue;
      }
    });

    // 标记为已完成
    completedStatus.value[loadIndex] = true;
  } catch (error) {
    console.error('测定失败:', error);
  } finally {
    measurementStatus.value[loadIndex] = false;
  }
};

// VxeTable 配置
const gridOptions: VxeTableGridOptions = {
  data: tableData.value, // 确保传递的是数组值而不是ref对象
  columns: [
    {
      field: 'measurementItem',
      title: '测量项目',
      width: 200,
      fixed: 'left',
    },
    {
      field: 'unit',
      title: '单位',
      width: 80,
      fixed: 'left',
    },
    // 动态生成负载列
    ...loadConfigs.map((config, loadIndex) => ({
      field: `load_${loadIndex}`,
      title: config.label,
      width: 120,
      slots: {
        default: ({ rowIndex }: { rowIndex: number }) => {
          // 只在第一行显示测定按钮
          if (rowIndex === 0) {
            return h('div', { style: 'margin-bottom: 4px;' }, [
              h(
                'button',
                {
                  class: [
                    'measure-btn',
                    canMeasure(loadIndex) ? 'enabled' : 'disabled',
                  ],
                  disabled: !canMeasure(loadIndex),
                  onClick: () => startMeasurement(loadIndex),
                },
                `测定${loadIndex + 1}`,
              ),
            ]);
          }
          return null;
        },
      },
    })),
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
    enabled: false,
  },
};

const [Grid] = useVbenVxeGrid({ gridOptions });
</script>

<style scoped>
.frequency-wave-motion-test {
  padding: 16px;
}

.table-container {
  margin-bottom: 24px;
}

.form-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}

.form-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.form-label {
  min-width: 200px;
  font-weight: 500;
  color: #374151;
  padding-top: 8px;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  flex: 1;
  min-height: 80px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.measure-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 60px;
}

.measure-btn.enabled {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.measure-btn.enabled:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.measure-btn.disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

:deep(.vxe-table .vxe-header--column) {
  background-color: #fafafa;
  font-weight: 600;
  text-align: center;
  white-space: pre-line;
  line-height: 1.2;
}

:deep(.vxe-table .vxe-body--column) {
  text-align: center;
}

:deep(.vxe-table .vxe-fixed--left-wrapper) {
  background-color: #f5f5f5;
}
</style>
