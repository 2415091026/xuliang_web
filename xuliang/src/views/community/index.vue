<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { View, ChatRound, Search, Star, Top } from "@element-plus/icons-vue";
import {
  getPostListApi,
  getCategoryListApi,
  createPostApi,
  getCommentTreeApi,
  createCommentApi
} from "../../api/community";

const router = useRouter();

// 用户登录信息
const userInfo = ref(null);

// 帖子列表和分类数据
const posts = ref([]);
const categories = ref([]);

// 筛选和检索状态
const searchQuery = ref("");
const selectedCategoryId = ref(null);
const sortBy = ref("latest_reply");

// 分页状态
const currentPage = ref(1);
const pageSize = ref(6);
const totalPosts = ref(0);
const loading = ref(false);

// 缓存各帖子的评论总数 (postId => count)
const commentCounts = ref({});

// 发帖弹窗控制及表单数据
const isPublishDialogOpen = ref(false);
const publishForm = ref({
  categoryId: null,
  title: "",
  content: ""
});

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalPosts.value / pageSize.value);
});

// 计算要展示的页码，100% 还原效果图分页器
const displayedPages = computed(() => {
  const current = currentPage.value;
  const total = totalPages.value;
  const pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (current > 3) {
      pages.push("...");
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < total) {
        pages.push(i);
      }
    }

    if (current < total - 2) {
      pages.push("...");
    }

    pages.push(total);
  }

  return pages;
});

// 格式化浏览数展示，例如 12.6k
const formatCount = (count) => {
  if (count === undefined || count === null) return "-";
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }
  return count;
};

// 格式化相对时间，例如 2小时前
const formatTime = (timeStr) => {
  if (!timeStr) return "-";
  const date = new Date(timeStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 拼接头像相对路径
const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }
  // Vite 代理 /profile 已转发到 8080，直接返回相对根路径即可
  return avatar;
};

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

// 获取分类板块列表
const fetchCategories = () => {
  getCategoryListApi({ pageNum: 1, pageSize: 50, status: "0" })
    .then((res) => {
      if (res && res.code === 200 && res.data) {
        categories.value = res.data.list || [];
      }
    })
    .catch((err) => {
      console.error("加载板块分类失败：", err);
    });
};

// 获取帖子列表
const fetchPostList = () => {
  loading.value = true;
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    title: searchQuery.value ? searchQuery.value.trim() : undefined,
    categoryId: selectedCategoryId.value ? selectedCategoryId.value : undefined,
    status: "0"
  };

  getPostListApi(params)
    .then((res) => {
      if (res && res.code === 200 && res.data) {
        posts.value = res.data.list || [];
        totalPosts.value = res.data.total || 0;
        // 异步获取每条帖子的真实评论数
        posts.value.forEach((post) => {
          fetchCommentCounts(post.postId);
        });
      }
    })
    .catch((err) => {
      console.error("加载帖子列表失败：", err);
      ElMessage.error("社区动态加载失败，请检查网络或刷新重试");
    })
    .finally(() => {
      loading.value = false;
    });
};

// 跳转到帖子详情页
const toPostDetail = (postId) => {
  router.push(`/community/post/${postId}`);
};

// 异步加载单条帖子的真实评论总数
const fetchCommentCounts = (postId) => {
  getCommentTreeApi(postId)
    .then((res) => {
      if (res && res.code === 200 && res.data) {
        commentCounts.value[postId] = res.data.length;
      }
    })
    .catch((err) => {
      console.error(`加载帖子 ${postId} 评论数失败：`, err);
    });
};

// 打开新建发帖弹窗
const openPublishDialog = () => {
  if (!userInfo.value) {
    ElMessage.warning("请先登录再发布帖子");
    router.push({ name: "login" });
    return;
  }

  if (categories.value.length > 0 && !publishForm.value.categoryId) {
    publishForm.value.categoryId = categories.value[0].categoryId;
  }

  isPublishDialogOpen.value = true;
};

// 关闭发帖弹窗并清空表单
const closePublishDialog = () => {
  isPublishDialogOpen.value = false;
  publishForm.value.title = "";
  publishForm.value.content = "";
};

// 处理发布帖子
const handlePublishPost = () => {
  const { categoryId, title, content } = publishForm.value;

  if (!categoryId) {
    ElMessage.warning("请选择板块分类");
    return;
  }
  if (!title.trim()) {
    ElMessage.warning("帖子标题不能为空");
    return;
  }
  if (!content.trim()) {
    ElMessage.warning("帖子内容不能为空");
    return;
  }

  const postData = {
    categoryId,
    title: title.trim(),
    content: content.trim()
  };

  createPostApi(postData)
    .then((res) => {
      if (res && res.code === 200) {
        ElMessage.success("帖子发布成功！");
        closePublishDialog();
        currentPage.value = 1;
        fetchPostList();
      }
    })
    .catch((err) => {
      console.error("发表帖子失败：", err);
      ElMessage.error("发布失败，请确认您的发帖权限或重新登录");
    });
};

// 翻页处理
const handlePageChange = (page) => {
  if (page === "..." || page === currentPage.value) return;
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchPostList();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 检索或分类变化时重置页码并重新拉取
const handleFilterChange = () => {
  currentPage.value = 1;
  fetchPostList();
};

watch([selectedCategoryId, sortBy], () => {
  handleFilterChange();
});

onMounted(() => {
  checkLoginStatus();
  fetchCategories();
  fetchPostList();
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 text-[#fff8ea]">
    <!-- 社区讨论顶部标题栏 -->
    <div class="mb-10 text-left">
      <div class="flex items-baseline gap-3">
        <h1 class="m-0 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          社区讨论
        </h1>
        <span class="font-cfracelyncetta text-2xl italic text-[#d77475] md:text-3xl">
          Community
        </span>
      </div>
      <p class="m-0 mt-2 text-sm text-white/50">
        分享音乐故事、现场回忆与创作感受。
      </p>
    </div>

    <!-- 搜索与过滤选择栏 -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
      <!-- 搜索框 -->
      <div class="relative flex-1">
        <input v-model="searchQuery" type="text"
          class="w-full rounded-full border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 backdrop-blur-xl focus:border-[#f2b84b]/40 focus:outline-none"
          placeholder="搜索帖子、话题或用户..." @keyup.enter="handleFilterChange" />
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 size-4 pointer-events-none" />
      </div>

      <div class="flex items-center gap-3.5">
        <!-- 分类下拉选择框 -->
        <el-select v-model="selectedCategoryId" placeholder="全部分类" class="filter-select !w-[130px]" effect="dark" :teleported="false">
          <el-option :value="null" label="全部分类" />
          <el-option v-for="cat in categories" :key="cat.categoryId" :value="cat.categoryId" :label="cat.name" />
        </el-select>

        <!-- 排序选择下拉框 -->
        <el-select v-model="sortBy" class="filter-select !w-[130px]" effect="dark" :teleported="false">
          <el-option value="latest_reply" label="最新回复" />
          <el-option value="latest_publish" label="最新发布" />
        </el-select>

        <!-- 快捷发布帖子按钮 -->
        <el-button @click="openPublishDialog"
          class="!h-[38px] !rounded-full !bg-gradient-to-r !from-[#d77475] !to-[#f2b84b] !border-none !text-white !font-black !px-5 !py-2.5 !text-xs shadow-lg transition duration-300 hover:scale-[1.03] hover:shadow-[0_0_16px_rgba(242,184,75,0.3)] active:scale-[0.98]">
          发布帖子
        </el-button>
      </div>
    </div>

    <!-- 帖子卡片列表展示 -->
    <div v-loading="loading" class="space-y-4">
      <TransitionGroup name="post-list" tag="div" class="space-y-4">
        <div v-for="post in posts" :key="post.postId"
          @click="toPostDetail(post.postId)"
          class="group flex overflow-hidden rounded-2xl border border-white/5 bg-[#101116]/80 cursor-pointer transition-all duration-300 hover:border-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          :class="[
            post.isTop === '1' ? 'shadow-[inset_1px_1px_0_rgba(242,184,75,0.08)]' : '',
            post.isEssence === '1' ? 'shadow-[inset_1px_1px_0_rgba(215,116,117,0.08)]' : ''
          ]">
          <!-- 1. 置顶卡片特有侧边彩条 (非 absolute 弹性占比，防止高度变形) -->
          <div v-if="post.isTop === '1'"
            class="w-[52px] md:w-[65px] flex-shrink-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#f2b84b] to-[#b8801d] text-white py-3 shadow-[inset_-1px_0_0_rgba(255,255,255,0.1)]">
            <!-- 两个小人/乐手剪影 SVG -->
            <svg class="size-5 text-white/90" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M16.5 13c-1.2 0-3.07.34-3.5 1-1.2.7-1.5 2.2-1.5 3h10c0-.8-.3-2.3-1.5-3-.43-.66-2.3-1-3.5-1zM16.5 11c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-9 2c-1.2 0-3.07.34-3.5 1-1.2.7-1.5 2.2-1.5 3h10c0-.8-.3-2.3-1.5-3-.43-.66-2.3-1-3.5-1zM7.5 11c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
            </svg>
            <span class="rounded bg-[#08090d]/60 px-1 py-0.2 text-[8px] font-black tracking-wider text-[#f2b84b]">
              置顶
            </span>
          </div>

          <!-- 2. 精华卡片特有侧边彩条 -->
          <div v-else-if="post.isEssence === '1'"
            class="w-[52px] md:w-[65px] flex-shrink-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#d77475] to-[#8b3e5a] text-white py-3 shadow-[inset_-1px_0_0_rgba(255,255,255,0.1)]">
            <!-- 特色图标 SVG -->
            <svg class="size-5 text-white/90" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
            </svg>
            <span class="rounded bg-[#08090d]/60 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-[#d77475]">
              精华
            </span>
          </div>

          <!-- 主体展示区 (采用 Flex 结构以精准对齐列表元素) -->
          <div class="flex-1 p-3.5 md:p-4 text-left flex items-start gap-3">
            <!-- 普通帖子的用户头像 (置顶/精华左侧已有彩条标识，不显示重复的头像) -->
            <div v-if="post.isTop !== '1' && post.isEssence !== '1'" class="flex-shrink-0 pt-0.5">
              <img v-if="post.user && post.user.avatar" :src="getAvatarUrl(post.user.avatar)"
                class="size-9 rounded-full object-cover border border-white/10" alt="作者头像" />
              <div v-else
                class="grid size-9 place-items-center rounded-full bg-gradient-to-tr from-[#8b3e5a] to-[#d77475] text-[10px] font-black text-white">
                {{ (post.user?.nickName || post.user?.userName || "U").substring(0, 1).toUpperCase() }}
              </div>
            </div>

            <!-- 右侧帖子具体排版内容 -->
            <div class="flex-1 min-w-0">
              <!-- 分类模块与标题、统计水平并排 -->
              <div class="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                <div>
                  <!-- 帖子标题 (置顶与精华带有前缀标签指示) -->
                  <div class="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span v-if="post.isTop === '1'"
                      class="rounded bg-[#f2b84b]/15 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-[#f2b84b]">
                      置顶
                    </span>
                    <span v-else-if="post.isEssence === '1'"
                      class="rounded bg-[#d77475]/15 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-[#d77475]">
                      精华
                    </span>
                    <span class="text-[9px] font-bold uppercase tracking-wider text-[#f2b84b]/50">
                      {{categories.find(c => c.categoryId === post.categoryId)?.name || "默认分类"}}
                    </span>
                  </div>

                  <!-- 标题 -->
                  <h2
                    class="m-0 text-[15px] font-extrabold text-white transition group-hover:text-[#f2b84b] leading-snug">
                    {{ post.title || "-" }}
                  </h2>
                </div>

                <!-- 右侧统计与置顶小星/图钉微标 (水平对齐标题行) -->
                <div class="flex items-center gap-4 text-xs text-white/40 pt-1 flex-shrink-0">
                  <!-- 浏览数 -->
                  <span class="flex items-center gap-1.5">
                    <el-icon class="size-4"><View /></el-icon>
                    {{ formatCount(post.viewCount) }}
                  </span>

                  <!-- 评论数 -->
                  <span
                    class="flex items-center gap-1.5 text-white/40 group-hover:text-[#f2b84b] transition">
                    <el-icon class="size-4"><ChatRound /></el-icon>
                    {{ commentCounts[post.postId] !== undefined ? commentCounts[post.postId] : "-" }}
                  </span>

                  <!-- 置顶/精华的特定小高光图标 -->
                  <div class="w-4 flex justify-end">
                    <el-icon v-if="post.isTop === '1'"
                      class="size-4 text-[#f2b84b] filter drop-shadow-[0_0_8px_rgba(242,184,75,0.6)]">
                      <Top />
                    </el-icon>
                    <el-icon v-else-if="post.isEssence === '1'"
                      class="size-4 text-[#d77475] filter drop-shadow-[0_0_8px_rgba(215,116,117,0.6)]">
                      <Star />
                    </el-icon>
                  </div>
                </div>
              </div>

              <!-- 帖子正文摘要 -->
              <p class="m-0 mt-2 text-xs leading-normal text-white/50 line-clamp-2">
                {{ post.content || "-" }}
              </p>

              <!-- 底部署名：发帖人与发布时间 -->
              <div class="mt-3 flex items-center gap-1.5 text-[10px] text-white/35">
                <span class="font-bold text-white/60">
                  {{ post.user?.nickName || post.user?.userName || "-" }}
                </span>
                <span>·</span>
                <span>{{ formatTime(post.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- 优雅的无数据缺省卡片 -->
      <div v-if="posts.length === 0 && !loading"
        class="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.01] py-20 px-4 text-center shadow-xl backdrop-blur-md">
        <div class="mb-4 rounded-full bg-[#f2b84b]/5 p-4 text-[#f2b84b]">
          <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 class="m-0 text-base font-bold text-white">暂无讨论动态</h3>
        <p class="m-0 mt-2 max-w-xs text-xs leading-relaxed text-white/40">
          当前板块未检索到任何帖子，快点击“发布帖子”抢先发表第一条动态吧！
        </p>
      </div>
    </div>

    <!-- 高保真磨砂玻璃底部分页器 -->
    <div v-if="totalPages > 1" class="mt-10 flex items-center justify-center gap-1.5">
      <el-button @click="handlePageChange(currentPage - 1)"
        class="!size-8 !min-w-0 !p-0 !rounded !bg-[#101116]/80 !border-white/5 !text-white/50 hover:!text-white hover:!bg-white/5 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="currentPage === 1">
        &lt;
      </el-button>

      <el-button v-for="(page, index) in displayedPages" :key="index" @click="handlePageChange(page)"
        class="!size-8 !min-w-0 !p-0 !rounded !text-xs transition duration-200 focus:outline-none"
        :class="[
          page === currentPage
            ? '!bg-gradient-to-tr !from-[#d77475] !to-[#f2b84b] !text-white !font-extrabold !border-none shadow-md'
            : '!bg-[#101116]/80 !border-white/5 !text-white/60 hover:!bg-white/5 hover:!text-white',
          page === '...' ? '!cursor-default !bg-transparent !border-none' : ''
        ]">
        {{ page }}
      </el-button>

      <el-button @click="handlePageChange(currentPage + 1)"
        class="!size-8 !min-w-0 !p-0 !rounded !bg-[#101116]/80 !border-white/5 !text-white/50 hover:!text-white hover:!bg-white/5 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="currentPage === totalPages">
        &gt;
      </el-button>
    </div>

    <!-- 发帖弹窗 (Element Plus Dialog 统一风格) -->
    <el-dialog
      v-model="isPublishDialogOpen"
      title="发表新帖子"
      width="500px"
      class="publish-dialog"
      :before-close="closePublishDialog"
      destroy-on-close
      append-to-body
    >
      <!-- 弹窗表单 -->
      <el-form :model="publishForm" label-position="top" class="text-xs">
        <!-- 分类选择 -->
        <el-form-item label="选择板块">
          <el-select v-model="publishForm.categoryId" placeholder="请选择板块" class="w-full font-sans" effect="dark" :teleported="false">
            <el-option v-for="cat in categories" :key="cat.categoryId" :value="cat.categoryId" :label="cat.name" />
          </el-select>
        </el-form-item>

        <!-- 标题输入 -->
        <el-form-item label="帖子标题">
          <el-input v-model="publishForm.title" placeholder="请输入标题..." />
        </el-form-item>

        <!-- 正文输入 -->
        <el-form-item label="帖子正文">
          <el-input v-model="publishForm.content" type="textarea" :rows="6" placeholder="跟大家分享你的精彩想法与见解吧..." />
        </el-form-item>
      </el-form>

      <!-- 弹窗操作 -->
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <el-button @click="closePublishDialog"
            class="!rounded-full !border-white/10 !bg-white/5 !px-5 !py-2 !text-xs !font-semibold !text-[#fff8ea] hover:!bg-white/10 transition">
            取消
          </el-button>
          <el-button @click="handlePublishPost"
            class="!rounded-full !bg-gradient-to-r !from-[#d77475] !to-[#f2b84b] !border-none !px-6 !py-2 !text-xs !font-black !text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition">
            发表帖子
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 帖子列表过渡效果 */
.post-list-enter-active,
.post-list-leave-active {
  transition: all 0.42s cubic-bezier(0.25, 1, 0.5, 1);
}

.post-list-enter-from {
  opacity: 0;
  transform: translateY(24px);
}

.post-list-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* 深度穿透覆盖 Element Plus 组件在暗黑模式下的玻璃拟态质感 */
:deep(.el-dialog) {
  background: rgba(16, 17, 22, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 24px !important;
  backdrop-filter: blur(16px) !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8) !important;
}

:deep(.el-dialog__title) {
  color: #fff !important;
  font-weight: 900 !important;
  letter-spacing: 0.05em;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.4) !important;
  transition: color 0.2s;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: #fff !important;
}

:deep(.el-form-item__label) {
  color: rgba(255, 248, 234, 0.6) !important;
  font-weight: 800 !important;
  font-size: 11px !important;
  padding-bottom: 4px !important;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper),
:deep(.el-select__wrapper) {
  background-color: rgba(0, 0, 0, 0.35) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: none !important;
  border-radius: 12px !important;
  transition: border-color 0.2s, background-color 0.2s;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__wrapper:hover),
:deep(.el-select__wrapper:hover) {
  border-color: rgba(242, 184, 75, 0.4) !important;
  background-color: rgba(0, 0, 0, 0.45) !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__wrapper.is-focus),
:deep(.el-select__wrapper.is-focus) {
  border-color: #f2b84b !important;
  background-color: rgba(0, 0, 0, 0.5) !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select__placeholder) {
  color: #fff !important;
  font-family: inherit !important;
  font-size: 11px !important;
}

:deep(.el-select__placeholder.is-transparent) {
  color: rgba(255, 255, 255, 0.2) !important;
}

/* 顶部过滤筛选下拉框的胶囊拟态圆角及高度对齐 */
.filter-select :deep(.el-select__wrapper) {
  height: 38px !important;
  border-radius: 9999px !important;
  padding: 0 16px !important;
  background-color: rgba(16, 17, 22, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: none !important;
}

.filter-select :deep(.el-select__wrapper:hover) {
  border-color: rgba(242, 184, 75, 0.4) !important;
}

.filter-select :deep(.el-select__wrapper.is-focus) {
  border-color: #f2b84b !important;
}
</style>

<style>
/* 全局覆盖：Element Plus 下拉浮层(Popper)暗黑磨砂玻璃样式 */
.el-select__popper.el-popper {
  background: rgba(16, 17, 22, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 14px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(12px) !important;
}

.el-select-dropdown__item {
  color: rgba(255, 248, 234, 0.6) !important;
  font-size: 11px !important;
  border-radius: 8px !important;
  margin: 2px 4px !important;
  transition: all 0.2s;
}

.el-select-dropdown__item.is-hovering {
  background-color: rgba(255, 255, 255, 0.06) !important;
  color: #fff !important;
}

.el-select-dropdown__item.is-selected {
  color: #f2b84b !important;
  font-weight: 800 !important;
  background-color: rgba(242, 184, 75, 0.12) !important;
}

.el-select__popper.el-popper .el-popper__arrow::before {
  background: rgba(16, 17, 22, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
</style>
