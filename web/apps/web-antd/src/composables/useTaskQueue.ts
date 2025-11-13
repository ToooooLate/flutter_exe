import { reactive } from 'vue';

// 任务项接口
export interface TaskItem {
  id: string;
  name: string;
  component: string;
  execute: () => Promise<void>;
  priority: number; // 移除可选标记，设为必需
}

// 任务队列状态接口
export interface TaskQueueState {
  tasks: TaskItem[];
  isExecuting: boolean; // 修改属性名
  currentTask: TaskItem | null;
  completedTasks: TaskItem[]; // 修改为TaskItem数组
  failedTasks: Array<{ task: TaskItem; error: Error }>; // 修改为对象数组
  progress: number;
}

// 任务队列管理器
export function useTaskQueue() {
  // 响应式状态
  const state = reactive<TaskQueueState>({
    tasks: [],
    isExecuting: false,
    currentTask: null,
    completedTasks: [],
    failedTasks: [],
    progress: 0,
  });

  // 添加任务到队列
  const addTask = (task: Omit<TaskItem, 'id'> & { priority?: number }): string => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: TaskItem = {
      id: taskId,
      name: task.name,
      component: task.component,
      execute: task.execute,
      priority: task.priority ?? 1, // 提供默认值
    };
    
    state.tasks.push(newTask);
    console.log(`Task added: ${newTask.name} (Priority: ${newTask.priority})`);
    return taskId;
  };

  // 清空队列
  const clearQueue = (): void => {
    state.tasks = [];
    state.completedTasks = [];
    state.failedTasks = [];
    state.progress = 0;
    console.log('Task queue cleared');
  };

  // 执行队列中的所有任务
  const executeQueue = async (): Promise<void> => {
    if (state.isExecuting) {
      console.warn('Task queue is already executing');
      return;
    }

    state.isExecuting = true;
    state.currentTask = null;
    state.completedTasks = [];
    state.failedTasks = [];
    state.progress = 0;

    try {
      // 按优先级排序任务（高优先级先执行）
      const sortedTasks = [...state.tasks].sort((a, b) => b.priority - a.priority);
      const totalTasks = sortedTasks.length;

      for (let i = 0; i < sortedTasks.length; i++) {
        const task = sortedTasks[i];
        state.currentTask = task;
        
        try {
          console.log(`Executing task: ${task.name} (${task.component})`);
          await task.execute();
          state.completedTasks.push(task);
          console.log(`Task completed: ${task.name}`);
        } catch (error) {
          console.error(`Task failed: ${task.name}`, error);
          state.failedTasks.push({ task, error: error as Error });
        }

        // 更新进度
        state.progress = Math.round(((i + 1) / totalTasks) * 100);
      }
    } finally {
      state.isExecuting = false;
      state.currentTask = null;
    }
  };

  // 获取任务状态
  const getTaskStatus = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const isCompleted = state.completedTasks.some(t => t.id === taskId);
    const isFailed = state.failedTasks.some(f => f.task.id === taskId);
    const isCurrent = state.currentTask?.id === taskId;

    return {
      task,
      status: isCurrent ? 'running' : isCompleted ? 'completed' : isFailed ? 'failed' : 'pending',
    };
  };

  return {
    state,
    addTask,
    clearQueue,
    executeQueue,
    getTaskStatus,
  };
}