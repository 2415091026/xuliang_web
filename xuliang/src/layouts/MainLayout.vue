<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppNav from "../components/AppNav.vue";
import { audioPlayer } from "../utils/audioPlayer";

const route = useRoute();
const router = useRouter();

// 仅在非音乐页面且当前有正在播放的歌曲时显示全局 Mini 播放条
const showMiniPlayer = computed(() => {
  return audioPlayer.currentSong && !route.path.startsWith("/music");
});

// 计算当前播放百分比进度，用于超薄条渲染
const progressPercent = computed(() => {
  if (!audioPlayer.currentSong) return 0;
  return (audioPlayer.playProgressSeconds / audioPlayer.currentSong.durationSeconds) * 100;
});

const handlePlayToggle = (e) => {
  e.stopPropagation();
  audioPlayer.toggle();
};

const handleNextSong = (e) => {
  e.stopPropagation();
  audioPlayer.next();
};

const goPlayerPage = () => {
  router.push("/music");
};
</script>

<template>
  <div
    class="min-h-svh overflow-x-hidden bg-[#08090d] text-[#fff8ea] [background:radial-gradient(circle_at_12%_8%,rgba(255,79,63,0.24),transparent_34vw),radial-gradient(circle_at_78%_12%,rgba(99,215,231,0.18),transparent_30vw),linear-gradient(180deg,#08090d_0%,#101018_42%,#08090d_100%)] [font-family:'Avenir_Next','PingFang_SC','Microsoft_YaHei',sans-serif]"
  >
    <header class="relative z-[70]">
      <AppNav />
    </header>

    <main :class="route.name === 'home' ? 'min-h-svh' : 'min-h-svh pt-20'">
      <RouterView />
    </main>

    <!-- 全局精美暗黑毛玻璃 Mini 播放器 -->
    <Transition name="mini-player">
      <div
        v-if="showMiniPlayer"
        @click="goPlayerPage"
        class="fixed right-8 bottom-8 z-[100] flex h-16 w-80 items-center justify-between overflow-hidden rounded-full border border-white/10 bg-[#08090d]/80 px-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl cursor-pointer hover:border-white/20 transition-all group max-[520px]:right-4 max-[520px]:left-4 max-[520px]:w-auto"
      >
        <!-- 顶部超薄进度条 -->
        <div class="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
          <div class="h-full bg-[#ff4f63] transition-all duration-300" :style="{ width: progressPercent + '%' }"></div>
        </div>

        <div class="flex items-center gap-3 min-w-0">
          <!-- 唱片/封面 -->
          <div class="relative size-10 flex-shrink-0 overflow-hidden rounded-full border border-white/10 shadow-md">
            <div
              v-if="audioPlayer.currentSong.albumCover"
              class="size-full bg-cover bg-center"
              :class="audioPlayer.isPlaying ? 'animate-cd-spin' : ''"
              :style="{ backgroundImage: `url(${audioPlayer.currentSong.albumCover})` }"
            ></div>
            <div
              v-else
              class="size-full flex items-center justify-center text-xs font-black text-white/50"
              :class="audioPlayer.isPlaying ? 'animate-cd-spin' : ''"
              :style="{ background: audioPlayer.currentSong.coverGradient }"
            >
              {{ audioPlayer.currentSong.title.substring(0, 1) }}
            </div>
          </div>

          <!-- 歌词/歌曲信息 -->
          <div class="flex flex-col text-left truncate">
            <span class="text-xs font-black text-white truncate group-hover:text-[#ff4f63] transition-colors">
              {{ audioPlayer.currentSong.title }}
            </span>
            <span class="text-[10px] text-white/40 font-bold mt-0.5 truncate">
              {{ audioPlayer.currentSong.singer }}
            </span>
          </div>
        </div>

        <!-- 右侧播控 -->
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <!-- 播放/暂停 -->
          <button
            @click="handlePlayToggle"
            class="size-8 rounded-full bg-[#ff4f63] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all focus:outline-none"
            :title="audioPlayer.isPlaying ? '暂停' : '播放'"
          >
            <span class="text-xs leading-none translate-y-[0.5px]" :class="audioPlayer.isPlaying ? '' : 'translate-x-[0.5px]'">
              {{ audioPlayer.isPlaying ? '⏸' : '▶' }}
            </span>
          </button>

          <!-- 下一首 -->
          <button
            @click="handleNextSong"
            class="text-white/40 hover:text-white transition-colors focus:outline-none"
            title="下一首"
          >
            <svg class="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18V6l8.5 6zm9-12h2v12h-2z" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 悬浮 Mini 播放器的过渡动画 */
.mini-player-enter-active,
.mini-player-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.mini-player-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.mini-player-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 黑胶唱片缓慢旋转动画 */
@keyframes cd-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-cd-spin {
  animation: cd-spin 12s linear infinite;
}
</style>
