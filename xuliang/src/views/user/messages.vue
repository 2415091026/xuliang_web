<script setup>
import { ref, onMounted, onUnmounted, inject } from "vue";
import { ElMessage } from "element-plus";
import { Bell, ChatDotSquare, Present, Promotion, Message, User } from "@element-plus/icons-vue";
import { on, off } from "../../utils/socket";
import { getMessagesApi, markMessagesAsReadApi } from "../../api/message";

const messagesList = ref([]);
const total = ref(0);

// 从个人中心父组件注入未读数共享状态与刷新方法
const { unreadCount, fetchUnreadCount } = inject("unreadCountState", {
  unreadCount: ref(0),
  fetchUnreadCount: () => {}
});

const loading = ref(false);

const query = ref({
  pageNum: 1,
  pageSize: 10,
  messageType: "", // 空字符串代表全部分类
  readStatus: ""    // 空字符串代表全部状态
});

// 获取消息类型的图标和名称配置（结合 bizType 和 title 智能判定以适配参考图中的各类提醒）
const getMessageTypeConfig = (msg) => {
  const type = msg?.messageType;
  const bizType = msg?.bizType || "";
  const title = msg?.title || "";

  // 1. 官方公告 (绿色调)
  if (bizType === "announcement" || title.includes("公告") || title.includes("规则")) {
    return { label: "官方公告", iconComponent: Promotion, colorClass: "type-announcement" };
  }
  // 2. 社交互动 (红粉色调)
  if (type === "2" || bizType.startsWith("post_") || title.includes("点赞") || title.includes("回复") || title.includes("关注")) {
    return { label: "社交互动", iconComponent: ChatDotSquare, colorClass: "type-social" };
  }
  // 3. 业务提醒 (橙黄色调)
  if (type === "3" || title.includes("勋章") || title.includes("解锁") || title.includes("奖励")) {
    return { label: "业务提醒", iconComponent: Present, colorClass: "type-biz" };
  }
  // 4. 系统通知 (紫色调)
  if (type === "1" || title.includes("提醒") || title.includes("安全")) {
    return { label: "系统通知", iconComponent: Bell, colorClass: "type-system" };
  }
  // 默认
  return { label: "系统消息", iconComponent: Message, colorClass: "type-default" };
};

// 友好格式化时间
const formatMessageTime = (timeStr) => {
  if (!timeStr) return "-";
  try {
    const date = new Date(timeStr.replace(/-/g, "/"));
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return `今天 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  } catch (e) {
    return timeStr || "-";
  }
};

// 拉取消息列表数据
const fetchMessages = async (resetPage = false) => {
  if (resetPage) {
    query.value.pageNum = 1;
  }
  loading.value = true;
  try {
    const res = await getMessagesApi({
      pageNum: query.value.pageNum,
      pageSize: query.value.pageSize,
      messageType: query.value.messageType || undefined,
      readStatus: query.value.readStatus || undefined
    });
    if (res.code === 200 || res.data) {
      const data = res.data || res;
      messagesList.value = data.list || [];
      total.value = data.total || 0;
    }
  } catch (error) {
    console.error("拉取消息列表失败：", error);
  } finally {
    loading.value = false;
  }
};

// 点击某条消息卡片，标记为已读
const handleMessageClick = async (msg) => {
  if (msg.readStatus === "0") {
    try {
      const res = await markMessagesAsReadApi({ messageIds: [msg.messageId] });
      if (res.code === 200 || res.msg === "success" || !res.code) {
        msg.readStatus = "1";
        if (unreadCount.value > 0) {
          unreadCount.value--;
        }
      }
    } catch (error) {
      console.error("标记已读失败：", error);
    }
  }
};

// 一键已读当前页面内所有的未读消息
const handleMarkAllAsRead = async () => {
  const unreadIds = messagesList.value
    .filter((msg) => msg.readStatus === "0")
    .map((msg) => msg.messageId);

  if (unreadIds.length === 0) return;

  try {
    const res = await markMessagesAsReadApi({ messageIds: unreadIds });
    if (res.code === 200 || res.msg === "success" || !res.code) {
      messagesList.value.forEach((msg) => {
        if (msg.readStatus === "0") {
          msg.readStatus = "1";
        }
      });
      ElMessage.success("已全部标记为已读");
      fetchUnreadCount();
    }
  } catch (error) {
    console.error("一键已读失败：", error);
  }
};

// 切换类别 Tab 过滤
const handleTabChange = (type) => {
  query.value.messageType = type;
  fetchMessages(true);
};

// 切换状态 Tab 过滤（全部/未读/已读）
const handleStatusFilterChange = (status) => {
  query.value.readStatus = status;
  fetchMessages(true);
};

// 接收 WebSocket 实时广播的消息并优雅推入列表
const handleNewMessage = (data) => {
  console.log("[WebSocket] 消息中心收到新消息：", data);

  const isTypeMatch = !query.value.messageType || query.value.messageType === data.messageType;
  const isStatusMatch = query.value.readStatus !== "1";

  if (isTypeMatch && isStatusMatch) {
    messagesList.value.unshift({
      ...data,
      readStatus: "0"
    });
    if (messagesList.value.length > query.value.pageSize) {
      messagesList.value.pop();
    }
    total.value++;
  }

  // ElMessage({
  //   message: `您收到一条新的${getMessageTypeConfig(data).label}：${data.title}`,
  //   type: "info",
  //   duration: 4000
  // });
};

onMounted(() => {
  fetchMessages();
  fetchUnreadCount();

  on("new_message", handleNewMessage);
});

onUnmounted(() => {
  off("new_message", handleNewMessage);
});
</script>

<template>
  <div class="card-glass-panel section-padding text-left messages-container p-6 " v-loading="loading">
    <div class="messages-header">
      <h3 class="section-title">
        消息中心
        <el-badge v-if="unreadCount > 0" :value="unreadCount" class="unread-badge" />
      </h3>

      <button v-if="messagesList.some(msg => msg.readStatus === '0')" class="mark-all-btn" @click="handleMarkAllAsRead">
        一键已读
      </button>
    </div>

    <!-- 分类与已读状态过滤器 -->
    <div class="messages-filter-bar">
      <div class="filter-group type-tabs">
        <span class="filter-tab-item" :class="{ active: query.messageType === '' }" @click="handleTabChange('')">
          全部
        </span>
        <span class="filter-tab-item" :class="{ active: query.messageType === '1' }" @click="handleTabChange('1')">
          系统通知
        </span>
        <span class="filter-tab-item" :class="{ active: query.messageType === '2' }" @click="handleTabChange('2')">
          社交互动
        </span>
        <span class="filter-tab-item" :class="{ active: query.messageType === '3' }" @click="handleTabChange('3')">
          业务提醒
        </span>
      </div>

      <div class="filter-group status-tabs">
        <span class="status-tab-item" :class="{ active: query.readStatus === '' }"
          @click="handleStatusFilterChange('')">
          所有
        </span>
        <span class="status-tab-item" :class="{ active: query.readStatus === '0' }"
          @click="handleStatusFilterChange('0')">
          未读
        </span>
        <span class="status-tab-item" :class="{ active: query.readStatus === '1' }"
          @click="handleStatusFilterChange('1')">
          已读
        </span>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="messages-stack" v-if="messagesList.length > 0">
      <div v-for="msg in messagesList" :key="msg.messageId" class="message-item-card"
        :class="{ 'is-unread': msg.readStatus === '0' }" @click="handleMessageClick(msg)">
        <!-- 正圆形发光背景，图标亮白 -->
        <div class="message-icon-wrapper" :class="getMessageTypeConfig(msg).colorClass">
          <el-icon :size="20">
            <component :is="getMessageTypeConfig(msg).iconComponent" />
          </el-icon>
        </div>

        <div class="message-info-body">
          <div class="msg-header">
            <div class="msg-type-title-group">
              <!-- 胶囊样式 Tag：根据 currentColor 自适应边框与轻量半透底色 -->
              <span class="msg-type-tag" :class="getMessageTypeConfig(msg).colorClass">
                {{ getMessageTypeConfig(msg).label }}
              </span>
              <strong class="msg-item-title">{{ msg.title || "-" }}</strong>
            </div>
            <div class="msg-time-dot-group">
              <span class="msg-time">{{ formatMessageTime(msg.createTime) }}</span>
              <!-- 未读小黄点，精准对齐并紧随时间右侧 -->
              <span class="unread-dot-indicator" v-if="msg.readStatus === '0'"></span>
            </div>
          </div>
          <p class="msg-content">{{ msg.content || "-" }}</p>
        </div>
      </div>

      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :total="total"
          layout="prev, pager, next" background @current-change="fetchMessages(false)" class="custom-pagination" />
      </div>
    </div>

    <!-- 缺省页占位，用 SVG 取代原本的 emoji ✉️ -->
    <div class="empty-messages-placeholder" v-else>
      <el-icon class="empty-icon" :size="48">
        <Message />
      </el-icon>
      <p class="empty-text">暂无相关消息通知</p>
      <span class="empty-dash">-</span>
    </div>
  </div>
</template>

<style scoped>
.messages-container {
  width: 100%;
  position: relative;
}

/* 提高主要交互内容层级 */
.messages-header,
.messages-filter-bar,
.messages-stack,
.empty-messages-placeholder {
  position: relative;
  z-index: 2;
}

.section-title {
  font-size: 16px;
  font-weight: 900;
  color: #fff8ea;
  display: flex;
  align-items: center;
  /* gap: 8px; */
}

.messages-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

/* 未读数徽标呼吸灯效果 */
@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 79, 99, 0.8);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(255, 79, 99, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(255, 79, 99, 0);
  }
}

.unread-badge :deep(.el-badge__content) {
  background-color: #ff4f63 !important;
  border: none !important;
  font-family: inherit;
  font-weight: 900;
  /* animation: pulse-glow 2s infinite; */
}

/* 磨砂微晶按钮设计 */
.mark-all-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 248, 234, 0.85);
  padding: 8px 18px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.mark-all-btn:hover {
  background: linear-gradient(135deg, rgba(242, 184, 75, 0.12) 0%, rgba(242, 184, 75, 0.03) 100%);
  border-color: rgba(242, 184, 75, 0.3);
  color: #f2b84b;
  box-shadow: 0 6px 20px rgba(242, 184, 75, 0.15);
}

.messages-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.type-tabs,
.status-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 14px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

.filter-tab-item,
.status-tab-item {
  padding: 7px 16px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 248, 234, 0.45);
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-tab-item:hover,
.status-tab-item:hover {
  color: #fff8ea;
  background: rgba(255, 255, 255, 0.03);
}

.filter-tab-item.active,
.status-tab-item.active {
  background: rgba(255, 255, 255, 0.08);
  color: #f2b84b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  text-shadow: 0 0 10px rgba(242, 184, 75, 0.2);
}

.messages-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 消息卡片：OLED极暗精简磨砂卡片 */
.message-item-card {
  position: relative;
  display: flex;
  gap: 20px;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  background-color: rgba(255, 255, 255, 0.015);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.message-item-card:hover {
  background-color: rgba(255, 255, 255, 0.035);
  border-color: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}

/* 未读状态卡片精细设计：使用高级的带圆角渐变微光细描边 */
.message-item-card.is-unread {
  border: 1px solid transparent;
  background: linear-gradient(#141216, #141216) padding-box,
    linear-gradient(135deg, rgba(255, 79, 99, 0.4) 0%, rgba(242, 184, 75, 0.4) 100%) border-box;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 79, 99, 0.03);
}

.message-item-card.is-unread:hover {
  background: linear-gradient(#1a181c, #1a181c) padding-box,
    linear-gradient(135deg, rgba(255, 79, 99, 0.6) 0%, rgba(242, 184, 75, 0.6) 100%) border-box;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45), 0 0 25px rgba(255, 79, 99, 0.05);
}

/* 圆形发光底盘 */
.message-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
}

.message-icon-wrapper :deep(.el-icon) {
  color: #ffffff !important;
  /* 图标亮白高亮 */
}

.message-item-card:hover .message-icon-wrapper {
  transform: scale(1.06) rotate(3deg);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

/* 图标渐变底色配置（暗色系深沉渐变） */
.type-system {
  background: linear-gradient(135deg, #2b1f4d 0%, #17102e 100%) !important;
  border-color: rgba(110, 68, 255, 0.25) !important;
  color: #a88eff !important;
}

.type-social {
  background: linear-gradient(135deg, #4d1c2d 0%, #290a14 100%) !important;
  border-color: rgba(255, 79, 99, 0.25) !important;
  color: #ff6b8b !important;
}

.type-biz {
  background: linear-gradient(135deg, #422915 0%, #261608 100%) !important;
  border-color: rgba(242, 184, 75, 0.25) !important;
  color: #ff9f43 !important;
}

.type-announcement {
  background: linear-gradient(135deg, #133924 0%, #081d11 100%) !important;
  border-color: rgba(52, 199, 89, 0.25) !important;
  color: #34c759 !important;
}

.type-default {
  background: linear-gradient(135deg, #2a2a2a 0%, #151515 100%) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #fff8ea !important;
}

.message-info-body {
  flex: 1;
  min-width: 0;
}

.msg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.msg-type-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 自适应磨砂胶囊标签：自适应字色配低不透明度半透背景 */
.msg-type-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border: 1px solid currentColor;
  background-color: transparent;
  opacity: 0.85;
}

/* 结合色彩填充 */
.type-system.msg-type-tag {
  background-color: rgba(168, 142, 255, 0.08);
  border-color: rgba(168, 142, 255, 0.15);
}

.type-social.msg-type-tag {
  background-color: rgba(255, 107, 139, 0.08);
  border-color: rgba(255, 107, 139, 0.15);
}

.type-biz.msg-type-tag {
  background-color: rgba(255, 159, 67, 0.08);
  border-color: rgba(255, 159, 67, 0.15);
}

.type-announcement.msg-type-tag {
  background-color: rgba(52, 199, 89, 0.08);
  border-color: rgba(52, 199, 89, 0.15);
}

.type-default.msg-type-tag {
  background-color: rgba(255, 248, 234, 0.08);
  border-color: rgba(255, 248, 234, 0.15);
}

.msg-item-title {
  font-size: 14px;
  font-weight: 800;
  color: #fff8ea;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.05);
}

.msg-time-dot-group {
  display: flex;
  /* align-items: center; */
  gap: 8px;
}

.msg-time {
  font-size: 11px;
  color: rgba(255, 248, 234, 0.32);
  font-weight: 600;
  line-height: 1;
  /* 重置行高以实现精确对齐 */
}

.msg-content {
  margin-top: 10px;
  font-size: 13px;
  color: rgba(255, 248, 234, 0.62);
  line-height: 1.6;
  font-weight: 500;
}

/* 未读小黄点：移入时间右侧后的样式 */
.unread-dot-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #ff9f43;
  /* 橙黄色发光点 */
  box-shadow: 0 0 12px #ff9f43, 0 0 4px #ff9f43;
  flex-shrink: 0;
  transform: translateY(1px);
  /* 视觉补偿微调，确保绝对水平居中 */
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 28px;
  padding-top: 8px;
}

.custom-pagination :deep(.el-pager li) {
  background-color: rgba(255, 255, 255, 0.02) !important;
  color: rgba(255, 255, 255, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.03) !important;
  border-radius: 8px !important;
  transition: all 0.2s ease;
}

.custom-pagination :deep(.el-pager li:hover) {
  color: #fff8ea !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.custom-pagination :deep(.el-pager li.is-active) {
  background-color: #f2b84b !important;
  color: #08090d !important;
  border-color: #f2b84b !important;
  font-weight: 900;
  box-shadow: 0 4px 12px rgba(242, 184, 75, 0.25);
}

.custom-pagination :deep(.btn-prev),
.custom-pagination :deep(.btn-next) {
  background-color: rgba(255, 255, 255, 0.02) !important;
  color: rgba(255, 255, 255, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.03) !important;
  border-radius: 8px !important;
  transition: all 0.2s ease;
}

.custom-pagination :deep(.btn-prev:hover),
.custom-pagination :deep(.btn-next:hover) {
  color: #fff8ea !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.custom-pagination :deep(.btn-prev:disabled),
.custom-pagination :deep(.btn-next:disabled) {
  opacity: 0.25;
  cursor: not-allowed;
}

.empty-messages-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}

.empty-icon {
  color: rgba(255, 255, 255, 0.2) !important;
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.empty-messages-placeholder:hover .empty-icon {
  transform: scale(1.1) rotate(5deg);
}

.empty-text {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.36);
  margin-bottom: 4px;
}

.empty-dash {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.15);
}

/* 极致暗色毛玻璃主面板 */
.card-glass-panel {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  background: linear-gradient(135deg, rgba(18, 16, 20, 0.9) 0%, rgba(10, 9, 12, 0.95) 100%);
  box-shadow: 0 35px 70px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
}
</style>
