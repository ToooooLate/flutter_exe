import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { useAccessStore } from '@vben/stores';
import { useUserStore } from './user';
import { useExperimentStore } from '#/store/experiment';
import { isSameExperimentId } from '#/composables/useExperimentStorage';

// WebSocket消息类型枚举
export enum WebSocketMessageType {
  // 实验数据相关消息
  EXPERIMENT = 'experiment',                    // 全量实验数据格式--包含数据同步接口以及综合试验数据测定接口
  MONITORING = 'monitoring',                   // 实时监控数据格式
  TRANSIENT_SPEED = 'transientSpeed',          // 瞬态调速率和稳定时间测定数据格式
  TRANSIENT_VOLTAGE = 'transientVoltage',      // 瞬态电压变化率和稳定时间测定数据格式
  VOLTAGE_MODULATION = 'voltageModulation',    // 电压调制数据格式
  CHECK_STARTUP = 'checkStartup',              // 机组运转检查数据格式
  INTEGRATED_EXPERIMENT = 'integratedExperiment', // 综合试验数据格式
  
  // 系统消息（保留原有的系统消息类型）
  SYSTEM_NOTIFICATION = 'system_notification',
  EXPERIMENT_STATUS_CHANGE = 'experiment_status_change',
  USER_ONLINE_STATUS = 'user_online_status',
  HEARTBEAT = 'heartbeat',
}

// WebSocket消息接口
export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: number;
  userId?: string;
  experimentId?: string;
}

// 实时监控数据接口
export interface MonitoringData {
  code: number;
  coolantTemperature: number;
  createTime: string;
  delFlag: number;
  exhaustTemp: number;
  experimentId: string;
  frequency: number;
  ia: number;
  ib: number;
  ic: number;
  id: string;
  load: number;
  oilPressure: number;
  oilTemperature: number;
  power: number;
  powerFactor: number;
  speed: number;
  ua: number;
  ub: number;
  uc: number;
  updateTime: string;
}

// 瞬态调速率数据接口
export interface TransientSpeedData {
  code: number;
  id: string;
  experimentId: string;
  loadChangeState: string;
  beforeChangeFrequency: string;
  beforeChangePower: string;
  instantaneousFrequencyMaxMin: string;
  afterChangeFrequency: string;
  afterChangePower: string;
  stabilityTime: string;
  transientSpeedRegulationRate: string;
  curveInfo: string;
  conclusion: string;
  stableFrequencyDeviationRange: string;
}

// 瞬态电压变化率数据接口
export interface TransientVoltageData {
  code: number;
  id: string;
  experimentId: string;
  loadChangeState: string;
  beforeChangeVoltage: string;
  beforeChangeCurrent: string;
  beforeChangePowerFactor: string;
  instantaneousFrequencyMaxMin: string;
  afterChangeVoltage: string;
  afterChangeCurrent: string;
  afterChangePowerFactor: string;
  stabilityTime: string;
  transientVoltageChangeRate: string;
  curveInfo: string;
  conclusion: string;
  stableVoltageDeviationRange: string;
}

// 电压调制数据接口
export interface VoltageModulationData {
  code: number;
  id: string;
  experimentId: string;
  umodMax: number;
  umodMin: number;
  umodSPercent: number;
}

// 机组运转检查数据接口
export interface CheckStartupData {
  code: number;
  id: string;
  experimentId: string;
  item: string;
  voltage: string;
  frequency: string;
  waterTemp: string;
  oilPressure: string;
  speed: string;
  threeLeakage: string;
  conclusion: string;
}

// WebSocket连接状态
export enum WebSocketStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export const useWebSocketStore = defineStore('websocket', () => {
  const userStore = useUserStore();
  const experimentStore = useExperimentStore();
  
  // WebSocket连接实例
  const ws = ref<WebSocket | null>(null);
  
  // 连接状态
  const status = ref<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  
  // 错误信息
  const errorMessage = ref<string>('');
  
  // 重连次数
  const reconnectCount = ref(0);
  
  // 最大重连次数
  const maxReconnectCount = 5;
  
  // 重连间隔（毫秒）
  const reconnectInterval = 3000;
  
  // 通用消息监听器类型定义
  type MessageListener<T = any> = (data: T) => void;
  
  // 消息监听器映射表
  const messageListeners = ref<Map<WebSocketMessageType, Set<MessageListener>>>(new Map());
  
  // 监控数据回调函数列表（保持向后兼容）
  const monitoringDataCallbacks = ref<Array<(data: MonitoringData) => void>>([]);
  
  // 消息队列（连接断开时暂存）
  const messageQueue = ref<WebSocketMessage[]>([]);
  
  // 心跳定时器
  const heartbeatTimer = ref<number | null>(null);
  
  // 心跳间隔（毫秒）
  const heartbeatInterval = 30000;

  // 计算属性：当前用户角色
  const userRole = computed(() => {
    const roles = userStore.userInfo?.roles || [];
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('normal')) return 'normal';
    if (roles.includes('guest')) return 'guest';
    return 'guest'; // 默认为guest
  });

  // 计算属性：是否为admin用户
  const isAdmin = computed(() => userRole.value === 'admin');

  // 计算属性：是否应该处理可修改数据消息
  const shouldHandleModifiableData = computed(() => {
    return userRole.value === 'guest' || userRole.value === 'normal';
  });

  /**
   * 连接WebSocket
   */
  function connect(url?: string) {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      console.log('WebSocket已连接，无需重复连接');
      return;
    }

    const wsUrl = url || getWebSocketUrl();
    console.log(`正在连接WebSocket: ${wsUrl}`);
    
    status.value = WebSocketStatus.CONNECTING;
    errorMessage.value = '';

    try {
      ws.value = new WebSocket(wsUrl);
      
      ws.value.onopen = handleOpen;
      ws.value.onmessage = handleMessage;
      ws.value.onclose = handleClose;
      ws.value.onerror = handleError;
      
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      status.value = WebSocketStatus.ERROR;
      errorMessage.value = error instanceof Error ? error.message : '连接失败';
    }
  }

  /**
   * 断开WebSocket连接
   */
  function disconnect() {
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value);
      heartbeatTimer.value = null;
    }

    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
    
    status.value = WebSocketStatus.DISCONNECTED;
    reconnectCount.value = 0;
  }

  /**
   * 发送消息
   */
  function sendMessage(message: WebSocketMessage) {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，消息已加入队列');
      messageQueue.value.push(message);
    }
  }

  /**
   * 处理连接打开
   */
  function handleOpen() {
    console.log('WebSocket连接已建立');
    status.value = WebSocketStatus.CONNECTED;
    reconnectCount.value = 0;
    
    // 发送队列中的消息
    while (messageQueue.value.length > 0) {
      const message = messageQueue.value.shift();
      if (message && ws.value) {
        ws.value.send(JSON.stringify(message));
      }
    }
    
    // 启动心跳
    startHeartbeat();
  }

  /**
   * 处理接收到的消息
   */
  function handleMessage(event: MessageEvent) {
    try {
      // 检查消息数据是否为有效的JSON格式
      if (typeof event.data !== 'string') {
        console.warn('收到非字符串格式的WebSocket消息:', event.data);
        return;
      }
      
      const message: WebSocketMessage = JSON.parse(event.data);
      if(message.type !== WebSocketMessageType.HEARTBEAT) console.log('收到WebSocket消息:', message);
      
      // 根据消息类型和用户角色处理消息
      processMessage(message);
      
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
      console.error('原始消息数据:', event.data);
    }
  }

  /**
   * 处理连接关闭
   */
  function handleClose(event: CloseEvent) {
    console.log('WebSocket连接已关闭:', event.code, event.reason);
    status.value = WebSocketStatus.DISCONNECTED;
    
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value);
      heartbeatTimer.value = null;
    }
    
    // 如果不是主动关闭，尝试重连
    if (event.code !== 1000 && reconnectCount.value < maxReconnectCount) {
      attemptReconnect();
    }
  }

  /**
   * 处理连接错误
   */
  function handleError(event: Event) {
    console.error('WebSocket连接错误:', event);
    status.value = WebSocketStatus.ERROR;
    errorMessage.value = 'WebSocket连接错误';
  }

  /**
   * 尝试重连
   */
  function attemptReconnect() {
    if (reconnectCount.value >= maxReconnectCount) {
      console.error('达到最大重连次数，停止重连');
      return;
    }
    
    reconnectCount.value++;
    status.value = WebSocketStatus.RECONNECTING;
    
    console.log(`尝试第${reconnectCount.value}次重连...`);
    
    setTimeout(() => {
      connect();
    }, reconnectInterval);
  }

  /**
   * 启动心跳
   */
  function startHeartbeat() {
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value);
    }
    
    heartbeatTimer.value = setInterval(() => {
      sendMessage({
        type: WebSocketMessageType.HEARTBEAT,
        data: { timestamp: Date.now() },
        timestamp: Date.now(),
      });
    }, heartbeatInterval);
  }

  /**
   * 通用消息分发函数
   */
  function notifyListeners<T>(messageType: WebSocketMessageType, data: T) {
    const listeners = messageListeners.value.get(messageType);
    if (listeners && listeners.size > 0) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`消息监听器执行错误 (${messageType}):`, error);
        }
      });
    }
  }

  /**
   * 处理消息
   */
  function processMessage(message: WebSocketMessage) {
    const { type, data, experimentId } = message;

    // 仅处理当前实验的消息：当本地存在实验ID，且与消息中的 experimentId 不同，则忽略
    if (!isSameExperimentId(experimentId)) {
      console.log('忽略非当前实验的消息，experimentId=', experimentId);
      return;
    }
    
    // 判断是否为实验数据相关消息
    const isExperimentDataMessage = [
      WebSocketMessageType.EXPERIMENT,
      WebSocketMessageType.MONITORING,
      WebSocketMessageType.TRANSIENT_SPEED,
      WebSocketMessageType.TRANSIENT_VOLTAGE,
      WebSocketMessageType.VOLTAGE_MODULATION,
      WebSocketMessageType.CHECK_STARTUP,
      WebSocketMessageType.INTEGRATED_EXPERIMENT
    ].includes(type);
    
    // admin用户可以处理所有消息，guest/normal用户主要接收实验数据更新
    if (!isAdmin.value && !isExperimentDataMessage) {
      // 非admin用户只处理实验数据消息和系统消息
      const isSystemMessage = [
        WebSocketMessageType.SYSTEM_NOTIFICATION,
        WebSocketMessageType.EXPERIMENT_STATUS_CHANGE,
        WebSocketMessageType.USER_ONLINE_STATUS,
        WebSocketMessageType.HEARTBEAT,
      ].includes(type);
      
      if (!isSystemMessage) {
        console.log(`当前角色(${userRole.value})不处理此类消息: ${type}`);
        return;
      }
    }
    
    // 处理具体消息类型
    switch (type) {
      case WebSocketMessageType.EXPERIMENT:
        handleExperimentData(data);
        break;
        
      case WebSocketMessageType.MONITORING:
        handleMonitoringData(data);
        break;
        
      case WebSocketMessageType.TRANSIENT_SPEED:
        handleTransientSpeedData(data);
        break;
        
      case WebSocketMessageType.TRANSIENT_VOLTAGE:
        handleTransientVoltageData(data);
        break;
        
      case WebSocketMessageType.VOLTAGE_MODULATION:
        handleVoltageModulationData(data);
        break;
        
      case WebSocketMessageType.CHECK_STARTUP:
        handleCheckStartupData(data);
        break;
      
      case WebSocketMessageType.INTEGRATED_EXPERIMENT:
        handleIntegratedExperimentData(data);
        break;
        
      case WebSocketMessageType.SYSTEM_NOTIFICATION:
        handleSystemNotification(data);
        break;
        
      case WebSocketMessageType.EXPERIMENT_STATUS_CHANGE:
        handleExperimentStatusChange(data);
        break;
        
      case WebSocketMessageType.USER_ONLINE_STATUS:
        handleUserOnlineStatus(data);
        break;
        
      case WebSocketMessageType.HEARTBEAT:
        // 心跳消息，无需处理
        break;
        
      default:
        console.warn('未知的WebSocket消息类型:', type);
    }
  }

  /**
   * 处理全量实验数据
   */
  function handleExperimentData(data: any) {
    console.log('处理全量实验数据:', data);
    
    // 通用消息分发
    notifyListeners(WebSocketMessageType.EXPERIMENT, data);
    
    // TODO: 实现全量实验数据更新逻辑
    // experimentStore.updateExperimentFromWebSocket(data);
  }

  /**
   * 处理实时监控数据
   */
  function handleMonitoringData(data: MonitoringData) {
    console.log('处理实时监控数据:', data);
    
    // 通用消息分发
    notifyListeners(WebSocketMessageType.MONITORING, data);
    
    // 调用所有注册的回调函数（保持向后兼容）
    monitoringDataCallbacks.value.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('监控数据回调函数执行错误:', error);
      }
    });
  }

  /**
   * 处理瞬态调速率数据
   */
  function handleTransientSpeedData(data: TransientSpeedData) {
    console.log('处理瞬态调速率数据:', data);

    // 通用消息分发
    notifyListeners(WebSocketMessageType.TRANSIENT_SPEED, data);
  }

  /**
   * 处理瞬态电压变化率数据
   */
  function handleTransientVoltageData(data: TransientVoltageData) {
    console.log('处理瞬态电压变化率数据:', data);
    
    // 通用消息分发
    notifyListeners(WebSocketMessageType.TRANSIENT_VOLTAGE, data);
    // TODO: 实现瞬态电压变化率数据更新逻辑
    // experimentStore.updateTransientVoltageDataFromWebSocket(data);
  }

  /**
   * 处理电压调制数据
   */
  function handleVoltageModulationData(data: VoltageModulationData) {
    console.log('处理电压调制数据:', data);
    notifyListeners(WebSocketMessageType.VOLTAGE_MODULATION, data);
  }

  /**
   * 处理机组运转检查数据
   */
  function handleCheckStartupData(data: CheckStartupData) {
    console.log('处理机组运转检查数据:', data);
    notifyListeners(WebSocketMessageType.CHECK_STARTUP, data);
  }

  /**
   * 处理综合试验数据
   */
  function handleIntegratedExperimentData(data: any) {
    console.log('处理综合试验数据:', data);
    notifyListeners(WebSocketMessageType.INTEGRATED_EXPERIMENT, data);
    // TODO: 实现综合试验数据更新逻辑
    // experimentStore.updateIntegratedExperimentDataFromWebSocket(data);
  }

  /**
   * 处理系统通知
   */
  function handleSystemNotification(data: any) {
    console.log('收到系统通知:', data);
    // TODO: 实现系统通知显示逻辑
    // 可以使用消息提示组件显示通知
  }

  /**
   * 处理实验状态变更
   */
  function handleExperimentStatusChange(data: any) {
    console.log('实验状态变更:', data);
    // TODO: 实现实验状态更新逻辑
    // experimentStore.updateExperimentStatus(data);
  }

  /**
   * 处理用户在线状态
   */
  function handleUserOnlineStatus(data: any) {
    console.log('用户在线状态更新:', data);
    // TODO: 实现用户在线状态显示逻辑
  }

  /**
   * 获取WebSocket连接URL
   */
  function getWebSocketUrl(): string {
    // 优先使用配置文件中的 WebSocket URL
    const configUrl = import.meta.env.VITE_WEBSOCKET_URL;
    if (configUrl) {
      return configUrl;
    }
    
    // 如果配置文件中没有设置，则动态构建
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/experiment/updates`;
  }

  /**
   * 获取连接状态描述
   */
  function getStatusText(): string {
    switch (status.value) {
      case WebSocketStatus.DISCONNECTED:
        return '未连接';
      case WebSocketStatus.CONNECTING:
        return '连接中...';
      case WebSocketStatus.CONNECTED:
        return '已连接';
      case WebSocketStatus.RECONNECTING:
        return '重连中...';
      case WebSocketStatus.ERROR:
        return '连接错误';
      default:
        return '未知状态';
    }
  }

  /**
   * 重置 store 状态
   */
  function $reset() {
    status.value = WebSocketStatus.DISCONNECTED;
    errorMessage.value = '';
    reconnectCount.value = 0;
    messageQueue.value = [];
    
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
    
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value);
      heartbeatTimer.value = null;
    }
  }

  // 注册监控数据回调函数（保持向后兼容）
  function registerMonitoringDataCallback(callback: (data: MonitoringData) => void) {
    monitoringDataCallbacks.value.push(callback);
  }
  
  // 取消注册监控数据回调函数（保持向后兼容）
  function unregisterMonitoringDataCallback(callback: (data: MonitoringData) => void) {
    const index = monitoringDataCallbacks.value.indexOf(callback);
    if (index > -1) {
      monitoringDataCallbacks.value.splice(index, 1);
    }
  }

  // 通用消息监听器注册
  function registerMessageListener<T = any>(messageType: WebSocketMessageType, listener: MessageListener<T>) {
    if (!messageListeners.value.has(messageType)) {
      messageListeners.value.set(messageType, new Set());
    }
    messageListeners.value.get(messageType)!.add(listener);
  }

  // 通用消息监听器取消注册
  function unregisterMessageListener<T = any>(messageType: WebSocketMessageType, listener: MessageListener<T>) {
    const listeners = messageListeners.value.get(messageType);
    if (listeners) {
      listeners.delete(listener);
      // 如果该消息类型没有监听器了，删除整个 Set
      if (listeners.size === 0) {
        messageListeners.value.delete(messageType);
      }
    }
  }

  /**
   * 初始化 WebSocket 连接
   * 在应用启动时调用，如果用户已登录则自动连接
   */
  function initialize() {
    // 检查用户是否已登录
    const accessStore = useAccessStore();
    const token = accessStore.accessToken;
    
    if (token && status.value === WebSocketStatus.DISCONNECTED) {
      console.log('检测到用户已登录，自动建立 WebSocket 连接');
      connect();
    }
  }

  return {
    // 状态
    status: readonly(status),
    errorMessage: readonly(errorMessage),
    reconnectCount: readonly(reconnectCount),
    
    // 计算属性
    userRole,
    isAdmin,
    shouldHandleModifiableData,
    
    // 方法
    $reset,
    connect,
    disconnect,
    sendMessage,
    getStatusText,
    initialize,
    
    // 通用消息监听器方法
    registerMessageListener,
    unregisterMessageListener,
    
    // 向后兼容的监控数据回调方法
    registerMonitoringDataCallback,
    unregisterMonitoringDataCallback,
  };
});