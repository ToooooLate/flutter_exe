import { reactive, readonly } from 'vue';
import { useTaskQueue, type TaskItem } from './useTaskQueue';

export interface DataCollector {
  id: string;
  name: string;
  component: string;
  type: string;
  collect: () => any | Promise<any>;
  hasChanges: () => boolean;
  syncToStore: (data?: any) => Promise<void>;
  priority?: number;
}

export interface DataCollectorState {
  collectors: Map<string, DataCollector>;
  isInitialized: boolean;
}

// 全局单例状态
const globalState = reactive<DataCollectorState>({
  collectors: new Map(),
  isInitialized: false,
});

export const useDataCollector = () => {
  const { addTask, clearQueue, executeQueue, state: queueState } = useTaskQueue();

  // 注册收集器
  const registerCollector = (collector: DataCollector) => {
    console.log(`注册数据收集器: ${collector.name} (${collector.component})`);
    globalState.collectors.set(collector.id, collector);
  };

  // 注销收集器
  const unregisterCollector = (id: string) => {
    const collector = globalState.collectors.get(id);
    if (collector) {
      console.log(`注销数据收集器: ${collector.name} (${collector.component})`);
      globalState.collectors.delete(id);
    }
  };

  // 获取所有有变更的收集器
  const getChangedCollectors = (): DataCollector[] => {
    const changedCollectors: DataCollector[] = [];
    
    globalState.collectors.forEach(collector => {
      try {
        if (collector.hasChanges()) {
          changedCollectors.push(collector);
        }
      } catch (error) {
        console.error(`检查收集器变更状态失败: ${collector.name}`, error);
      }
    });

    return changedCollectors.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  };

  // 创建同步任务队列
  const createSyncQueue = () => {
    // 清空之前的任务
    clearQueue();

    const changedCollectors = getChangedCollectors();
    
    if (changedCollectors.length === 0) {
      console.log('没有需要同步的数据');
      return false;
    }

    console.log(`发现 ${changedCollectors.length} 个组件有数据变更，创建同步任务队列`);

    // 为每个有变更的收集器创建任务
    changedCollectors.forEach(collector => {
      const task: TaskItem = {
        id: collector.id,
        name: collector.name,
        component: collector.component,
        priority: collector.priority || 0,
        execute: async () => {
          console.log(`开始同步组件数据: ${collector.name}`);
          
          try {
            // 收集数据 - 支持异步collect方法
            const data = await collector.collect();
            console.log(`收集到数据:`, data);
            
            // 同步到store，将收集到的数据传递给syncToStore方法
            await collector.syncToStore(data);
            
            console.log(`完成同步组件数据: ${collector.name}`);
          } catch (error) {
            console.error(`同步组件数据失败: ${collector.name}`, error);
            throw error;
          }
        }
      };

      addTask(task);
    });

    return true;
  };

  // 执行同步队列
  const executeSyncQueue = async (): Promise<boolean> => {
    console.log('开始执行数据同步队列');
    
    try {
      // 首先创建同步任务队列
      const hasQueue = createSyncQueue();
      
      if (!hasQueue) {
        console.log('没有需要同步的数据，跳过执行');
        return true;
      }
      
      // 执行同步队列
      await executeQueue();
      
      console.log('所有组件数据同步完成');
      return true;
    } catch (error) {
      console.error('执行同步队列失败:', error);
      return false;
    }
  };

  // 获取收集器信息
  const getCollectorInfo = () => {
    const collectors: Array<{
      id: string;
      name: string;
      component: string;
      type: string;
      hasChanges: boolean;
    }> = [];

    globalState.collectors.forEach(collector => {
      collectors.push({
        id: collector.id,
        name: collector.name,
        component: collector.component,
        type: collector.type,
        hasChanges: collector.hasChanges(),
      });
    });

    return collectors;
  };

  return {
    state: readonly(globalState),
    queueState: readonly(queueState),
    registerCollector,
    unregisterCollector,
    getChangedCollectors,
    createSyncQueue,
    executeSyncQueue,
    getCollectorInfo,
  };
};