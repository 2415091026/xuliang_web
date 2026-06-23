<script setup>
import { ref, computed, onMounted, watch, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { getMusicListApi } from "../../api/music";
import { audioPlayer } from "../../utils/audioPlayer";

const route = useRoute();
const router = useRouter();

// 从父组件注入共享的播放器状态与方法
const {
  currentSong,
  isPlaying,
  favoriteIds,
  handlePlaySong,
  handleFavoriteToggle
} = inject("player");

// 1. 响应式歌曲列表数据源与分页状态
const originalSongs = ref([]);
const pageNum = ref(1);
const pageSize = ref(10);
const totalSongs = ref(0);

// 从路由参数中计算当前所属的分类（默认是全部作品，由侧边栏路由驱动）
const activeCategory = computed(() => route.query.category || "全部作品");

// 交互过滤与排序状态
const activeGenre = ref(""); // 过滤流派：流行 POP / 说唱 RAP / 民谣 FOLK / 电子 ELECTRONIC
const activeSort = ref("最新发布"); // 排序页签：最新发布 / 最多播放 / A-Z
const searchQuery = ref(""); // 搜索词
const viewMode = ref("list"); // 视图模式: list / grid

// 接口数据到播放器数据格式的转换映射器 (Mapper)
const mapBackendSong = (song) => {
  const durationSec = Math.floor((song.durationMs || 0) / 1000);
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const durationStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  let releaseStr = "-";
  if (song.releaseDate) {
    try {
      releaseStr = new Date(song.releaseDate).toISOString().split("T")[0];
    } catch (e) {
      releaseStr = String(song.releaseDate).substring(0, 10);
    }
  }

  let type = "专辑";
  if (song.mvUrl) {
    type = "MV";
  }

  let singer = "徐良";
  if (song.name === "客官不可以") singer = "徐良 / 小凌";
  if (song.name === "犯贱") singer = "徐良 / 阿悄";
  if (song.name === "后会无期") singer = "徐良 / 汪苏泷";
  if (song.name === "在回忆中等你") singer = "徐良 / 连诗雅";

  const gradients = [
    "linear-gradient(135deg, #ff4f63, #6e315f)",
    "linear-gradient(135deg, #36b0e6, #1e4580)",
    "linear-gradient(135deg, #f2b84b, #8a531e)",
    "linear-gradient(135deg, #a855f7, #581c87)",
    "linear-gradient(135deg, #10b981, #065f46)",
    "linear-gradient(135deg, #ec4899, #9d174d)",
    "linear-gradient(135deg, #f97316, #9a3412)",
    "linear-gradient(135deg, #64748b, #334155)"
  ];
  const hash = Number(song.songId) % gradients.length;
  const coverGradient = gradients[isNaN(hash) ? 0 : hash];

  return {
    id: String(song.songId),
    title: song.name,
    singer: singer,
    album: song.albumName || "-",
    duration: durationStr,
    durationSeconds: durationSec,
    releaseDate: releaseStr,
    type: type,
    genre: "流行 POP",
    coverGradient: coverGradient,
    audioUrl: song.audioUrl,
    mvUrl: song.mvUrl,
    albumCover: song.albumCover
  };
};

// 异步加载音乐列表方法
const fetchSongs = async () => {
  try {
    const params = {
      pageSize: pageSize.value,
      pageNum: pageNum.value
    };

    if (searchQuery.value.trim()) {
      params.name = searchQuery.value.trim();
    }

    if (route.query.albumId) {
      params.albumId = route.query.albumId;
    } else if (route.query.albumName) {
      params.albumName = route.query.albumName;
    }

    const res = await getMusicListApi(params);
    const rawList = res.data?.list || res.list || [];
    originalSongs.value = rawList.map(mapBackendSong);
    totalSongs.value = res.data?.total || res.total || 0;

    // 联动自动播放逻辑，触发首次挂载自动播放
    if (route.query.autoPlay === "1" && originalSongs.value.length > 0) {
      handlePlaySong(originalSongs.value[0]);
      router.replace({ name: "music-songs", query: { ...route.query, autoPlay: undefined } });
    }
  } catch (e) {
    ElMessage.error("获取歌曲列表失败，请稍后重试");
    console.error("加载歌曲列表发生异常：", e);
  }
};

// 歌曲数据过滤和排序逻辑
const filteredSongs = computed(() => {
  let list = [...originalSongs.value];

  // 分类过滤（我的收藏/MV/全部）
  if (activeCategory.value === "我的收藏") {
    list = list.filter((song) => favoriteIds.value.has(song.id));
  } else if (activeCategory.value !== "全部作品" && activeCategory.value !== "专辑") {
    list = list.filter((song) => song.type === activeCategory.value);
  }

  // 流派过滤
  if (activeGenre.value) {
    list = list.filter((song) => song.genre === activeGenre.value);
  }

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    list = list.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.album.toLowerCase().includes(query) ||
        song.singer.toLowerCase().includes(query)
    );
  }

  // 排序
  if (activeSort.value === "最新发布") {
    list.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  } else if (activeSort.value === "最多播放") {
    list.sort((a, b) => Number(a.id) - Number(b.id));
  } else if (activeSort.value === "A-Z") {
    list.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
  }

  return list;
});

// 清除专辑过滤
const clearAlbumFilter = () => {
  router.push({ name: "music-songs" });
};

// 分页辅助计算与控制方法
const totalPages = computed(() => {
  return Math.ceil(totalSongs.value / pageSize.value) || 1;
});

const visiblePages = computed(() => {
  const pages = [];
  const maxButtons = 5;
  let start = Math.max(1, pageNum.value - 2);
  let end = Math.min(totalPages.value, start + maxButtons - 1);

  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const handlePrevPage = () => {
  if (pageNum.value > 1) {
    pageNum.value--;
    fetchSongs();
  }
};

const handleNextPage = () => {
  if (pageNum.value < totalPages.value) {
    pageNum.value++;
    fetchSongs();
  }
};

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== pageNum.value) {
    pageNum.value = page;
    fetchSongs();
  }
};

// 监听路由参数变化，触发重新加载
watch(
  () => route.query,
  () => {
    pageNum.value = 1;
    fetchSongs();
  },
  { deep: true }
);

// 监听流派和搜索词，触发第一页加载
watch([activeGenre, searchQuery], () => {
  pageNum.value = 1;
  fetchSongs();
});

// 实时同步当前板块排序、筛选后的歌曲列表至全局播放器队列，解决切歌及自动下一首的数据同步问题
watch(
  filteredSongs,
  (newSongs) => {
    audioPlayer.allSongs = newSongs;
  },
  { immediate: true }
);

onMounted(() => {
  fetchSongs();
});
</script>

<template>
  <div class="h-full flex flex-col min-h-0">
    <!-- 专辑筛选提示条 -->
    <div
      v-if="route.query.albumName"
      class="mb-4 shrink-0 flex items-center justify-between rounded-xl border border-[#ff4f63]/24 bg-[#ff4f63]/6 px-4 py-2.5 backdrop-blur-xl text-xs font-semibold"
    >
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full bg-[#ff4f63] animate-pulse"></span>
        <span>当前正在播放/浏览专辑：<strong class="text-white font-black">《{{ route.query.albumName }}》</strong></span>
      </div>
      <button
        @click="clearAlbumFilter"
        class="rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] font-black text-[#fff8ea]/82 hover:text-white transition cursor-pointer"
      >
        清除筛选，显示全部
      </button>
    </div>

    <!-- 筛选和搜索头 -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
      <!-- 播控标签 -->
      <div class="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/24 p-1 backdrop-blur-xl">
        <button
          v-for="sort in ['最新发布', '最多播放', 'A-Z']"
          :key="sort"
          @click="activeSort = sort"
          class="rounded-full px-4 py-2 text-xs font-black transition-all duration-200"
          :class="
            activeSort === sort
              ? 'bg-[#ff4f63] text-white shadow-[0_4px_12px_rgba(255,79,99,0.18)]'
              : 'text-[#fff8ea]/52 hover:text-[#fff8ea]'
          "
        >
          {{ sort }}
        </button>
      </div>

      <!-- 搜索框与视图切换 -->
      <div class="flex items-center gap-3 max-[520px]:w-full">
        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索歌曲 / 专辑"
          class="custom-search-input max-[520px]:!w-full"
          clearable
        >
          <template #prefix>
            <el-icon class="text-[#fff8ea]/28"><Search /></el-icon>
          </template>
        </el-input>

        <!-- 切换列表/网格视图按钮 -->
        <div class="flex items-center rounded-lg border border-white/10 bg-black/24 p-0.5 backdrop-blur-xl">
          <button
            @click="viewMode = 'list'"
            class="rounded p-1.5 transition-colors"
            :class="viewMode === 'list' ? 'bg-white/10 text-white' : 'text-[#fff8ea]/38 hover:text-[#fff8ea]'"
            aria-label="列表视图"
          >
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <button
            @click="viewMode = 'grid'"
            class="rounded p-1.5 transition-colors"
            :class="viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-[#fff8ea]/38 hover:text-[#fff8ea]'"
            aria-label="网格视图"
          >
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 2.1 列表展示模式 -->
    <div v-if="viewMode === 'list'" class="flex-1 overflow-y-auto rounded-[22px] border border-white/10 bg-black/20 backdrop-blur-2xl min-h-0">
      <table class="w-full min-w-[680px] border-collapse text-left text-xs font-bold text-[#fff8ea]/48">
        <thead>
          <tr class="border-b border-white/5 sticky top-0 bg-black/60 backdrop-blur-md z-10">
            <th class="px-6 py-4 w-12 text-center font-black">#</th>
            <th class="px-6 py-4 font-black">歌曲</th>
            <th class="px-6 py-4 font-black">专辑</th>
            <th class="px-6 py-4 w-20 font-black">时长</th>
            <th class="px-6 py-4 w-24 text-center font-black">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(song, idx) in filteredSongs"
            :key="song.id"
            @dblclick="handlePlaySong(song)"
            class="group border-b border-white/5 transition hover:bg-white/[0.03] cursor-pointer"
            :class="currentSong?.id === song.id ? 'text-[#ff4f63]' : 'text-[#fff8ea]/80'"
          >
            <!-- 序列号 / 播放动效 -->
            <td class="px-6 py-4 text-center">
              <span v-if="currentSong?.id === song.id && isPlaying" class="flex justify-center items-end gap-0.5 h-3.5">
                <span class="w-0.5 bg-[#ff4f63] animate-pulse h-full"></span>
                <span class="w-0.5 bg-[#ff4f63] animate-pulse h-1/2"></span>
                <span class="w-0.5 bg-[#ff4f63] animate-pulse h-2/3"></span>
              </span>
              <span v-else class="group-hover:hidden font-black">{{ String(idx + 1).padStart(2, "0") }}</span>
              <!-- 悬浮播放按钮 -->
              <button
                v-if="currentSong?.id !== song.id || !isPlaying"
                @click="handlePlaySong(song)"
                class="hidden group-hover:inline-block text-[#ff4f63] hover:scale-110 active:scale-95 transition focus:outline-none"
                title="播放"
              >
                ▶
              </button>
            </td>

            <!-- 歌曲标题与封面 -->
            <td class="px-6 py-4 font-black text-[#fff8ea]">
              <div class="flex items-center gap-3">
                <div
                  class="size-9 rounded-md flex items-center justify-center text-[10px] font-black text-white bg-cover bg-center overflow-hidden shrink-0 shadow"
                  :style="song.albumCover ? { backgroundImage: `url(${song.albumCover})` } : { background: song.coverGradient }"
                >
                  <span v-if="!song.albumCover">{{ song.title.substring(0, 1) }}</span>
                </div>
                <div class="truncate max-w-[200px]">
                  <span class="block text-sm truncate" :class="currentSong?.id === song.id ? 'text-[#ff4f63]' : 'text-white'" :title="song.title">
                    {{ song.title }}
                  </span>
                  <span class="mt-1 block text-[10px] text-[#fff8ea]/38 font-semibold truncate">{{ song.singer }}</span>
                </div>
              </div>
            </td>

            <!-- 所属专辑 -->
            <td class="px-6 py-4 text-sm text-[#fff8ea]/68 font-bold truncate max-w-[150px]" :title="song.album">
              {{ song.album }}
            </td>

            <!-- 歌曲时长 -->
            <td class="px-6 py-4 text-sm text-[#fff8ea]/42 font-semibold">
              {{ song.duration }}
            </td>

            <!-- 列表操作 -->
            <td class="px-6 py-4 text-center">
              <div class="flex items-center justify-center gap-4 text-[#fff8ea]/32">
                <!-- 喜欢/收藏 -->
                <button
                  @click.stop="handleFavoriteToggle(song.id)"
                  class="transition hover:text-[#ff4f63] hover:scale-110 active:scale-95 focus:outline-none"
                  :class="favoriteIds.has(song.id) ? 'text-[#ff4f63]' : ''"
                  title="收藏"
                >
                  <svg class="size-4" :fill="favoriteIds.has(song.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>

                <!-- MV 标记 -->
                <a
                  v-if="song.mvUrl"
                  :href="song.mvUrl"
                  target="_blank"
                  class="transition hover:text-white"
                  title="观看 MV"
                >
                  <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空白占位 -->
      <div v-if="filteredSongs.length === 0" class="py-24 text-center text-[#fff8ea]/38 font-black">
        - 暂无符合条件的音乐作品 -
      </div>
    </div>

    <!-- 2.2 网格展示模式 -->
    <div v-else-if="viewMode === 'grid'" class="flex-1 overflow-y-auto min-h-0 pr-1.5 pb-6">
      <div class="grid grid-cols-4 gap-6 max-[1120px]:grid-cols-3 max-[760px]:grid-cols-2 max-[480px]:grid-cols-1">
        <div
          v-for="song in filteredSongs"
          :key="song.id"
          @dblclick="handlePlaySong(song)"
          class="group relative flex flex-col rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-2xl transition-all duration-300 hover:border-[#ff4f63]/32 hover:bg-white/[0.02] cursor-pointer shadow-lg"
        >
          <!-- 封面图及悬浮遮罩 -->
          <div class="relative aspect-square w-full rounded-xl overflow-hidden shadow-md shrink-0">
            <div
              v-if="song.albumCover"
              class="size-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              :style="{ backgroundImage: `url(${song.albumCover})` }"
            ></div>
            <div
              v-else
              class="size-full flex items-center justify-center text-3xl font-black text-white/50"
              :style="{ background: song.coverGradient }"
            >
              {{ song.title.substring(0, 1) }}
            </div>

            <!-- 悬浮播放专辑遮罩 -->
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300">
              <button
                @click.stop="handlePlaySong(song)"
                class="size-10 rounded-full bg-[#ff4f63] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                :title="currentSong?.id === song.id && isPlaying ? '暂停' : '播放'"
              >
                <span class="text-base leading-none translate-x-[1px]">
                  {{ currentSong?.id === song.id && isPlaying ? "⏸" : "▶" }}
                </span>
              </button>
            </div>
          </div>

          <!-- 歌曲描述 -->
          <div class="mt-4 flex flex-col flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="m-0 text-sm font-black transition-colors" :class="currentSong?.id === song.id ? 'text-[#ff4f63]' : 'text-[#fff8ea] group-hover:text-white'" :title="song.title">
                  {{ song.title }}
                </h4>
                <p class="mt-1 mb-0 text-xs font-semibold text-[#fff8ea]/42">
                  {{ song.singer }}
                </p>
              </div>
              <button
                @click.stop="handleFavoriteToggle(song.id)"
                class="focus:outline-none"
                :class="favoriteIds.has(song.id) ? 'text-[#ff4f63]' : 'text-[#fff8ea]/20'"
              >
                <svg class="size-4" :fill="favoriteIds.has(song.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>

            <!-- 悬浮播放频谱条 -->
            <div
              v-if="currentSong?.id === song.id && isPlaying"
              class="absolute top-6 right-6 flex items-end gap-0.5 h-4 bg-black/40 px-2 py-1 rounded-full backdrop-blur-md"
            >
              <span class="w-0.5 bg-[#ff4f63] animate-pulse h-full"></span>
              <span class="w-0.5 bg-[#ff4f63] animate-pulse h-1/2"></span>
              <span class="w-0.5 bg-[#ff4f63] animate-pulse h-2/3"></span>
            </div>
          </div>

          <!-- 缺省状态 -->
          <div v-if="filteredSongs.length === 0" class="col-span-full py-16 text-center text-[#fff8ea]/38 font-black">
            - 暂无符合条件的音乐作品 -
          </div>
        </div>
      </div>
    </div>

    <!-- 精美暗黑毛玻璃分页器 -->
    <div v-if="totalSongs > 0" class="mt-4 shrink-0 flex items-center justify-between text-xs text-[#fff8ea]/48 font-bold max-[620px]:flex-col max-[620px]:gap-3 max-[620px]:items-center">
      <!-- 左侧：数量信息 -->
      <div>
        共 <span class="text-[#ff4f63] font-black">{{ totalSongs }}</span> 首歌曲
        <span class="mx-2 text-white/10">|</span>
        当前第 <span class="text-white font-black">{{ pageNum }}</span> / {{ totalPages }} 页
      </div>

      <!-- 右侧：控制按钮 -->
      <div class="flex items-center gap-1.5">
        <!-- 上一页 -->
        <button
          @click="handlePrevPage"
          :disabled="pageNum === 1"
          class="flex size-7 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-[#fff8ea]/60 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20 cursor-pointer"
          title="上一页"
        >
          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- 页码数字 -->
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="handlePageChange(page)"
          class="flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-black transition-all cursor-pointer"
          :class="
            pageNum === page
              ? 'bg-[#ff4f63] text-white shadow-[0_4px_12px_rgba(255,79,99,0.22)]'
              : 'border border-white/5 bg-white/[0.02] text-[#fff8ea]/60 hover:bg-white/10 hover:text-white'
          "
        >
          {{ page }}
        </button>

        <!-- 下一页 -->
        <button
          @click="handleNextPage"
          :disabled="pageNum === totalPages"
          class="flex size-7 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-[#fff8ea]/60 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20 cursor-pointer"
          title="下一页"
        >
          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 深度覆盖 Element Plus Input 样式以契合暗黑风格 */
.custom-search-input {
  width: 13rem;
  transition: all 0.3s ease;
}

.custom-search-input:focus-within {
  width: 15rem;
}

:deep(.custom-search-input .el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.32) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: none !important;
  border-radius: 9999px !important;
  height: 36px !important;
  padding-left: 12px !important;
  padding-right: 12px !important;
  transition: all 0.3s ease;
}

:deep(.custom-search-input .el-input__wrapper.is-focus) {
  border-color: rgba(255, 79, 99, 0.52) !important;
  background-color: rgba(0, 0, 0, 0.48) !important;
}

:deep(.custom-search-input .el-input__inner) {
  color: #fff8ea !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

:deep(.custom-search-input .el-input__inner::placeholder) {
  color: rgba(255, 248, 234, 0.24) !important;
}
</style>
