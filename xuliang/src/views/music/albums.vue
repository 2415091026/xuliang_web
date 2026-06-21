<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getAlbumListApi } from "../../api/music";

const router = useRouter();

// 1. 响应式状态管理
const albums = ref([]);
const pageNum = ref(1);
const pageSize = ref(6); // 保持双排三列，共6张卡片
const totalAlbums = ref(0);

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch (e) {
    return String(dateStr).substring(0, 10);
  }
};

// 2. 异步加载数据
const fetchAlbums = async () => {
  try {
    const res = await getAlbumListApi({
      pageSize: pageSize.value,
      pageNum: pageNum.value
    });
    const rawList = res.data?.list || res.list || [];
    albums.value = rawList;
    totalAlbums.value = res.data?.total || res.total || 0;
  } catch (e) {
    ElMessage.error("获取专辑列表失败，请稍后重试");
    console.error("加载专辑列表发生异常：", e);
  }
};

// 3. 分页逻辑
const totalPages = computed(() => {
  return Math.ceil(totalAlbums.value / pageSize.value) || 1;
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
    fetchAlbums();
  }
};

const handleNextPage = () => {
  if (pageNum.value < totalPages.value) {
    pageNum.value++;
    fetchAlbums();
  }
};

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== pageNum.value) {
    pageNum.value = page;
    fetchAlbums();
  }
};

// 4. 跳转与播放参数联动（解耦路由跳转）
const viewAlbumSongsLocally = (album, autoPlay = false) => {
  router.push({
    name: "music-songs",
    query: {
      albumId: album.neteaseAlbumId,
      albumName: album.name,
      autoPlay: autoPlay ? "1" : "0"
    }
  });
};

// 哈希随机封面渐变退避 (与歌曲同步，以防无封面图时依然华丽)
const getFallbackGradient = (id) => {
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
  const hash = Number(id) % gradients.length;
  return gradients[isNaN(hash) ? 0 : hash];
};

onMounted(() => {
  fetchAlbums();
});
</script>

<template>
  <div class="h-full flex flex-col min-h-0">
    <!-- 专辑卡片网格列表容器 -->
    <div class="flex-1 overflow-y-auto min-h-0 pr-1.5 pb-6">
      <div class="grid grid-cols-3 gap-6 max-[1120px]:grid-cols-2 max-[620px]:grid-cols-1">
        <div
          v-for="album in albums"
          :key="album.albumId"
          @dblclick="viewAlbumSongsLocally(album, true)"
          class="group relative flex flex-col rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-2xl transition-all duration-300 hover:border-[#ff4f63]/32 hover:bg-white/[0.02] cursor-pointer shadow-lg"
        >
          <!-- 专辑封面 -->
          <div class="relative aspect-square w-full rounded-xl overflow-hidden shadow-md shrink-0">
            <div
              v-if="album.picUrl"
              class="size-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              :style="{ backgroundImage: `url(${album.picUrl})` }"
            ></div>
            <div
              v-else
              class="size-full flex items-center justify-center text-3xl font-black text-white/50"
              :style="{ background: getFallbackGradient(album.albumId) }"
            >
              💿
            </div>

            <!-- 悬浮播放专辑遮罩 -->
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300">
              <button
                @click.stop="viewAlbumSongsLocally(album, false)"
                class="h-9 rounded-full border border-white/20 bg-white/10 px-4 text-xs font-black text-white backdrop-blur-md hover:bg-[#ff4f63] hover:border-transparent transition-all shadow"
              >
                查看曲目
              </button>
              <button
                @click.stop="viewAlbumSongsLocally(album, true)"
                class="size-9 rounded-full bg-[#ff4f63] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                title="立即播放整张专辑"
              >
                <span class="text-sm leading-none translate-x-[1px]">▶</span>
              </button>
            </div>
          </div>

          <!-- 专辑描述 -->
          <div class="mt-4 flex flex-col flex-1 min-w-0">
            <h4 class="m-0 text-sm font-black text-[#fff8ea] group-hover:text-white truncate" :title="album.name">
              {{ album.name }}
            </h4>
            <p class="mt-1.5 mb-0 text-[11px] font-semibold text-[#fff8ea]/42 flex items-center justify-between">
              <span>{{ album.artistName || "徐良" }}</span>
              <span>{{ album.size || "-" }} 首歌曲</span>
            </p>
            
            <!-- 简短说明 -->
            <p class="mt-3 text-xs font-semibold text-[#fff8ea]/52 leading-relaxed flex-1 line-clamp-2">
              {{ album.briefDesc || album.description || "-" }}
            </p>

            <!-- 发行和公司信息 -->
            <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-semibold text-[#fff8ea]/32">
              <span>{{ formatDate(album.publishTime) }}</span>
              <span class="truncate max-w-[100px]">{{ album.company || "-" }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 缺省提示 -->
      <div v-if="albums.length === 0" class="py-24 text-center text-[#fff8ea]/38 font-black">
        - 暂无精选专辑数据 -
      </div>
    </div>

    <!-- 专属分页器 -->
    <div v-if="totalAlbums > 0" class="mt-4 shrink-0 flex items-center justify-between text-xs text-[#fff8ea]/48 font-bold max-[620px]:flex-col max-[620px]:gap-3 max-[620px]:items-center">
      <!-- 左侧：数量信息 -->
      <div>
        共 <span class="text-[#ff4f63] font-black">{{ totalAlbums }}</span> 张专辑
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
