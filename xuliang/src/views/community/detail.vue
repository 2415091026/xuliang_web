<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  More,
  ArrowDown,
  ChatLineRound,
  Star,
  Share,
  Warning,
  StarFilled
} from "@element-plus/icons-vue";
import {
  getPostDetailApi,
  getCommentTreeApi,
  createCommentApi,
  togglePostLikeApi,
  togglePostCollectApi,
  toggleCommentLikeApi,
  reportPostApi
} from "../../api/community";

const route = useRoute();
const router = useRouter();

// 路由参数帖子ID
const postId = route.params.id;

// 响应式数据
const post = ref(null);
const comments = ref([]);
const loading = ref(false);
const submitting = ref(false);

// 评论与回复输入
const rootCommentText = ref("");
const activeReplyCommentId = ref(null);
const replyText = ref("");

// 登录用户信息
const userInfo = ref(null);

// 互动本地状态模拟
const isFollowed = ref(false);
const isLiked = ref(false);
const likeCount = ref(0);
const isCollected = ref(false);
const collectCount = ref(0);

// 评论排序
const sortBy = ref("latest");
const handleSortChange = (command) => {
  sortBy.value = command;
  ElMessage.info(`切换为：${command === "latest" ? "按最新" : "按最热"}`);
};

// 计算评论总数（包含所有二级/三级评论）
const totalCommentsCount = computed(() => {
  let count = 0;
  const countReplies = (list) => {
    list.forEach(c => {
      count++;
      if (c.children && c.children.length > 0) {
        countReplies(c.children);
      }
    });
  };
  countReplies(comments.value);
  return count;
});

// 根据 userId 生成虚拟用户等级勋章
const getUserLevel = (userId) => {
  if (!userId) return "LV1";
  return `LV${(userId % 6) + 1}`;
};

// 拼接头像相对路径（确保绝对/相对均不404，且多层级路由下解析正确）
const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }
  // 确保以斜杠 / 开头
  return avatar.startsWith("/") ? avatar : "/" + avatar;
};

// 格式化相对时间
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
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

// 获取帖子详情
const fetchPostDetail = () => {
  loading.value = true;
  getPostDetailApi(postId)
    .then((res) => {
      if (res && res.code === 200 && res.data) {
        post.value = res.data;
        // 本地计数与交互状态初始化
        likeCount.value = res.data.likeCount || 0;
        collectCount.value = res.data.collectCount || 0;
        isLiked.value = !!res.data.isLiked;
        isCollected.value = !!res.data.isCollected;
      } else {
        ElMessage.error("帖子不存在或已被删除");
        router.push({ name: "community" });
      }
    })
    .catch((err) => {
      console.error("加载帖子详情失败：", err);
      ElMessage.error("加载详情失败，请刷新重试");
    })
    .finally(() => {
      loading.value = false;
    });
};

// 获取评论树
const fetchCommentTree = () => {
  getCommentTreeApi(postId)
    .then((res) => {
      if (res && res.code === 200 && res.data) {
        comments.value = res.data || [];
      }
    })
    .catch((err) => {
      console.error("加载评论失败：", err);
    });
};

// 返回上一页
const goBack = () => {
  router.push({ name: "community" });
};

// 关注操作切换
const toggleFollow = () => {
  if (!userInfo.value) {
    ElMessage.warning("请先登录再操作");
    router.push({ name: "login" });
    return;
  }
  isFollowed.value = !isFollowed.value;
  ElMessage.success(isFollowed.value ? "关注成功！" : "已取消关注");
};

// 点赞操作切换
const toggleLike = () => {
  if (!userInfo.value) {
    ElMessage.warning("请先登录再点赞");
    router.push({ name: "login" });
    return;
  }
  togglePostLikeApi(postId)
    .then((res) => {
      if (res && res.code === 200) {
        const isLikedNow = !!res.data.isLiked;
        isLiked.value = isLikedNow;
        if (isLikedNow) {
          likeCount.value++;
          ElMessage.success("点赞成功！");
        } else {
          likeCount.value = Math.max(0, likeCount.value - 1);
          ElMessage.success("已取消点赞");
        }
      } else {
        ElMessage.error(res.msg || "点赞操作失败");
      }
    })
    .catch((err) => {
      console.error("点赞失败：", err);
      ElMessage.error("点赞操作失败，请稍后重试");
    });
};

// 收藏操作切换
const toggleCollect = () => {
  if (!userInfo.value) {
    ElMessage.warning("请先登录再收藏");
    router.push({ name: "login" });
    return;
  }
  togglePostCollectApi(postId)
    .then((res) => {
      if (res && res.code === 200) {
        const isCollectedNow = !!res.data.isCollected;
        isCollected.value = isCollectedNow;
        if (isCollectedNow) {
          collectCount.value++;
          ElMessage.success("已添加到您的收藏");
        } else {
          collectCount.value = Math.max(0, collectCount.value - 1);
          ElMessage.success("已取消收藏");
        }
      } else {
        ElMessage.error(res.msg || "收藏操作失败");
      }
    })
    .catch((err) => {
      console.error("收藏失败：", err);
      ElMessage.error("收藏操作失败，请稍后重试");
    });
};

// 评论点赞操作切换
const toggleCommentLike = (comment) => {
  if (!userInfo.value) {
    ElMessage.warning("请先登录再点赞");
    router.push({ name: "login" });
    return;
  }
  toggleCommentLikeApi(comment.commentId)
    .then((res) => {
      if (res && res.code === 200) {
        const isLikedNow = !!res.data.isLiked;
        comment.isLiked = isLikedNow;
        if (isLikedNow) {
          comment.likeCount = (comment.likeCount || 0) + 1;
          ElMessage.success("点赞成功！");
        } else {
          comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
          ElMessage.success("已取消点赞");
        }
      } else {
        ElMessage.error(res.msg || "操作失败");
      }
    })
    .catch((err) => {
      console.error("评论点赞失败：", err);
      ElMessage.error("点赞失败，请稍后重试");
    });
};

// 发布一级评论
const submitRootComment = () => {
  if (!userInfo.value) {
    ElMessage.warning("请先登录再评论");
    router.push({ name: "login" });
    return;
  }

  const text = rootCommentText.value.trim();
  if (!text) {
    ElMessage.warning("评论内容不能为空");
    return;
  }

  submitting.value = true;
  const commentData = {
    postId: parseInt(postId),
    content: text
  };

  createCommentApi(commentData)
    .then((res) => {
      if (res && res.code === 200) {
        ElMessage.success("发表评论成功！");
        rootCommentText.value = "";
        fetchCommentTree();
      }
    })
    .catch((err) => {
      console.error("发表评论失败：", err);
      ElMessage.error("发表评论失败，请重新登录重试");
    })
    .finally(() => {
      submitting.value = false;
    });
};

// 展开某个评论的回复输入框
const openReplyBox = (commentId) => {
  if (activeReplyCommentId.value === commentId) {
    activeReplyCommentId.value = null;
  } else {
    activeReplyCommentId.value = commentId;
    replyText.value = "";
  }
};

// 发表回复（二级或多级子评论）
const submitReplyComment = (parentComment) => {
  if (!userInfo.value) {
    ElMessage.warning("请先登录再回复");
    router.push({ name: "login" });
    return;
  }

  const text = replyText.value.trim();
  if (!text) {
    ElMessage.warning("回复内容不能为空");
    return;
  }

  const commentData = {
    postId: parseInt(postId),
    parentId: parentComment.commentId,
    content: text
  };

  createCommentApi(commentData)
    .then((res) => {
      if (res && res.code === 200) {
        ElMessage.success("回复成功！");
        replyText.value = "";
        activeReplyCommentId.value = null;
        fetchCommentTree();
      }
    })
    .catch((err) => {
      console.error("发表回复失败：", err);
      ElMessage.error("回复发表失败");
    });
};

// 递归扁平化获取一条评论下所有的子评论
const flattenComments = (comment, list = []) => {
  if (comment.children && comment.children.length > 0) {
    comment.children.forEach(child => {
      list.push(child);
      flattenComments(child, list);
    });
  }
  return list;
};

// ==================== 帖子举报相关逻辑 ====================
const reportDialogVisible = ref(false);
const reportLoading = ref(false);
const reportForm = ref({
  reason: "",
  content: ""
});

const reportReasons = [
  "垃圾广告/内容引流",
  "色情低俗/不雅言论",
  "政治敏感/违法违规",
  "人身攻击/辱骂谩骂",
  "侵权行为(抄袭、冒用等)",
  "其他原因"
];

// 打开举报弹窗并校验登录
const openReportDialog = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    ElMessage.warning("请先登录账号再进行举报操作");
    router.push({ name: "login" });
    return;
  }
  
  reportForm.value = {
    reason: "",
    content: ""
  };
  reportDialogVisible.value = true;
};

// 提交帖子举报到后端
const submitReport = () => {
  if (!reportForm.value.reason) {
    ElMessage.warning("请选择举报原因");
    return;
  }
  
  reportLoading.value = true;
  reportPostApi({
    postId: Number(postId),
    reason: reportForm.value.reason,
    content: reportForm.value.content
  })
    .then(() => {
      ElMessage.success("举报成功，我们将尽快处理您的反馈！");
      // 在 localStorage 中缓存当前用户举报的 postId
      const userId = userInfo.value?.userId || "guest";
      const reportedKey = `reported_posts_${userId}`;
      const reportedList = JSON.parse(localStorage.getItem(reportedKey) || "[]");
      if (!reportedList.includes(Number(postId))) {
        reportedList.push(Number(postId));
        localStorage.setItem(reportedKey, JSON.stringify(reportedList));
      }
      reportDialogVisible.value = false;
    })
    .catch((err) => {
      console.error("举报帖子失败：", err);
    })
    .finally(() => {
      reportLoading.value = false;
    });
};


onMounted(() => {
  checkLoginStatus();
  fetchPostDetail();
  fetchCommentTree();
});
</script>

<template>
  <div v-loading="loading" class="mx-auto max-w-4xl px-4 py-8 text-[#fff8ea]">
    <!-- 顶部导航栏 -->
    <div class="mb-6 flex items-center justify-between">
      <el-button link @click="goBack" class="!text-white/50 hover:!text-white !font-bold !text-xs group">
        <el-icon class="mr-1 group-hover:-translate-x-0.5 transition-transform">
          <ArrowLeft />
        </el-icon>
        返回社区
      </el-button>

      <!-- 更多操作小按钮 -->
      <el-dropdown trigger="click">
        <el-button circle
          class="!w-8 !h-8 !flex !items-center !justify-center !rounded-full !border-white/5 !bg-white/[0.02] !text-white/40 hover:!bg-white/10 hover:!text-white"
          :icon="More" />

        <template #dropdown>
          <el-dropdown-menu class="dark-dropdown-menu">
            <el-dropdown-item>分享帖子</el-dropdown-item>
            <el-dropdown-item class="!text-[#ff4f63]" @click="openReportDialog">举报内容</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 帖子主体大卡片 -->
    <article v-if="post"
      class="overflow-hidden rounded-3xl border border-white/5 bg-[#101116]/80 p-6 md:p-8 shadow-2xl backdrop-blur-md">
      <!-- 帖子标题 & 置顶、精华徽标 -->
      <header class="text-left">
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <el-tag v-if="post.isTop === '1'"
            class="!bg-[#f2b84b]/15 !border-none !text-[#f2b84b] !font-black !text-[10px] tracking-wider uppercase">
            置顶
          </el-tag>
          <el-tag v-if="post.isEssence === '1'"
            class="!bg-[#d77475]/15 !border-none !text-[#d77475] !font-black !text-[10px] tracking-wider uppercase">
            精华
          </el-tag>
        </div>
        <h1 class="m-0 text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-snug">
          {{ post.title || "-" }}
        </h1>

        <!-- 作者与元数据信息栏 -->
        <div class="mt-6 flex items-center justify-between border-b border-white/5 pb-5">
          <div class="flex items-center gap-3">
            <!-- 作者头像 -->
            <el-avatar v-if="post.user" :size="44" :src="post.user.avatar ? getAvatarUrl(post.user.avatar) : ''"
              class="!bg-gradient-to-tr !from-[#8b3e5a] !to-[#d77475] !border !border-white/10 !text-white font-black">
              {{ (post.user.nickName || post.user.userName || "U").substring(0, 1).toUpperCase() }}
            </el-avatar>

            <!-- 署名与浏览数 -->
            <div class="grid gap-0.5">
              <div class="flex items-center gap-2">
                <span class="text-sm font-black text-white">
                  {{ post.user?.nickName || post.user?.userName || "-" }}
                </span>
                <!-- 虚拟等级勋章 -->
                <el-tag class="!bg-[#f2b84b]/20 !border-none !text-[#f2b84b] !font-black !text-[8px] !h-4 !px-1.5">
                  {{ getUserLevel(post.userId) }}
                </el-tag>
              </div>
              <div class="flex items-center gap-3 text-[10px] text-white/35">
                <span>{{ formatTime(post.createTime) }}</span>
                <span class="flex items-center gap-1">
                  <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ post.viewCount || 0 }}
                </span>
                <span class="flex items-center gap-1">
                  <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {{ totalCommentsCount }}
                </span>
              </div>
            </div>
          </div>

          <!-- 关注作者按钮 -->
          <el-button @click="toggleFollow" round class="!h-7 !px-4 !text-xs !font-black !transition-all !duration-300"
            :class="isFollowed ? '!border-white/10 !bg-white/5 !text-white/40' : '!border-[#f2b84b]/40 !bg-[#f2b84b]/10 !text-[#f2b84b] hover:!bg-[#f2b84b]/20'">
            {{ isFollowed ? '已关注' : '+ 关注' }}
          </el-button>
        </div>
      </header>

      <!-- 帖子内容正文 -->
      <section class="mt-6 text-left text-sm md:text-base leading-8 text-white/80 whitespace-pre-wrap">
        {{ post.content || "-" }}

        <!-- 演唱会高保真舞台插图 -->
        <!-- <div class="mt-8 overflow-hidden rounded-2xl border border-white/5 shadow-xl">
          <el-image 
            src="/concert_stage_live.png" 
            fit="cover"
            class="w-full transition-transform duration-700 hover:scale-[1.02]"
            alt="徐良演唱会舞台现场"
            :preview-src-list="['/concert_stage_live.png']"
            preview-teleported
          />
        </div> -->
      </section>

      <!-- 互动胶囊按钮行 -->
      <footer class="mt-10 flex items-center justify-between border-t border-white/5 pt-6">
        <div class="flex flex-wrap items-center gap-3">
          <!-- 赞 -->
          <el-button @click="toggleLike" round class="!h-9 !px-5 !text-xs !font-black !transition-all active:scale-95"
            :class="isLiked ? '!border-[#ff4f63]/40 !bg-[#ff4f63]/10 !text-[#ff4f63] shadow-[0_0_12px_rgba(255,79,99,0.2)]' : '!border-white/10 !bg-white/5 !text-white/60 hover:!bg-white/10'">
            <svg class="size-4 mr-2" :fill="isLiked ? 'currentColor' : 'none'" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            赞 {{ likeCount }}
          </el-button>

          <!-- 收藏 -->
          <el-button @click="toggleCollect" round
            class="!h-9 !px-5 !text-xs !font-black !transition-all active:scale-95"
            :class="isCollected ? '!border-[#f2b84b]/40 !bg-[#f2b84b]/10 !text-[#f2b84b] shadow-[0_0_12px_rgba(242,184,75,0.2)]' : '!border-white/10 !bg-white/5 !text-white/60 hover:!bg-white/10'">
            <svg class="size-4 mr-2" :fill="isCollected ? 'currentColor' : 'none'" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.246.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.77-.564-.37-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
            收藏 {{ collectCount }}
          </el-button>

          <!-- 分享 -->
          <el-button round
            class="!h-9 !px-5 !text-xs !font-black !transition-all !border-white/10 !bg-white/5 !text-white/60 hover:!bg-white/10">
            <svg class="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.684 10.742l4.636-2.318m0 4.152l-4.636-2.318m8.318-3.076a3 3 0 11-6 0 3 3 0 016 0zm-6 8a3 3 0 11-6 0 3 3 0 016 0zm6 8a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            分享
          </el-button>
        </div>

        <!-- 举报 -->
        <el-button link
          class="!text-white/30 hover:!text-[#ff4f63]/80 !text-xs !font-bold !flex !items-center !gap-1.5">
          <el-icon>
            <Warning />
          </el-icon>
          举报
        </el-button>
      </footer>
    </article>

    <!-- 盖楼评论卡片 -->
    <div class="mt-8 rounded-3xl border border-white/5 bg-[#101116]/80 p-6 md:p-8 shadow-2xl backdrop-blur-md">
      <!-- 评论数量与排序选择 -->
      <div class="mb-6 flex items-center justify-between">
        <h3 class="m-0 text-base font-extrabold text-white">
          评论 ({{ totalCommentsCount }})
        </h3>
        <!-- 虚拟排序选项 -->
        <el-dropdown trigger="click" @command="handleSortChange">
          <span class="flex items-center gap-1 text-xs text-white/50 cursor-pointer hover:text-white">
            {{ sortBy === 'latest' ? '按最新' : '按最热' }}
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu class="dark-dropdown-menu">
              <el-dropdown-item command="latest">按最新</el-dropdown-item>
              <el-dropdown-item command="hot">按最热</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 评论列表 -->
      <div v-if="comments.length > 0" class="space-y-6">
        <div v-for="comment in comments" :key="comment.commentId"
          class="border-b border-white/5 pb-5 last:border-b-0 last:pb-0 text-left">
          <!-- 一级评论主体 -->
          <div class="flex items-start gap-3">
            <div class="size-9 flex-shrink-0">
              <el-avatar :size="36" :src="comment.user?.avatar ? getAvatarUrl(comment.user.avatar) : ''"
                class="!bg-gradient-to-tr !from-[#8b3e5a] !to-[#d77475] !border !border-white/10 !text-white font-black">
                {{ (comment.user?.nickName || comment.user?.userName || "U").substring(0, 1).toUpperCase() }}
              </el-avatar>
            </div>
            <div class="flex-1 min-w-0">
              <!-- 一级评论头部 -->
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-white">
                  {{ comment.user?.nickName || comment.user?.userName || "-" }}
                </span>
                <el-tag class="!bg-[#f2b84b]/20 !border-none !text-[#f2b84b] !font-black !text-[7px] !h-4 !px-1">
                  {{ getUserLevel(comment.userId) }}
                </el-tag>
              </div>
              <!-- 一级评论内容 -->
              <p class="m-0 mt-2 text-xs leading-relaxed text-white/80">
                {{ comment.content || "-" }}
              </p>
              <!-- 一级评论操作栏 -->
              <div class="mt-2.5 flex items-center gap-4 text-[10px] text-white/30">
                <span>{{ formatTime(comment.createTime) }}</span>
                <!-- 赞 -->
                <button 
                  @click="toggleCommentLike(comment)"
                  class="flex items-center gap-1 hover:text-[#ff4f63] focus:outline-none transition"
                  :class="comment.isLiked ? 'text-[#ff4f63]' : 'text-white/30'"
                >
                  <svg class="size-3" :fill="comment.isLiked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{{ comment.likeCount || 0 }}</span>
                </button>
                <!-- 回复按钮 -->
                <button @click="openReplyBox(comment.commentId)"
                  class="font-bold hover:text-[#f2b84b] focus:outline-none transition">
                  回复
                </button>
              </div>

              <!-- 内嵌回复框（当点击一级评论回复时） -->
              <div v-show="activeReplyCommentId === comment.commentId"
                class="mt-3.5 rounded-xl border border-white/5 bg-black/20 p-3">
                <el-input v-model="replyText" size="small"
                  :placeholder="`回复 @${comment.user?.nickName || comment.user?.userName}：说点什么...`"
                  class="reply-comment-input" @keyup.enter="submitReplyComment(comment)" />
                <div class="mt-2.5 flex items-center justify-between">
                  <!-- 工具占位 -->
                  <div class="flex items-center gap-2 text-white/30">
                    <svg class="size-4 hover:text-white/60 cursor-pointer" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <svg class="size-4 hover:text-white/60 cursor-pointer" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="flex items-center gap-2">
                    <el-button size="small" round @click="openReplyBox(comment.commentId)"
                      class="!bg-white/5 !border-white/10 !text-[#fff8ea] hover:!bg-white/10">
                      取消
                    </el-button>
                    <el-button size="small" round type="primary" @click="submitReplyComment(comment)"
                      class="!bg-gradient-to-r !from-[#d77475] !to-[#f2b84b] !border-none !text-white active:scale-95">
                      发送
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 二级评论及子级盖楼框 -->
              <div v-if="flattenComments(comment).length > 0"
                class="mt-4 rounded-2xl border border-white/5 bg-black/30 p-4 space-y-4">
                <div v-for="reply in flattenComments(comment)" :key="reply.commentId" class="group/reply">
                  <div class="flex items-start gap-2.5">
                    <!-- 二级评论头像 -->
                    <div class="size-6 flex-shrink-0 mt-0.5">
                      <el-avatar :size="24" :src="reply.user?.avatar ? getAvatarUrl(reply.user.avatar) : ''"
                        class="!bg-gradient-to-tr !from-[#8b3e5a] !to-[#d77475] !border !border-white/10 !text-white font-black">
                        {{ (reply.user?.nickName || reply.user?.userName || "U").substring(0, 1).toUpperCase() }}
                      </el-avatar>
                    </div>
                    <!-- 二级评论内容 -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-black text-white">
                          {{ reply.user?.nickName || reply.user?.userName || "-" }}
                        </span>
                        <el-tag
                          class="!bg-[#f2b84b]/20 !border-none !text-[#f2b84b] !font-black !text-[6px] !h-4 !px-1">
                          {{ getUserLevel(reply.userId) }}
                        </el-tag>
                      </div>
                      <p class="m-0 mt-1.5 text-xs leading-relaxed text-white/80">
                        <span v-if="reply.replyToNickName" class="font-bold text-[#f2b84b]/80 mr-1">
                          回复 @{{ reply.replyToNickName }}：
                        </span>
                        {{ reply.content || "-" }}
                      </p>
                      <!-- 二级评论操作 -->
                      <div class="mt-2 flex items-center gap-3 text-[9px] text-white/30">
                        <span>{{ formatTime(reply.createTime) }}</span>
                        <!-- 赞 -->
                        <button 
                          @click="toggleCommentLike(reply)"
                          class="flex items-center gap-1 hover:text-[#ff4f63] focus:outline-none transition"
                          :class="reply.isLiked ? 'text-[#ff4f63]' : 'text-white/30'"
                        >
                          <svg class="size-2.5" :fill="reply.isLiked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{{ reply.likeCount || 0 }}</span>
                        </button>
                        <button @click="openReplyBox(reply.commentId)"
                          class="font-bold hover:text-[#f2b84b] focus:outline-none transition">
                          回复
                        </button>
                      </div>

                      <!-- 二级评论的回复框 -->
                      <div v-show="activeReplyCommentId === reply.commentId"
                        class="mt-3 rounded-lg border border-white/5 bg-black/20 p-2.5">
                        <el-input v-model="replyText" size="small"
                          :placeholder="`回复 @${reply.user?.nickName || reply.user?.userName}：说点什么...`"
                          class="reply-comment-input" @keyup.enter="submitReplyComment(reply)" />
                        <div class="mt-2 flex items-center justify-between">
                          <div class="flex items-center gap-2 text-white/30">
                            <svg class="size-3.5 hover:text-white/60 cursor-pointer" fill="none" viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <el-button size="small" round @click="openReplyBox(reply.commentId)"
                              class="!bg-white/5 !border-white/10 !text-[#fff8ea] hover:!bg-white/10 !px-3 !py-1 !text-[9px]">
                              取消
                            </el-button>
                            <el-button size="small" round type="primary" @click="submitReplyComment(reply)"
                              class="!bg-gradient-to-r !from-[#d77475] !to-[#f2b84b] !border-none !text-white active:scale-95 !px-3.5 !py-1 !text-[9px]">
                              发送
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 缺省状态 -->
      <el-empty v-else description="暂无评论，留下你的一条神评吧！" :image-size="60" class="!py-8">
        <template #image>
          <el-icon size="40" class="text-white/20">
            <ChatLineRound />
          </el-icon>
        </template>
      </el-empty>

      <!-- 底部发表新一级评论 -->
      <div class="mt-8 border-t border-white/5 pt-6 flex gap-3">
        <div class="size-9 flex-shrink-0">
          <el-avatar :size="36" :src="userInfo?.avatar ? getAvatarUrl(userInfo.avatar) : ''"
            class="!bg-gradient-to-tr !from-[#8b3e5a] !to-[#d77475] !border !border-white/10 !text-white font-black">
            {{ userInfo ? (userInfo.nickName || userInfo.userName || "U").substring(0, 1).toUpperCase() : '?' }}
          </el-avatar>
        </div>
        <div class="flex-1 min-w-0">
          <el-input v-model="rootCommentText" type="textarea" :rows="3" placeholder="发表你对该话题的精彩想法与评价吧..."
            class="root-comment-textarea" />
          <div class="mt-2.5 flex items-center justify-between">
            <div class="flex items-center gap-2.5 text-white/30">
              <svg class="size-5 hover:text-white/60 cursor-pointer" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg class="size-5 hover:text-white/60 cursor-pointer" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <el-button @click="submitRootComment" :loading="submitting"
              class="!rounded-full !bg-gradient-to-r !from-[#d77475] !to-[#f2b84b] !border-none !px-6 !py-2.5 !text-xs !font-black !text-white shadow-md hover:shadow-[0_0_12px_rgba(242,184,75,0.3)] transition active:scale-95">
              发表评论
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 举报帖子弹窗 (暗黑毛玻璃主题) -->
    <el-dialog
      v-model="reportDialogVisible"
      title="举报帖子"
      width="460px"
      class="custom-dark-dialog"
      :align-center="true"
    >
      <el-form :model="reportForm" label-position="top">
        <el-form-item label="请选择举报原因" required>
          <el-radio-group v-model="reportForm.reason" class="flex flex-col items-start gap-2.5">
            <el-radio
              v-for="item in reportReasons"
              :key="item"
              :value="item"
            >
              {{ item }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="补充描述 (选填)">
          <el-input
            v-model="reportForm.content"
            type="textarea"
            :rows="3"
            placeholder="请提供更多详细线索，方便我们快速进行审核和处理..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3 mt-4">
          <el-button
            class="!border-white/10 !bg-transparent hover:!bg-white/5 !text-white/70 hover:!text-white !rounded-xl"
            @click="reportDialogVisible = false"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            class="!border-none !bg-[#f2b84b] hover:!bg-[#e0a63b] !text-black !font-bold !rounded-xl"
            :loading="reportLoading"
            @click="submitReport"
          >
            提交举报
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 按钮过渡效果 */
button {
  cursor: pointer;
}

.dark-dropdown-menu {
  background-color: #1a1b20 !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.dark-dropdown-menu :deep(.el-dropdown-menu__item) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.dark-dropdown-menu :deep(.el-dropdown-menu__item:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #fff !important;
}

/* 回复框输入样式 */
.reply-comment-input :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  border-radius: 8px !important;
  padding: 6px 12px !important;
}

.reply-comment-input :deep(.el-input__wrapper:hover),
.reply-comment-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(242, 184, 75, 0.4) inset !important;
}

.reply-comment-input :deep(.el-input__inner) {
  color: #fff !important;
  font-size: 12px !important;
}

/* 发表评论输入样式 */
:deep(.root-comment-textarea .el-textarea__inner) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  font-size: 12px !important;
  border-radius: 12px !important;
  resize: none !important;
}

:deep(.root-comment-textarea .el-textarea__inner:focus) {
  border-color: rgba(242, 184, 75, 0.4) !important;
  box-shadow: none !important;
}

/* el-empty的插画重置 */
:deep(.el-empty__description p) {
  color: rgba(255, 255, 255, 0.3) !important;
  font-size: 12px !important;
}

/* ==========================================================================
   举报帖子对话框暗黑毛玻璃美化
   ========================================================================== */
:deep(.custom-dark-dialog) {
  background-color: rgba(16, 17, 22, 0.88) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
}

:deep(.custom-dark-dialog .el-dialog__title) {
  color: #fff8ea !important;
  font-weight: 900 !important;
  font-size: 1.125rem !important;
}

:deep(.custom-dark-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.4) !important;
  transition: color 0.2s ease !important;
}

:deep(.custom-dark-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: #f2b84b !important;
}

:deep(.custom-dark-dialog .el-dialog__body) {
  color: #fff8ea !important;
  padding: 10px 24px 20px 24px !important;
}

:deep(.custom-dark-dialog .el-form-item__label) {
  color: rgba(255, 255, 255, 0.6) !important;
  font-weight: 700 !important;
  font-size: 0.875rem !important;
  margin-bottom: 0.5rem !important;
}

:deep(.custom-dark-dialog .el-radio-group) {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  width: 100% !important;
}

:deep(.custom-dark-dialog .el-radio) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  width: 100% !important;
  margin-right: 0 !important;
  padding: 4px 0 !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

/* 未选中时的圆圈样式（防止变成刺眼的白色实心圆圈） */
:deep(.custom-dark-dialog .el-radio__inner) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  width: 14px !important;
  height: 14px !important;
  transition: all 0.2s ease !important;
}

:deep(.custom-dark-dialog .el-radio:hover .el-radio__inner) {
  border-color: rgba(242, 184, 75, 0.6) !important;
}

:deep(.custom-dark-dialog .el-radio__input.is-checked .el-radio__inner) {
  border-color: #f2b84b !important;
  background-color: #f2b84b !important;
}

:deep(.custom-dark-dialog .el-radio__input.is-checked + .el-radio__label) {
  color: #f2b84b !important;
  font-weight: 700 !important;
}

:deep(.custom-dark-dialog .el-textarea__inner) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  border-radius: 10px !important;
  padding: 10px 12px !important;
  font-size: 0.8125rem !important;
}

:deep(.custom-dark-dialog .el-textarea__inner:focus) {
  border-color: rgba(242, 184, 75, 0.4) !important;
  box-shadow: none !important;
}

:deep(.custom-dark-dialog .el-input__count) {
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.3) !important;
}
</style>
