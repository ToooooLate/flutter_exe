<template>
  <div class="line-chart-example">
    <div class="controls">
      <div class="control-group">
        <button @click="startRealTimeUpdate" :disabled="isUpdating">开始实时更新</button>
        <button @click="stopRealTimeUpdate" :disabled="!isUpdating">停止更新</button>
        <button @click="generateData">生成新数据</button>
      </div>
      <div class="control-group">
        <label>范围最小值:</label>
        <input type="number" v-model.number="rangeMin" @change="updateRange" />
        <label>范围最大值:</label>
        <input type="number" v-model.number="rangeMax" @change="updateRange" />
      </div>
    </div>
    
    <LineChart
      :data="chartData"
      :range-area="rangeArea"
      title="发动机性能参数监控"
      x-axis-name="时间"
      y-axis-name="数值"
      width="100%"
      height="500px"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import LineChart from './LineChart.vue'
import type { ChartDataPoint, RangeArea } from './LineChart.vue'

// 图表数据
const chartData = ref<ChartDataPoint[]>([])

// 范围区间
const rangeArea = reactive<RangeArea>({
  min: 20,
  max: 80,
  color: '#ff4d4f',
  name: '正常范围'
})

// 实时更新控制
const isUpdating = ref(false)
let updateTimer: NodeJS.Timeout | null = null

// 范围控制
const rangeMin = ref(20)
const rangeMax = ref(80)

// 更新范围
const updateRange = () => {
  rangeArea.min = rangeMin.value
  rangeArea.max = rangeMax.value
}

// 生成新数据
const generateData = () => {
  generateRandomData()
}

// 生成随机数据
const generateRandomData = () => {
  const data: ChartDataPoint[] = []
  const now = Date.now()
  
  for (let i = 0; i < 200; i++) {
    data.push({
      x: new Date(now - (200 - i) * 1000).toLocaleTimeString(),
      y: Math.random() * 100
    })
  }
  
  chartData.value = data
}

// 开始实时更新
const startRealTimeUpdate = () => {
  if (isUpdating.value) return
  
  isUpdating.value = true
  updateTimer = setInterval(() => {
    // 移除第一个数据点，添加新的数据点
    if (chartData.value.length > 0) {
      chartData.value.shift()
    }
    
    chartData.value.push({
      x: new Date().toLocaleTimeString(),
      y: Math.random() * 100
    })
  }, 1000)
}

// 停止实时更新
const stopRealTimeUpdate = () => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
  isUpdating.value = false
}

// 组件卸载时清理定时器
onUnmounted(() => {
  stopRealTimeUpdate()
})

// 初始化数据
generateRandomData()
</script>

<style scoped>
.line-chart-example {
  padding: 20px;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

button {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #40a9ff;
}

button:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

label {
  font-weight: 500;
  color: #333;
}

input[type="number"] {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  width: 80px;
}
</style>