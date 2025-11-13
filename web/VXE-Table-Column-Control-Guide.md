# VXE Table 列显示控制指南

## 概述

在 VXE Table 中，`toolbarConfig: { custom: true }` 启用了自定义工具栏功能，允许用户通过编程方式控制列的显示和隐藏。

## 核心 API 方法

### 1. 获取列信息

```typescript
// 获取当前可见的列
const visibleColumns = gridApi.grid.getColumns();

// 获取所有列（包括隐藏的列）
const allColumns = gridApi.grid.getColumns(true);

// 根据字段名获取特定列
const column = gridApi.grid.getColumnByField('fieldName');
```

### 2. 控制列显示/隐藏

```typescript
// 隐藏列
gridApi.grid.hideColumn('fieldName');

// 显示列
gridApi.grid.showColumn('fieldName');

// 检查列是否可见
const column = gridApi.grid.getColumnByField('fieldName');
const isVisible = column.visible;
```

### 3. 批量操作

```typescript
// 批量设置列显示状态
const setColumnsVisibility = (columnVisibility: Record<string, boolean>) => {
  Object.entries(columnVisibility).forEach(([field, visible]) => {
    if (visible) {
      gridApi.grid.showColumn(field);
    } else {
      gridApi.grid.hideColumn(field);
    }
  });
};
```

## 实现步骤

### 1. 启用自定义工具栏

在 `gridOptions` 中设置：

```typescript
const gridOptions: VxeTableGridOptions = {
  // ... 其他配置
  toolbarConfig: {
    custom: true, // 启用自定义工具栏
  },
};
```

### 2. 创建列控制状态

```typescript
// 定义所有可能的列及其显示状态
const allColumns = ref([
  { field: 'name', title: '姓名', visible: true },
  { field: 'age', title: '年龄', visible: true },
  { field: 'email', title: '邮箱', visible: false },
  // ... 更多列
]);
```

### 3. 实现切换功能

```typescript
const toggleColumn = (field: string) => {
  const column = allColumns.value.find(col => col.field === field);
  if (column && gridApi.grid) {
    column.visible = !column.visible;
    
    if (column.visible) {
      gridApi.grid.showColumn(field);
    } else {
      gridApi.grid.hideColumn(field);
    }
  }
};
```

### 4. 创建控制界面

```vue
<template>
  <div class="column-control-panel">
    <h4>列显示控制：</h4>
    <div class="flex flex-wrap gap-2">
      <label v-for="column in allColumns" :key="column.field" class="flex items-center">
        <input 
          type="checkbox" 
          :checked="column.visible" 
          @change="toggleColumn(column.field)"
          class="mr-1"
        />
        {{ column.title }}
      </label>
    </div>
  </div>
</template>
```

## 高级用法

### 1. 使用 toolbar-tools 插槽

```vue
<template>
  <Grid>
    <template #toolbar-tools>
      <VxeButton @click="showColumnSelector">
        <Icon icon="mdi:view-column" class="mr-1" />
        列设置
      </VxeButton>
    </template>
  </Grid>
</template>
```

### 2. 弹窗式列选择器

```typescript
const showColumnSelector = () => {
  // 显示列选择弹窗
  Modal.confirm({
    title: '选择显示的列',
    content: h(ColumnSelector, {
      columns: allColumns.value,
      onUpdate: (updatedColumns) => {
        // 更新列显示状态
        updatedColumns.forEach(col => {
          const currentCol = allColumns.value.find(c => c.field === col.field);
          if (currentCol && currentCol.visible !== col.visible) {
            toggleColumn(col.field);
          }
        });
      }
    }),
  });
};
```

### 3. 保存用户偏好

```typescript
// 保存列显示偏好到 localStorage
const saveColumnPreferences = () => {
  const preferences = allColumns.value.reduce((acc, col) => {
    acc[col.field] = col.visible;
    return acc;
  }, {} as Record<string, boolean>);
  
  localStorage.setItem('table-column-preferences', JSON.stringify(preferences));
};

// 加载列显示偏好
const loadColumnPreferences = () => {
  const saved = localStorage.getItem('table-column-preferences');
  if (saved) {
    const preferences = JSON.parse(saved);
    setColumnsVisibility(preferences);
  }
};
```

## 在 LoadTestReport.vue 中的应用

基于你的 `LoadTestReport.vue` 文件，可以这样实现：

```typescript
// 在 LoadTestReport.vue 中添加
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    // ... 现有配置
    toolbarConfig: {
      custom: true,
    },
  },
});

// 定义列控制状态
const columnVisibility = ref({
  serialNumber: true,
  time: true,
  load: true,
  powerStandard: true,
  powerMeasured: true,
  frequency: false,
  powerFactor: false,
  // ... 其他字段
});

// 切换列显示
const toggleColumn = (field: string) => {
  columnVisibility.value[field] = !columnVisibility.value[field];
  
  if (gridApi.grid) {
    if (columnVisibility.value[field]) {
      gridApi.grid.showColumn(field);
    } else {
      gridApi.grid.hideColumn(field);
    }
  }
};
```

## 注意事项

1. **时机问题**：确保在表格完全初始化后再调用 API 方法
2. **状态同步**：保持本地状态与表格实际状态同步
3. **性能考虑**：频繁的列显示/隐藏操作可能影响性能
4. **用户体验**：提供直观的列控制界面

## 常见问题

### Q: 为什么调用 hideColumn 没有效果？
A: 确保表格已经完全初始化，可以在 `onMounted` 中使用 `setTimeout` 延迟调用。

### Q: 如何获取当前显示的列数？
A: 使用 `gridApi.grid.getColumns().length`

### Q: 如何重置所有列为默认状态？
A: 遍历所有列并根据初始配置调用 `showColumn` 或 `hideColumn`

## 参考资源

- [VXE Table 官方文档](https://vxetable.cn/)
- [VXE Table API 参考](https://vxetable.cn/v4/#/table/api)