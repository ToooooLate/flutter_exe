// WebSocket配置
export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectCount: number;
  heartbeatInterval: number;
  heartbeatTimeout: number;
}

// 环境配置
const configs: Record<string, WebSocketConfig> = {
  development: {
    url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://192.168.112.205:9993/spring-websocket',
    reconnectInterval: 3000,
    maxReconnectCount: 5,
    heartbeatInterval: 30000,
    heartbeatTimeout: 5000,
  },
  production: {
    url: import.meta.env.VITE_WEBSOCKET_URL || 'wss://production-server.com/spring-websocket',
    reconnectInterval: 5000,
    maxReconnectCount: 3,
    heartbeatInterval: 60000,
    heartbeatTimeout: 10000,
  },
  test: {
    url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:9993/spring-websocket',
    reconnectInterval: 2000,
    maxReconnectCount: 3,
    heartbeatInterval: 20000,
    heartbeatTimeout: 3000,
  },
};

// 获取当前环境
function getCurrentEnv(): string {
  return import.meta.env.MODE || 'development';
}

// 获取当前环境的WebSocket配置
export function getWebSocketConfig(): WebSocketConfig {
  const env = getCurrentEnv();
  return configs[env] ?? configs.development;
}

// 获取WebSocket URL
export function getWebSocketUrl(): string {
  return getWebSocketConfig().url;
}

// 获取重连配置
export function getReconnectConfig() {
  const config = getWebSocketConfig();
  return {
    interval: config.reconnectInterval,
    maxCount: config.maxReconnectCount,
  };
}

// 获取心跳配置
export function getHeartbeatConfig() {
  const config = getWebSocketConfig();
  return {
    interval: config.heartbeatInterval,
    timeout: config.heartbeatTimeout,
  };
}