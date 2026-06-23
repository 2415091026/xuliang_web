import { io } from "socket.io-client";

// 全局唯一的 Socket 实例
let socket = null;

// 全局记录活跃的事件监听器，用于 socket 实例重建时自动重新绑定并消除加载时序竞态
const activeListeners = [];

/**
 * 初始化 WebSocket 连接
 * @param {string} token 用户的登录凭证 JWT Token
 * @returns {Socket} socket.io-client 实例
 */
export const initSocket = (token) => {
  if (!token) {
    console.warn("[WebSocket] 初始化连接失败：未提供 Token");
    return null;
  }

  // 如果已经存在连接实例，且已连接，则无需重新创建
  if (socket) {
    if (socket.connected) {
      console.log("[WebSocket] 已存在处于连接状态的 Socket 实例");
      return socket;
    }
    // 若未连接但有实例，先安全断开
    socket.disconnect();
  }

  const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:8080/message";
  const formattedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  console.log(`[WebSocket] 正在尝试建立连接至: ${wsUrl}`);

  // 创建 Socket.io 客户端实例，传入 auth 配置
  socket = io(wsUrl, {
    auth: {
      token: formattedToken
    },
    transports: ["websocket", "polling"], // 优先使用高性能的 websocket，以 polling 作为备用降级方案
    autoConnect: true,
    reconnection: true,                  // 启用自动重连
    reconnectionAttempts: 5,            // 最大重连尝试次数
    reconnectionDelay: 5000,            // 重连等待时间（毫秒）
    timeout: 10000                      // 握手超时时间
  });

  // 绑定所有已记录的活跃监听器
  activeListeners.forEach(({ event, callback }) => {
    socket.on(event, callback);
  });

  // 全局默认事件监听与调试日志
  socket.on("connect", () => {
    console.log(`[WebSocket] 建立连接成功，连接 ID: ${socket.id}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[WebSocket] 连接已断开，原因: ${reason}`);
  });

  socket.on("connect_error", (error) => {
    console.error(`[WebSocket] 连接校验或握手失败: ${error.message}`);
  });

  return socket;
};

/**
 * 获取当前全局 of Socket 实例
 * @returns {Socket|null}
 */
export const getSocket = () => {
  return socket;
};

/**
 * 主动断开当前 WebSocket 连接并清除实例
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("[WebSocket] 已主动断开连接，并销毁全局实例");
  }
};

/**
 * 订阅消息事件
 * @param {string} event 事件名称
 * @param {Function} callback 回调处理函数
 */
export const on = (event, callback) => {
  const exists = activeListeners.some(item => item.event === event && item.callback === callback);
  if (!exists) {
    activeListeners.push({ event, callback });
  }
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * 取消订阅消息事件
 * @param {string} event 事件名称
 * @param {Function} callback 回调处理函数
 */
export const off = (event, callback) => {
  const idx = activeListeners.findIndex(item => item.event === event && item.callback === callback);
  if (idx !== -1) {
    activeListeners.splice(idx, 1);
  }
  if (socket) {
    socket.off(event, callback);
  }
};

/**
 * 向服务端发送事件消息
 * @param {string} event 事件名称
 * @param {any} data 发送的内容数据
 */
export const emit = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn(`[WebSocket] 未连接，发送数据失败: "${event}"`);
  }
};
