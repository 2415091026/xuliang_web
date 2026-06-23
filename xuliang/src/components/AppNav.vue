<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { initSocket, disconnectSocket } from "../utils/socket";
import { ArrowDown, SwitchButton, User } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

const navLinks = [
  { name: "home", label: "首页" },
  { name: "music-songs", label: "音乐" },
  { name: "music-albums", label: "专辑" },
  { name: "photos", label: "照片集" },
  { name: "community", label: "社区" },
  { name: "about", label: "关于" }
];

// 用户信息响应式变量
const userInfo = ref(null);

// 校验登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const infoStr = localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
  if (token && infoStr) {
    try {
      userInfo.value = JSON.parse(infoStr);
      // 有效登录状态下，初始化或自动恢复 WebSocket 连接
      initSocket(token);
    } catch (e) {
      userInfo.value = null;
    }
  } else {
    userInfo.value = null;
  }
};

// 退出登录逻辑
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userInfo");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userInfo");
  userInfo.value = null;
  // 退出登录时，主动断开 WebSocket 连接
  disconnectSocket();
  ElMessage.success("已成功退出登录");
  router.push({ name: "home" });
};

// 页面滚动状态控制
const isScrolled = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 12;
};

// 挂载时校验登录态并绑定滚动监听
onMounted(() => {
  checkLoginStatus();
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
});

// 卸载时销毁滚动事件以防内存泄漏
onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});

// 监听路由变化，及时更新登录态（例如从登录页跳转回主页）
watch(
  () => route.path,
  () => {
    checkLoginStatus();
  }
);

// 下拉菜单显示状态
const isDropdownVisible = ref(false);
const handleVisibleChange = (visible) => {
  isDropdownVisible.value = visible;
};
</script>
<template>
  <nav class="fixed left-0 right-0 top-0 z-40 transition-all duration-300" :class="[
    isScrolled
      ? 'h-16 bg-[#08090d]/85 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
      : 'h-20 bg-transparent border-b border-transparent'
  ]">
    <div class="relative mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 md:px-8">
      <RouterLink class="group flex items-center gap-3 text-left focus-visible:outline-none" :to="{ name: 'home' }"
        aria-label="首页">
        <span
          class="grid size-10 place-items-center rounded-full bg-[linear-gradient(135deg,#d77475,#8b3e5a)] text-xs font-black text-white shadow-[0_12px_28px_rgba(183,72,91,0.22)]">XL</span>
        <span class="grid gap-0.5">
          <strong
            class="text-[17px] font-black leading-none tracking-wide text-[#fff8ea] transition group-hover:text-white">徐良</strong>
          <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#fff8ea]/58">Official Site</span>
        </span>
      </RouterLink>

      <div
        class="absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center justify-center gap-9 max-[760px]:hidden">
        <RouterLink v-for="item in navLinks" :key="item.name" v-slot="{ href, navigate, isExactActive }" custom
          :to="{ name: item.name }">
          <a :href="href"
            class="relative inline-flex h-10 items-center justify-center px-1 text-sm font-black leading-none text-[#fff8ea]/68 transition hover:text-[#fff8ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
            :class="isExactActive ? 'text-[#fff8ea]' : ''" :aria-current="isExactActive ? 'page' : undefined"
            @click="navigate">
            {{ item.label }}
            <span class="absolute bottom-[8px] left-1/2 h-px w-5 -translate-x-1/2 bg-[#f2b84b] transition"
              :class="isExactActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'"></span>
          </a>
        </RouterLink>
      </div>

      <!-- 登录态与未登录态显示逻辑 -->
      <div v-if="userInfo" class="flex items-center">
        <el-dropdown trigger="hover" placement="bottom-end" :teleported="false" popper-class="custom-logout-dropdown"
          @visible-change="handleVisibleChange">
          <!-- 触发按钮 -->
          <el-button class="user-menu-btn" aria-label="用户菜单">
            <!-- 头像展示 -->
            <el-avatar v-if="userInfo.avatar" :size="24" :src="userInfo.avatar" class="mr-1 object-cover" alt="用户头像" />
            <el-avatar v-else :size="24" class="user-avatar-placeholder">
              {{ (userInfo.nickName || userInfo.userName || "U").substring(0, 1).toUpperCase() }}
            </el-avatar>
            <!-- 昵称展示，防止过长超出布局 -->
            <span class="max-w-[80px] truncate text-[#fff8ea]">{{ userInfo.nickName || userInfo.userName || "-"
              }}</span>
            <!-- 悬浮箭头微动画 -->
            <el-icon class="text-[#fff8ea]/60 transition-transform duration-200"
              :class="{ 'rotate-180': isDropdownVisible }">
              <ArrowDown />
            </el-icon>
          </el-button>

          <!-- 下拉菜单内容 -->
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push({ name: 'user-center' })">
                <el-icon class="mr-2">
                  <User />
                </el-icon>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item @click="handleLogout">
                <el-icon class="mr-2">
                  <SwitchButton />
                </el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <el-button v-else class="login-btn" @click="router.push({ name: 'login' })">
        登录
      </el-button>
    </div>
  </nav>
</template>

<style scoped>
.user-menu-btn {
  display: inline-flex !important;
  height: 2.5rem !important;
  /* h-10 */
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
  /* gap-2 */
  border-radius: 9999px !important;
  /* rounded-full */
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  /* border-white/10 */
  background-color: rgba(0, 0, 0, 0.38) !important;
  /* bg-black/38 */
  padding-left: 0.5rem !important;
  /* pl-2 */
  padding-right: 1rem !important;
  /* pr-4 */
  font-size: 0.875rem !important;
  /* text-sm */
  font-weight: 900 !important;
  /* font-black */
  color: #fff8ea !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 28px rgba(0, 0, 0, 0.22) !important;
  backdrop-filter: blur(24px) !important;
  /* backdrop-blur-xl */
  -webkit-backdrop-filter: blur(24px) !important;
  transition: all 0.3s ease !important;
  cursor: pointer !important;
}

.user-menu-btn:hover {
  border-color: rgba(242, 184, 75, 0.46) !important;
  /* hover:border-[#f2b84b]/46 */
  background-color: rgba(0, 0, 0, 0.48) !important;
  /* hover:bg-black/48 */
}

.login-btn {
  display: inline-flex !important;
  height: 2.5rem !important;
  /* h-10 */
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
  border-radius: 9999px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  background-color: rgba(0, 0, 0, 0.38) !important;
  padding-left: 1rem !important;
  /* px-4 */
  padding-right: 1rem !important;
  font-size: 0.875rem !important;
  font-weight: 900 !important;
  color: #fff8ea !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 28px rgba(0, 0, 0, 0.22) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
  transition: all 0.3s ease !important;
  cursor: pointer !important;
}

.login-btn:hover {
  border-color: rgba(242, 184, 75, 0.46) !important;
  background-color: rgba(0, 0, 0, 0.48) !important;
}

.user-avatar-placeholder {
  background-color: rgba(242, 184, 75, 0.2) !important;
  color: #f2b84b !important;
  font-size: 10px !important;
  font-weight: 900 !important;
  margin-right: 0.25rem !important;
}

:deep(.custom-logout-dropdown) {
  --el-dropdown-menu-box-shadow: none;
  background-color: rgba(8, 9, 13, 0.9) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 1rem !important;
  padding: 0.375rem !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
}

:deep(.custom-logout-dropdown .el-dropdown-menu) {
  background-color: transparent !important;
  padding: 0 !important;
}

:deep(.custom-logout-dropdown .el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.75rem !important;
  padding: 0.625rem 0.75rem !important;
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  color: #ff4f63 !important;
  transition: all 0.2s ease !important;
}

:deep(.custom-logout-dropdown .el-dropdown-menu__item:hover),
:deep(.custom-logout-dropdown .el-dropdown-menu__item:focus) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #ff7a8a !important;
}

/* 隐藏 element-plus 默认的小箭头，使界面更清爽 */
:deep(.custom-logout-dropdown .el-popper__arrow) {
  display: none !important;
}
</style>
