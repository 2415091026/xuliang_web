<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const route = useRoute();
const router = useRouter();

const navLinks = [
  { name: "home", label: "首页" },
  { name: "music-songs", label: "音乐" },
  { name: "music-albums", label: "专辑" },
  { name: "photos", label: "照片集" },
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
  ElMessage.success("已成功退出登录");
  router.push({ name: "home" });
};

// 挂载时校验登录态
onMounted(() => {
  checkLoginStatus();
});

// 监听路由变化，及时更新登录态（例如从登录页跳转回主页）
watch(
  () => route.path,
  () => {
    checkLoginStatus();
  }
);
</script>

<template>
  <nav
    class="fixed left-1/2 top-7 z-40 grid h-12 w-[min(1280px,calc(100%_-_64px))] -translate-x-1/2 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-8 max-[760px]:w-[calc(100%_-_32px)] max-[760px]:gap-4"
    aria-label="主导航"
  >
    <RouterLink class="group flex items-center gap-3 text-left focus-visible:outline-none" :to="{ name: 'home' }" aria-label="首页">
      <span class="grid size-10 place-items-center rounded-full bg-[linear-gradient(135deg,#d77475,#8b3e5a)] text-xs font-black text-white shadow-[0_12px_28px_rgba(183,72,91,0.22)]">XL</span>
      <span class="grid gap-0.5">
        <strong class="text-[17px] font-black leading-none tracking-wide text-[#fff8ea] transition group-hover:text-white">徐良</strong>
        <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#fff8ea]/58">Official Site</span>
      </span>
    </RouterLink>

    <div class="flex items-center justify-center gap-9 max-[760px]:hidden">
      <RouterLink v-for="item in navLinks" :key="item.name" v-slot="{ href, navigate, isExactActive }" custom :to="{ name: item.name }">
        <a
          :href="href"
          class="relative h-10 px-1 text-sm font-black text-[#fff8ea]/68 transition hover:text-[#fff8ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
          :class="isExactActive ? 'text-[#fff8ea]' : ''"
          :aria-current="isExactActive ? 'page' : undefined"
          @click="navigate"
        >
          {{ item.label }}
          <span
            class="absolute bottom-0 left-1/2 h-px w-5 -translate-x-1/2 bg-[#f2b84b] transition"
            :class="isExactActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'"
          ></span>
        </a>
      </RouterLink>
    </div>

    <!-- 登录态与未登录态显示逻辑 -->
    <div v-if="userInfo" class="relative group">
      <!-- 用户头像和名称触发按钮 -->
      <button
        class="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/38 pl-2 pr-4 text-sm font-black text-[#fff8ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-[#f2b84b]/46 hover:bg-black/48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
        aria-haspopup="true"
        aria-label="用户菜单"
      >
        <!-- 头像展示 -->
        <img
          v-if="userInfo.avatar"
          :src="userInfo.avatar"
          class="size-6 rounded-full object-cover"
          alt="用户头像"
        />
        <span
          v-else
          class="grid size-6 place-items-center rounded-full bg-[#f2b84b]/20 text-[10px] font-black text-[#f2b84b]"
        >
          {{ (userInfo.nickName || userInfo.userName || "U").substring(0, 1).toUpperCase() }}
        </span>
        <!-- 昵称展示，防止过长超出布局 -->
        <span class="max-w-[80px] truncate">{{ userInfo.nickName || userInfo.userName || "-" }}</span>
        <!-- 悬浮箭头微动画 -->
        <svg
          class="size-3 text-[#fff8ea]/60 transition-transform duration-200 group-hover:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- 退出登录悬浮菜单（毛玻璃玻璃拟态） -->
      <div
        class="absolute right-0 mt-2 w-36 origin-top-right rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl p-1.5 shadow-2xl transition-all duration-200 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-['']"
        role="menu"
      >
        <button
          @click="handleLogout"
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-[#ff4f63] transition hover:bg-white/5 hover:text-[#ff7a8a]"
          role="menuitem"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          退出登录
        </button>
      </div>
    </div>

    <RouterLink
      v-else
      class="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/38 px-4 text-sm font-black text-[#fff8ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-[#f2b84b]/46 hover:bg-black/48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
      :to="{ name: 'login' }"
    >
      登录
    </RouterLink>
  </nav>
</template>
