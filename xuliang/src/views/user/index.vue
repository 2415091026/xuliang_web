<script setup>
import { ref, watch, provide, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  User,
  Document,
  ChatLineRound,
  Star,
  Compass,
  Bell,
  Setting,
  HomeFilled,
  CirclePlus
} from "@element-plus/icons-vue";
import { getUnreadCountApi } from "../../api/message";
import { on, off } from "../../utils/socket";

const router = useRouter();
const route = useRoute();

// 响应式未读消息计数
const unreadCount = ref(0);

// 获取最新未读消息计数
const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCountApi();
    if (res.code === 200 || res.data) {
      const data = res.data || res;
      unreadCount.value = data.unreadCount || 0;
    }
  } catch (error) {
    console.error("个人中心获取未读数失败：", error);
  }
};

// 接收 WebSocket 实时广播的消息并更新未读数（全局响应）
const handleNewMessage = (data) => {
  console.log("[WebSocket] 个人中心监听到新消息，未读数递增");
  unreadCount.value++;
};

onMounted(() => {
  fetchUnreadCount();
  on("new_message", handleNewMessage);
});

onUnmounted(() => {
  off("new_message", handleNewMessage);
});

// 共享未读状态及刷新方法给子路由组件 (例如 messages.vue)
provide("unreadCountState", {
  unreadCount,
  fetchUnreadCount
});

// 导航菜单选项 (菜单项与路由 name 绑定，高亮控制)
const menuItems = computed(() => [
  { key: "user-center", label: "我的主页", icon: User },
  { key: "user-center-posts", label: "我的帖子", icon: Document },
  // { key: "user-center-replies", label: "我的回复", icon: ChatLineRound },
  { key: "user-center-collects", label: "我的收藏", icon: Star },
  // { key: "user-center-follow", label: "我的关注", icon: Compass },
  { key: "user-center-messages", label: "消息中心", icon: Bell, badge: unreadCount.value },
  // { key: "user-center-settings", label: "系统设置", icon: Setting }
]);

// 根据当前路由的 name 属性做双向绑定，实现精准高亮点亮
const activeMenu = ref("user-center");

watch(
  () => route.name,
  (newName) => {
    if (newName) {
      activeMenu.value = newName;
    }
  },
  { immediate: true }
);

// 处理菜单切换逻辑
const handleMenuClick = (key) => {
  activeMenu.value = key;
  router.push({ name: key });
};
</script>

<template>
  <div class="user-center-page-wrapper">
    <!-- 主布局网格容器（使用纯 CSS 控制双栏排版，彻底消除对齐 Bug） -->
    <div class="user-center-layout">
      <!-- 左侧边导航栏 -->
      <aside class="sidebar-area">
        <div class="card-glass-panel p-4 sidebar-panel-card">
          <!-- 标志性的玫红渐变大标题横幅，100% 还原效果图 2 -->
          <div class="sidebar-title-banner">
            <el-icon class="text-lg text-white">
              <HomeFilled />
            </el-icon>
            个人中心
          </div>

          <!-- 导航菜单项列表 -->
          <nav class="sidebar-nav">
            <button v-for="item in menuItems" :key="item.key" @click="handleMenuClick(item.key)" class="nav-menu-btn"
              :class="{ 'is-active': activeMenu === item.key }">
              <span class="flex items-center gap-3">
                <el-icon class="text-base">
                  <component :is="item.icon" />
                </el-icon>
                {{ item.label }}
              </span>
              <span v-if="item.badge" class="menu-badge">
                {{ item.badge }}
              </span>
            </button>
          </nav>

          <!-- 下方发布新帖按钮 -->
          <div class="sidebar-divider">
            <el-button type="primary" class="publish-trigger-btn" @click="router.push({ name: 'community' })">
              发布新帖
              <el-icon class="text-base ml-2">
                <CirclePlus />
              </el-icon>
            </el-button>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区通过 RouterView 呈现子视图内容 -->
      <main class="main-content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 全局页面包裹器 - 补充红粉色发光渐变底图 */
.user-center-page-wrapper {
  width: 100%;
  padding: 32px 0;
  box-sizing: border-box;
  background: radial-gradient(circle at 10% 20%, rgba(215, 116, 117, 0.08) 0%, transparent 40vw),
    radial-gradient(circle at 90% 80%, rgba(99, 215, 231, 0.04) 0%, transparent 45vw);
}

/* ==================== 主体大布局 ==================== */
.user-center-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}

/* 强行在大屏下锁定左右并排（240px 菜单，1fr 主区） */
@media (min-width: 1024px) {
  .user-center-layout {
    grid-template-columns: 240px 1fr;
  }
}

/* 左侧边栏 */
.sidebar-area {
  width: 100%;
}

.sidebar-panel-card {
  padding: 16px;
}

/* 左侧导航最上方的独立玫红色渐变大卡片，100% 还原效果图 2 */
.sidebar-title-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #d77475 0%, #8b3e5a 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 900;
  padding: 16px 20px;
  border-radius: 18px;
  margin-bottom: 20px;
  box-shadow: 0 10px 25px rgba(215, 116, 117, 0.25);
  letter-spacing: 0.05em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 左侧导航菜单列表 */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-menu-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: none;
  background: transparent;
  padding: 13px 16px;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.48);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  border: 1px solid transparent;
}

.nav-menu-btn:hover {
  background-color: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
}

/* 激活菜单高亮效果，使用与图 1 相同的暗红高对比胶囊底色 */
.nav-menu-btn.is-active {
  background-color: rgba(215, 116, 117, 0.1) !important;
  color: #fff;
  border: 1px solid rgba(215, 116, 117, 0.2);
}

.menu-badge {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 99px;
  background-color: #ff4f63;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
}

.sidebar-divider {
  margin-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 24px;
}

/* 实心渐变发布按钮 */
.publish-trigger-btn {
  width: 100% !important;
  height: 44px !important;
  border: none !important;
  background: linear-gradient(90deg, #d77475 0%, #f2b84b 100%) !important;
  color: #fff !important;
  font-weight: 900 !important;
  border-radius: 14px !important;
  box-shadow: 0 8px 20px rgba(215, 116, 117, 0.25) !important;
  transition: all 0.25s ease !important;
}

.publish-trigger-btn:active {
  transform: scale(0.98);
}

/* 右侧主内容区 */
.main-content-area {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
}

/* 通用面板样式 */
.card-glass-panel {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(16, 17, 22, 0.8);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
</style>
