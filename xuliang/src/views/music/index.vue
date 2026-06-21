<script setup>
import { ref, computed, watch, provide } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const route = useRoute();
const router = useRouter();

// 1. 响应式播放控制状态
const currentSong = ref(null); // 当前播放的歌曲
const isPlaying = ref(false); // 播放状态
const playProgressSeconds = ref(0); // 播放进度秒数
const isRandomPlay = ref(false); // 随机播放
const isLoopPlay = ref(false); // 单曲循环
const volume = ref(70); // 音量
const favoriteIds = ref(new Set(["01", "03"])); // 收藏的歌曲ID，默认收藏客官不可以和后会无期

// 歌曲数据源容器（父组件保留此引用以便于切歌时进行上一首/下一首计算）
const allSongs = ref([]);

// 2. 真实音频实例与事件监听管理
const audioRef = ref(null);

// 监听歌曲源变更
watch(
  () => currentSong.value?.audioUrl,
  (newUrl) => {
    if (!audioRef.value) return;
    if (newUrl) {
      audioRef.value.load();
      playProgressSeconds.value = 0;
      if (isPlaying.value) {
        audioRef.value.play().catch((err) => {
          console.warn("自动播放失败，可能由于浏览器安全策略限制，需用户主动交互:", err);
          isPlaying.value = false;
        });
      }
    } else {
      audioRef.value.pause();
      playProgressSeconds.value = 0;
    }
  }
);

// 监听音量改变并同步至 audio 实例
watch(
  volume,
  (newVol) => {
    if (audioRef.value) {
      audioRef.value.volume = newVol / 100;
    }
  },
  { immediate: true }
);

// 播放/暂停控制切换
const handlePlayToggle = () => {
  if (!currentSong.value || !audioRef.value) return;
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    audioRef.value.play().catch((err) => {
      console.warn("播放失败，可能由于浏览器安全策略限制，需用户主动交互:", err);
      isPlaying.value = false;
    });
  } else {
    audioRef.value.pause();
  }
};

// 双击或点击播放特定歌曲
const handlePlaySong = (song, songsList = []) => {
  // 如果传入了新的歌曲列表，保存下来用于切歌
  if (songsList && songsList.length > 0) {
    allSongs.value = songsList;
  }
  
  if (currentSong.value && currentSong.value.id === song.id) {
    handlePlayToggle();
  } else {
    currentSong.value = song;
    playProgressSeconds.value = 0;
    isPlaying.value = true;
  }
};

// 切换至下一首
const handleNextSong = () => {
  if (allSongs.value.length === 0) return;
  if (isRandomPlay.value) {
    const randomIndex = Math.floor(Math.random() * allSongs.value.length);
    currentSong.value = allSongs.value[randomIndex];
  } else {
    const currentIndex = currentSong.value
      ? allSongs.value.findIndex((s) => s.id === currentSong.value.id)
      : -1;
    const nextIndex = (currentIndex + 1) % allSongs.value.length;
    currentSong.value = allSongs.value[nextIndex];
  }
  playProgressSeconds.value = 0;
  isPlaying.value = true;
};

// 切换至上一首
const handlePrevSong = () => {
  if (allSongs.value.length === 0) return;
  const currentIndex = currentSong.value
    ? allSongs.value.findIndex((s) => s.id === currentSong.value.id)
    : -1;
  const prevIndex = (currentIndex - 1 + allSongs.value.length) % allSongs.value.length;
  currentSong.value = allSongs.value[prevIndex];
  playProgressSeconds.value = 0;
  isPlaying.value = true;
};

// 手动拖拽进度条控制
const handleProgressChange = (e) => {
  if (!currentSong.value || !audioRef.value) return;
  const percent = Number(e.target.value) / 100;
  const targetSeconds = Math.floor(percent * currentSong.value.durationSeconds);
  audioRef.value.currentTime = targetSeconds;
  playProgressSeconds.value = targetSeconds;
};

// 真实音频实例相关的事件监听回调
const onAudioTimeUpdate = () => {
  if (audioRef.value) {
    playProgressSeconds.value = Math.floor(audioRef.value.currentTime);
  }
};

const onAudioEnded = () => {
  if (isLoopPlay.value) {
    if (audioRef.value) {
      audioRef.value.currentTime = 0;
      audioRef.value.play().catch((err) => console.error(err));
    }
  } else {
    handleNextSong();
  }
};

const onAudioLoadedMetadata = () => {
  if (audioRef.value) {
    audioRef.value.volume = volume.value / 100;
  }
};

const handleFavoriteToggle = (id) => {
  if (favoriteIds.value.has(id)) {
    favoriteIds.value.delete(id);
    ElMessage.info("已取消收藏");
  } else {
    favoriteIds.value.add(id);
    ElMessage.success("已添加至收藏");
  }
};

// 格式化秒数为 MM:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// 计算当前的百分比进度
const currentProgressPercent = computed(() => {
  if (!currentSong.value) return 0;
  return (playProgressSeconds.value / currentSong.value.durationSeconds) * 100;
});

// 左侧菜单切换逻辑（路由跳转）
const selectCategory = (category) => {
  if (category === "专辑") {
    router.push({ name: "music-albums" });
  } else {
    router.push({ name: "music-songs", query: { category } });
  }
};

// 提供播控状态与收藏数据给所有的子路由组件 (songs.vue / albums.vue)
provide("player", {
  currentSong,
  isPlaying,
  favoriteIds,
  handlePlaySong: (song) => handlePlaySong(song, allSongs.value), // 传递时进行代理包装
  handleFavoriteToggle
});

// 监听子路由组件加载时暴露出的歌曲列表更新（便于在父容器中正确切歌）
const handleSongsUpdate = (songsList) => {
  allSongs.value = songsList;
};
</script>

<template>
  <section class="relative h-[calc(100vh-210px)] max-[620px]:h-[calc(100vh-200px)] w-full overflow-hidden bg-[#08090d] text-[#fff8ea] flex flex-col">
    <!-- 真实音频播放器 -->
    <audio
      ref="audioRef"
      :src="currentSong?.audioUrl"
      @timeupdate="onAudioTimeUpdate"
      @ended="onAudioEnded"
      @loadedmetadata="onAudioLoadedMetadata"
    ></audio>

    <!-- 背景流光氛围光斑 -->
    <div class="pointer-events-none absolute inset-0 z-0">
      <div class="absolute -left-20 bottom-1/4 h-[35vw] w-[35vw] rounded-full bg-[#ff4f63]/14 blur-[120px] max-[760px]:h-[60vw] max-[760px]:w-[60vw]"></div>
      <div class="absolute -right-20 top-20 h-[30vw] w-[30vw] rounded-full bg-[#36b0e6]/10 blur-[130px] max-[760px]:h-[50vw] max-[760px]:w-[50vw]"></div>
    </div>

    <div class="relative z-10 mx-auto w-full max-w-[1240px] px-8 pt-6 flex-1 flex flex-col min-h-0 max-[760px]:px-4">
      <!-- 顶部标题区 -->
      <header class="mb-6 shrink-0 text-left">
        <div class="flex items-baseline gap-3 max-[520px]:flex-col max-[520px]:gap-1">
          <h1 class="font-serif text-[42px] font-black tracking-normal text-[#fff8ea] m-0 leading-none">
            音乐作品
          </h1>
          <span class="font-serif text-2xl font-light italic text-[#ff4f63]/78 leading-none">
            Music Library
          </span>
        </div>
        <p class="mt-3 text-sm font-semibold text-[#fff8ea]/58 leading-relaxed max-w-[600px]">
          聆听徐良的音乐世界，感受每一个音符里的故事。
        </p>
      </header>

      <!-- 主框架布局：左侧菜单栏 + 右侧 router-view 展示区 -->
      <div class="grid grid-cols-[240px_1fr] gap-8 items-stretch flex-1 min-h-0 max-[980px]:grid-cols-1">
        <!-- 1. 左侧过滤侧边栏 -->
        <aside class="rounded-[22px] border border-white/10 bg-black/32 pt-5 px-5 pb-9 backdrop-blur-2xl h-full overflow-y-auto max-[980px]:hidden">
          <nav aria-label="音乐分类">
            <ul class="space-y-1.5 p-0 m-0 list-none">
              <!-- 全部作品 -->
              <li>
                <button
                  @click="selectCategory('全部作品')"
                  class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-black transition-all"
                  :class="
                    route.name === 'music-songs' && (!route.query.category || route.query.category === '全部作品')
                      ? 'bg-[#ff4f63] text-white shadow-[0_8px_20px_rgba(255,79,99,0.22)]'
                      : 'text-[#fff8ea]/62 hover:bg-white/5 hover:text-[#fff8ea]'
                  "
                >
                  <span class="flex items-center gap-3">
                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      />
                    </svg>
                    全部作品
                  </span>
                </button>
              </li>

              <!-- 专辑 -->
              <li>
                <button
                  @click="selectCategory('专辑')"
                  class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-black transition-all"
                  :class="
                    route.name === 'music-albums'
                      ? 'bg-[#ff4f63] text-white shadow-[0_8px_20px_rgba(255,79,99,0.22)]'
                      : 'text-[#fff8ea]/62 hover:bg-white/5 hover:text-[#fff8ea]'
                  "
                >
                  <span class="flex items-center gap-3">
                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    专辑
                  </span>
                </button>
              </li>

              <!-- MV -->
              <li>
                <button
                  @click="selectCategory('MV')"
                  class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-black transition-all"
                  :class="
                    route.name === 'music-songs' && route.query.category === 'MV'
                      ? 'bg-[#ff4f63] text-white shadow-[0_8px_20px_rgba(255,79,99,0.22)]'
                      : 'text-[#fff8ea]/62 hover:bg-white/5 hover:text-[#fff8ea]'
                  "
                >
                  <span class="flex items-center gap-3">
                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    MV
                  </span>
                </button>
              </li>
            </ul>

            <!-- 我的收藏 -->
            <div class="mt-6 border-t border-white/5 pt-5">
              <button
                @click="selectCategory('我的收藏')"
                class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-black transition-all"
                :class="
                  route.name === 'music-songs' && route.query.category === '我的收藏'
                    ? 'bg-[#ff4f63] text-white shadow-[0_8px_20px_rgba(255,79,99,0.22)]'
                    : 'text-[#fff8ea]/62 hover:bg-white/5 hover:text-[#fff8ea]'
                "
              >
                <span class="flex items-center gap-3">
                  <svg class="size-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  我的收藏
                </span>
              </button>
            </div>
          </nav>
        </aside>

        <!-- 2. 右侧主操作展示区（嵌套路由分发） -->
        <main class="h-full flex flex-col min-h-0">
          <router-view @update-songs="handleSongsUpdate" />
        </main>
      </div>
    </div>

    <!-- 3. 底部吸底核心播放器 -->
    <footer class="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/60 backdrop-blur-3xl px-8 py-4 shadow-[0_-15px_40px_rgba(0,0,0,0.48)] max-[760px]:px-4">
      <div class="mx-auto max-w-[1240px] grid grid-cols-[280px_1fr_240px] items-center gap-6 max-[880px]:grid-cols-[1fr_auto] max-[560px]:grid-cols-1">
        
        <!-- 左侧：正在播放的歌曲信息 -->
        <div class="flex items-center gap-4 max-[560px]:justify-center">
          <div
            class="size-12 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-md bg-cover bg-center overflow-hidden shrink-0"
            :style="currentSong?.albumCover ? { backgroundImage: `url(${currentSong.albumCover})` } : { background: currentSong?.coverGradient || 'linear-gradient(135deg, #1f2937, #111827)' }"
          >
            <span v-if="!currentSong?.albumCover">{{ (currentSong?.title || '-').substring(0, 1) }}</span>
          </div>
          <div class="overflow-hidden pr-2">
            <h4 class="m-0 text-sm font-black text-white truncate max-w-[150px]">
              {{ currentSong?.title || '-' }}
            </h4>
            <p class="m-0 mt-0.5 text-[11px] font-semibold text-white/48 truncate max-w-[150px]">
              {{ currentSong?.singer || '-' }}
            </p>
          </div>
          <button
            @click="currentSong && handleFavoriteToggle(currentSong.id)"
            class="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            :class="currentSong && favoriteIds.has(currentSong.id) ? 'text-[#ff4f63]' : 'text-white/20 hover:text-white/60'"
          >
            <svg class="size-4.5" :fill="currentSong && favoriteIds.has(currentSong.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        <!-- 中间：核心播放控制区 -->
        <div class="flex flex-col gap-2.5 max-[880px]:hidden">
          <!-- 上一首、播放、下一首等按钮 -->
          <div class="flex items-center justify-center gap-6">
            <!-- 随机播放 -->
            <button
              @click="isRandomPlay = !isRandomPlay"
              class="focus:outline-none transition-colors"
              :class="isRandomPlay ? 'text-[#ff4f63]' : 'text-white/38 hover:text-white'"
              title="随机播放"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <!-- 上一首 -->
            <button @click="handlePrevSong" class="text-white/58 hover:text-white transition-colors focus:outline-none" title="上一首">
              <svg class="size-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6L18 6v12z" />
              </svg>
            </button>

            <!-- 播放/暂停大红按钮 -->
            <button
              @click="handlePlayToggle"
              class="size-10 rounded-full bg-[#ff4f63] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(255,79,99,0.38)] hover:scale-105 active:scale-95 transition-all focus:outline-none"
              :title="isPlaying ? '暂停' : '播放'"
            >
              <span class="text-lg leading-none" :class="isPlaying ? '' : 'translate-x-[1px]'">
                {{ isPlaying ? "⏸" : "▶" }}
              </span>
            </button>

            <!-- 下一首 -->
            <button @click="handleNextSong" class="text-white/58 hover:text-white transition-colors focus:outline-none" title="下一首">
              <svg class="size-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18V6l8.5 6zm9-12h2v12h-2z" />
              </svg>
            </button>

            <!-- 循环播放 -->
            <button
              @click="isLoopPlay = !isLoopPlay"
              class="focus:outline-none transition-colors"
              :class="isLoopPlay ? 'text-[#ff4f63]' : 'text-white/38 hover:text-white'"
              title="单曲循环"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
              </svg>
            </button>
          </div>

          <!-- 时间轴进度条 -->
          <div class="flex items-center gap-3 w-full">
            <span class="text-[10px] font-semibold text-white/32 w-10 text-right">
              {{ formatTime(playProgressSeconds) }}
            </span>
            <div class="relative flex-grow h-1 flex items-center group/progress">
              <input
                type="range"
                min="0"
                max="100"
                :value="currentProgressPercent"
                @input="handleProgressChange"
                class="absolute inset-0 w-full h-1 opacity-0 cursor-pointer z-10"
              />
              <div class="w-full h-[3px] bg-white/10 rounded-full overflow-hidden transition-all group-hover/progress:h-1.5">
                <div class="h-full bg-[#ff4f63] rounded-full" :style="{ width: currentProgressPercent + '%' }"></div>
              </div>
              <div
                class="absolute size-2.5 rounded-full bg-[#ff4f63] shadow-md -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
                :style="{ left: currentProgressPercent + '%' }"
              ></div>
            </div>
            <span class="text-[10px] font-semibold text-white/32 w-10">
              {{ currentSong?.duration || '00:00' }}
            </span>
          </div>
        </div>

        <!-- 右侧：音量和控制项 -->
        <div class="flex items-center justify-end gap-5 max-[560px]:justify-center">
          <button
            @click="handlePlayToggle"
            class="hidden max-[880px]:flex size-8 rounded-full bg-[#ff4f63] text-white items-center justify-center focus:outline-none"
          >
            {{ isPlaying ? "⏸" : "▶" }}
          </button>

          <!-- 音量控制 -->
          <div class="flex items-center gap-2 group/volume max-[560px]:hidden">
            <svg class="size-4 text-white/38 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <div class="w-16 h-1 flex items-center relative cursor-pointer">
              <input
                type="range"
                min="0"
                max="100"
                v-model="volume"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div class="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-white/60" :style="{ width: volume + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 播放队列 -->
          <button class="text-white/38 hover:text-white focus:outline-none" title="播放队列">
            <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h12" />
            </svg>
          </button>
        </div>

      </div>
    </footer>
  </section>
</template>

<style scoped>
@keyframes jump {
  0%, 100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}

.animate-pulse {
  animation: jump 0.6s ease-in-out infinite;
  transform-origin: bottom;
}

.animate-pulse:nth-child(2) {
  animation-delay: 0.15s;
}

.animate-pulse:nth-child(3) {
  animation-delay: 0.3s;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1px;
  height: 1px;
}
</style>
