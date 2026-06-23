<script setup>
import { ref, computed, watch, provide } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { audioPlayer } from "../../utils/audioPlayer";
import {
  Headset,
  Folder,
  VideoCamera,
  Star,
  StarFilled,
  Switch,
  CaretLeft,
  CaretRight,
  VideoPlay,
  VideoPause,
  Refresh,
  Mute,
  List
} from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

// 1. 映射全局播放器状态
const currentSong = computed(() => audioPlayer.currentSong);
const isPlaying = computed(() => audioPlayer.isPlaying);
const playProgressSeconds = computed(() => audioPlayer.playProgressSeconds);
const favoriteIds = ref(new Set(["01", "03"])); // 收藏的歌曲ID，默认收藏客官不可以和后会无期

const isRandomPlay = computed({
  get: () => audioPlayer.isRandomPlay,
  set: (val) => { audioPlayer.isRandomPlay = val; }
});
const isLoopPlay = computed({
  get: () => audioPlayer.isLoopPlay,
  set: (val) => { audioPlayer.isLoopPlay = val; }
});
const volume = computed({
  get: () => audioPlayer.volume,
  set: (val) => audioPlayer.setVolume(val)
});

const allSongs = computed({
  get: () => audioPlayer.allSongs,
  set: (val) => { audioPlayer.allSongs = val; }
});

// 全局播放进度条的双向计算属性（Element Plus el-slider 专用）
const currentProgressPercentComputed = computed({
  get: () => {
    if (!currentSong.value) return 0;
    return (playProgressSeconds.value / currentSong.value.durationSeconds) * 100;
  },
  set: (val) => {
    audioPlayer.setProgress(val);
  }
});

// 2. 播控方法映射
const handlePlayToggle = () => {
  audioPlayer.toggle();
};

const handlePlaySong = (song, songsList = []) => {
  audioPlayer.playSong(song, songsList);
};

const handleNextSong = () => {
  audioPlayer.next();
};

const handlePrevSong = () => {
  audioPlayer.prev();
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

// 计算当前的百分比进度 (仅保留渲染参考)
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
    <!-- 真实音频播放器已转移至全局的 audioPlayer 单例中管理 -->

    <!-- 背景流光氛围光斑 -->
    <div class="pointer-events-none absolute inset-0 z-0">
      <div class="absolute -left-20 bottom-1/4 h-[35vw] w-[35vw] rounded-full bg-[#ff4f63]/14 blur-[120px] max-[760px]:h-[60vw] max-[760px]:w-[60vw]"></div>
      <div class="absolute -right-20 top-20 h-[30vw] w-[30vw] rounded-full bg-[#36b0e6]/10 blur-[130px] max-[760px]:h-[50vw] max-[560px]:w-[50vw]"></div>
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
                <el-button
                  @click="selectCategory('全部作品')"
                  class="!flex !w-full !items-center !justify-start !rounded-xl !px-4 !py-3 !text-sm !font-black !transition-all !border-none !h-auto"
                  :class="
                    route.name === 'music-songs' && (!route.query.category || route.query.category === '全部作品')
                      ? '!bg-[#ff4f63] !text-white shadow-[0_8px_20px_rgba(255,79,99,0.22)]'
                      : '!bg-transparent !text-[#fff8ea]/62 hover:!bg-white/5 hover:!text-[#fff8ea]'
                  "
                >
                  <el-icon class="mr-3" size="16"><Headset /></el-icon>
                  全部作品
                </el-button>
              </li>

              <!-- 专辑 -->
              <li>
                <el-button
                  @click="selectCategory('专辑')"
                  class="!flex !w-full !items-center !justify-start !rounded-xl !px-4 !py-3 !text-sm !font-black !transition-all !border-none !h-auto"
                  :class="
                    route.name === 'music-albums'
                      ? '!bg-[#ff4f63] !text-white shadow-[0_8px_20px_rgba(255,79,99,0.22)]'
                      : '!bg-transparent !text-[#fff8ea]/62 hover:!bg-white/5 hover:!text-[#fff8ea]'
                  "
                >
                  <el-icon class="mr-3" size="16"><Folder /></el-icon>
                  专辑
                </el-button>
              </li>

              <!-- MV -->
              <li>
                <el-button
                  @click="selectCategory('MV')"
                  class="!flex !w-full !items-center !justify-start !rounded-xl !px-4 !py-3 !text-sm !font-black !transition-all !border-none !h-auto"
                  :class="
                    route.name === 'music-songs' && route.query.category === 'MV'
                      ? '!bg-[#ff4f63] !text-white shadow-[0_8px_20px_rgba(255,79,99,0.22)]'
                      : '!bg-transparent !text-[#fff8ea]/62 hover:!bg-white/5 hover:!text-[#fff8ea]'
                  "
                >
                  <el-icon class="mr-3" size="16"><VideoCamera /></el-icon>
                  MV
                </el-button>
              </li>
            </ul>

            <!-- 我的收藏 -->
            <div class="mt-6 border-t border-white/5 pt-5">
              <el-button
                @click="selectCategory('我的收藏')"
                class="!flex !w-full !items-center !justify-start !rounded-xl !px-4 !py-3 !text-sm !font-black !transition-all !border-none !h-auto"
                :class="
                  route.name === 'music-songs' && route.query.category === '我的收藏'
                    ? '!bg-[#ff4f63] !text-white shadow-[0_8px_20px_rgba(255,79,99,0.22)]'
                    : '!bg-transparent !text-[#fff8ea]/62 hover:!bg-white/5 hover:!text-[#fff8ea]'
                "
              >
                <el-icon class="mr-3" size="16"><StarFilled /></el-icon>
                我的收藏
              </el-button>
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
          <el-button
            link
            @click="currentSong && handleFavoriteToggle(currentSong.id)"
            class="!p-0 hover:scale-110 active:scale-95 transition-transform"
            :class="currentSong && favoriteIds.has(currentSong.id) ? '!text-[#ff4f63]' : '!text-white/20 hover:!text-white/60'"
          >
            <el-icon size="18">
              <component :is="currentSong && favoriteIds.has(currentSong.id) ? StarFilled : Star" />
            </el-icon>
          </el-button>
        </div>

        <!-- 中间：核心播放控制区 -->
        <div class="flex flex-col gap-2.5 max-[880px]:hidden">
          <!-- 上一首、播放、下一首等按钮 -->
          <div class="flex items-center justify-center gap-6">
            <!-- 随机播放 -->
            <el-button
              link
              @click="isRandomPlay = !isRandomPlay"
              class="transition-colors"
              :class="isRandomPlay ? '!text-[#ff4f63]' : '!text-white/38 hover:!text-white'"
              title="随机播放"
            >
              <el-icon size="16"><Switch /></el-icon>
            </el-button>

            <!-- 上一首 -->
            <el-button
              link
              @click="handlePrevSong"
              class="!text-white/58 hover:!text-white transition-colors"
              title="上一首"
            >
              <el-icon size="18"><CaretLeft /></el-icon>
            </el-button>

            <!-- 播放/暂停大红按钮 -->
            <el-button
              circle
              @click="handlePlayToggle"
              class="!size-10 !bg-[#ff4f63] !border-none !text-white flex items-center justify-center shadow-[0_4px_16px_rgba(255,79,99,0.38)] hover:scale-105 active:scale-95 transition-all"
              :title="isPlaying ? '暂停' : '播放'"
            >
              <el-icon size="16">
                <component :is="isPlaying ? VideoPause : VideoPlay" />
              </el-icon>
            </el-button>

            <!-- 下一首 -->
            <el-button
              link
              @click="handleNextSong"
              class="!text-white/58 hover:!text-white transition-colors"
              title="下一首"
            >
              <el-icon size="18"><CaretRight /></el-icon>
            </el-button>

            <!-- 循环播放 -->
            <el-button
              link
              @click="isLoopPlay = !isLoopPlay"
              class="transition-colors"
              :class="isLoopPlay ? '!text-[#ff4f63]' : '!text-white/38 hover:!text-white'"
              title="单曲循环"
            >
              <el-icon size="16"><Refresh /></el-icon>
            </el-button>
          </div>

          <!-- 时间轴进度条 -->
          <div class="flex items-center gap-3 w-full">
            <span class="text-[10px] font-semibold text-white/32 w-10 text-right">
              {{ formatTime(playProgressSeconds) }}
            </span>
            <el-slider
              v-model="currentProgressPercentComputed"
              :show-tooltip="false"
              class="custom-progress-slider flex-grow"
            />
            <span class="text-[10px] font-semibold text-white/32 w-10">
              {{ currentSong?.duration || '00:00' }}
            </span>
          </div>
        </div>

        <!-- 右侧：音量和控制项 -->
        <div class="flex items-center justify-end gap-5 max-[560px]:justify-center">
          <el-button
            circle
            @click="handlePlayToggle"
            class="!hidden max-[880px]:!flex !size-8 !bg-[#ff4f63] !border-none !text-white flex items-center justify-center"
          >
            <el-icon size="12">
              <component :is="isPlaying ? VideoPause : VideoPlay" />
            </el-icon>
          </el-button>

          <!-- 音量控制 -->
          <div class="flex items-center gap-2 max-[560px]:hidden">
            <el-icon class="text-white/38 hover:text-white cursor-pointer" size="16">
              <Mute />
            </el-icon>
            <el-slider
              v-model="volume"
              :show-tooltip="false"
              class="custom-volume-slider !w-16"
            />
          </div>

          <!-- 播放队列 -->
          <el-button
            link
            class="!text-white/38 hover:!text-white"
            title="播放队列"
          >
            <el-icon size="18"><List /></el-icon>
          </el-button>
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

/* 深度覆盖 Element Plus Slider 样式以契合暗黑磨砂玻璃的红黑质感 */
:deep(.el-slider) {
  --el-slider-main-bg-color: #ff4f63 !important;
  --el-slider-runway-bg-color: rgba(255, 255, 255, 0.08) !important;
  --el-slider-stop-bg-color: rgba(255, 255, 255, 0.15) !important;
}

/* 进度滑块自定义 */
:deep(.custom-progress-slider) {
  --el-slider-height: 3px !important;
  --el-slider-button-size: 8px !important;
}

:deep(.custom-progress-slider:hover) {
  --el-slider-height: 5px !important;
}

/* 进度小滑块默认隐藏，Hover时显现，符合高级播放器细节 */
:deep(.custom-progress-slider .el-slider__button) {
  background-color: #ff4f63 !important;
  border: none !important;
  box-shadow: 0 0 6px rgba(255, 79, 99, 0.8) !important;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

:deep(.custom-progress-slider:hover .el-slider__button) {
  opacity: 1;
}

/* 音量滑块自定义 */
:deep(.custom-volume-slider) {
  --el-slider-main-bg-color: rgba(255, 255, 255, 0.6) !important;
  --el-slider-height: 3px !important;
  --el-slider-button-size: 6px !important;
}

:deep(.custom-volume-slider .el-slider__button) {
  background-color: rgba(255, 255, 255, 0.9) !important;
  border: none !important;
  box-shadow: none !important;
  opacity: 1 !important;
}

/* 强行纠正所有滑块按钮在其直接容器（轨道）中的几何中心对齐，解决小数像素精度引起的偏移 */
:deep(.el-slider__button-wrapper) {
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
  line-height: normal !important;
}
</style>
