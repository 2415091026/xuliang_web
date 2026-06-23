<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { View, ChatDotRound, Setting, StarFilled, Calendar, ArrowRight, CirclePlus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getPostListApi, deletePostApi, appealPostApi } from "../../api/community";

const router = useRouter();
const myPosts = ref([]);
const loading = ref(false);

const postStats = computed(() => {
  return myPosts.value.reduce(
    (acc, item) => {
      acc.views += item.viewCount || 0;
      acc.replies += item.replyCount || 0;
      if (item.isTop === "1" || item.isEssence === "1") {
        acc.featured += 1;
      }
      return acc;
    },
    { views: 0, replies: 0, featured: 0 }
  );
});

const toPostDetail = (item) => {
  if (item.auditStatus === "1") {
    ElMessage.warning("该帖子已违规下架，暂无法查看。您可以发起申诉。");
    return;
  }
  if (item.auditStatus === "2") {
    ElMessage.warning("该帖子正在申诉复核中，暂无法查看。");
    return;
  }
  if (item.auditStatus === "3") {
    ElMessage.warning("该帖子已永久下架，无法查看。");
    return;
  }
  router.push({ name: "community-detail", params: { id: String(item.postId) } });
};

const getPostThumbStyle = (post) => {
  const gradients = ["linear-gradient(135deg, #d77475 0%, #8b3e5a 100%)", "linear-gradient(135deg, #f2b84b 0%, #8b3e5a 100%)", "linear-gradient(135deg, #8b3e5a 0%, #2b1f32 100%)"];
  const index = post.postId ? Number(post.postId) % gradients.length : 0;
  return {
    background: gradients[index]
  };
};

const formatJoinDate = (timeStr) => {
  if (!timeStr) return "2024-01-15";
  const date = new Date(timeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatCount = (count) => {
  if (count === undefined || count === null) return "0";
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }
  return count;
};

// 获取我的帖子列表数据
const fetchMyPosts = async () => {
  const infoStr = localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
  if (infoStr) {
    try {
      const userInfo = JSON.parse(infoStr);
      loading.value = true;
      const postRes = await getPostListApi({
        pageNum: 1,
        pageSize: 100,
        userId: String(userInfo.userId)
      });
      if (postRes && postRes.code === 200 && postRes.data) {
        myPosts.value = postRes.data.list || [];
      }
    } catch (e) {
      console.error("加载帖子列表失败：", e);
    } finally {
      loading.value = false;
    }
  }
};

// 触发下拉菜单的操作回调
const handleCommand = (command, postId) => {
  if (command === "appeal") {
    appealForm.value.postId = postId;
    appealDialogVisible.value = true;
  } else if (command === "delete") {
    ElMessageBox.confirm(
      "确定要永久删除这篇帖子吗？此操作将无法撤回。",
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        buttonSize: "small"
      }
    )
      .then(async () => {
        try {
          loading.value = true;
          const res = await deletePostApi(postId);
          if (res && res.code === 200) {
            ElMessage.success("帖子删除成功！");
            await fetchMyPosts(); // 重新加载数据刷新列表
          }
        } catch (e) {
          console.error("删除帖子失败：", e);
        } finally {
          loading.value = false;
        }
      })
      .catch(() => {});
  }
};

const appealDialogVisible = ref(false);
const appealLoading = ref(false);
const appealForm = ref({
  postId: null,
  appealReason: ""
});

const handleCloseAppeal = () => {
  appealDialogVisible.value = false;
  appealForm.value.postId = null;
  appealForm.value.appealReason = "";
};

const submitAppeal = async () => {
  if (!appealForm.value.appealReason.trim()) {
    ElMessage.warning("请输入申诉原因");
    return;
  }
  try {
    appealLoading.value = true;
    const res = await appealPostApi({
      postId: appealForm.value.postId,
      appealReason: appealForm.value.appealReason
    });
    if (res && res.code === 200) {
      ElMessage.success("申诉提交成功，请等待管理员复核");
      handleCloseAppeal();
      await fetchMyPosts();
    } else {
      ElMessage.error(res.message || "申诉提交失败");
    }
  } catch (e) {
    console.error("提交申诉失败：", e);
  } finally {
    appealLoading.value = false;
  }
};

onMounted(() => {
  fetchMyPosts();
});
</script>

<template>
  <div v-loading="loading" class="my-posts-page text-left">
    <section class="posts-overview-panel">
      <div>
        <p class="section-kicker">Community posts</p>
        <h3 class="section-title">我的全部帖子</h3>
      </div>
    </section>

    <section class="card-glass-panel posts-list-panel">
      <div class="list-toolbar">
        <div>
          <h4 class="list-title">帖子列表</h4>
          <span class="header-count">共 {{ myPosts.length }} 篇内容</span>
        </div>
        <el-button class="publish-shortcut-btn" @click="router.push({ name: 'community' })">
          发布新帖
          <el-icon>
            <CirclePlus />
          </el-icon>
        </el-button>
      </div>

      <div class="post-cards-stack">
        <div
          v-for="item in myPosts"
          :key="item.postId"
          class="post-list-itemgroup"
          :class="{ 'post-item-disabled': item.auditStatus && item.auditStatus !== '0' }"
          @click="toPostDetail(item)"
        >
          <div class="post-thumb-placeholder" :style="getPostThumbStyle(item)">
            <span class="music-note-icon">♪</span>
          </div>

          <div class="post-text-content">
            <div class="post-title-row">
              <el-tag v-if="item.isTop === '1'" size="small" class="tag-top">置顶</el-tag>
              <el-tag v-if="item.isEssence === '1'" size="small" class="tag-essence">精华</el-tag>
              <el-tag v-if="item.auditStatus === '1'" size="small" class="tag-status-violation">违规下架</el-tag>
              <el-tag v-if="item.auditStatus === '2'" size="small" class="tag-status-appealing">申诉中</el-tag>
              <el-tag v-if="item.auditStatus === '3'" size="small" class="tag-status-rejected">已驳回</el-tag>
              <h4 class="post-title-text">{{ item.title || "未命名帖子" }}</h4>
            </div>

            <p class="post-summary-text" v-html="item.content"></p>

            <div class="post-meta-bottom-row">
              <span class="post-time-stamp">
                <el-icon>
                  <Calendar />
                </el-icon>
                {{ item.createTime }}
              </span>
              <div class="post-stats-indicators">
                <span class="indicator-item">
                  <el-icon class="indicator-icon">
                    <View />
                  </el-icon>
                  {{ formatCount(item.viewCount) }}
                </span>
                <span class="indicator-item">
                  <el-icon class="indicator-icon">
                    <ChatDotRound />
                  </el-icon>
                  {{ formatCount(item.replyCount || 0) }}
                </span>
              </div>
            </div>
          </div>

          <div class="post-actions">
            <!-- 帖子操作下拉菜单 -->
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, item.postId)">
              <button class="icon-action-btn" type="button" aria-label="帖子操作" @click.stop>
                <el-icon>
                  <Setting />
                </el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu class="dark-dropdown-menu">
                  <el-dropdown-item v-if="item.auditStatus === '1'" command="appeal" class="!text-[#f2b84b] font-bold">申请申诉</el-dropdown-item>
                  <el-dropdown-item command="delete" class="!text-[#ff4f63] font-bold">删除帖子</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-icon v-if="item.isTop === '1' || item.isEssence === '1'" class="featured-icon">
              <StarFilled />
            </el-icon>
            <el-icon class="enter-icon">
              <ArrowRight />
            </el-icon>
          </div>
        </div>

        <div v-if="myPosts.length === 0" class="empty-placeholder-text">
          <div class="empty-icon">
            <el-icon>
              <CirclePlus />
            </el-icon>
          </div>
          <h4>还没有发布过帖子</h4>
          <p>去社区分享一段音乐故事、现场回忆或者创作想法。</p>
          <el-button class="empty-action-btn" @click="router.push({ name: 'community' })"> 去发布 </el-button>
        </div>
      </div>
    </section>

    <!-- 发起申诉对话框 -->
    <el-dialog
      v-model="appealDialogVisible"
      title="发起帖子申诉"
      width="460px"
      :before-close="handleCloseAppeal"
      class="dark-appeal-dialog"
      :append-to-body="true"
    >
      <div class="dialog-body-content">
        <p class="appeal-guide-text">
          您的帖子已被下架。如果您认为此处理存在误判，请在此填写申诉理由并提交，管理员将尽快复核。
        </p>
        <el-input
          v-model="appealForm.appealReason"
          type="textarea"
          :rows="5"
          placeholder="请详细填写申诉理由（限 500 字）..."
          maxlength="500"
          show-word-limit
          class="dark-appeal-textarea"
        />
      </div>
      <template #footer>
        <div class="dialog-footer-actions">
          <el-button class="cancel-dialog-btn" @click="handleCloseAppeal">取消</el-button>
          <el-button class="submit-dialog-btn" :loading="appealLoading" @click="submitAppeal">确认提交</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.my-posts-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.posts-overview-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: radial-gradient(circle at 16% 0%, rgba(215, 116, 117, 0.22), transparent 34%), linear-gradient(135deg, rgba(22, 23, 30, 0.9), rgba(14, 15, 20, 0.86));
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.section-kicker {
  margin: 0 0 8px;
  color: rgba(242, 184, 75, 0.7);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-title {
  font-size: 22px;
  font-weight: 900;
  color: #fff8ea;
  margin: 0;
  line-height: 1.2;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(82px, 1fr));
  gap: 10px;
  min-width: 420px;
}

.overview-stat-card {
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.035);
}

.overview-stat-card strong {
  color: #fff;
  font-size: 22px;
  font-weight: 900;
  line-height: 1;
}

.stat-label {
  color: rgba(255, 255, 255, 0.42);
  font-size: 11px;
  font-weight: 800;
}

.posts-list-panel {
  padding: 22px 24px 24px;
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.list-title {
  margin: 0 0 5px;
  color: #fff8ea;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.2;
}

.header-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.38);
  font-weight: 700;
}

.publish-shortcut-btn,
.empty-action-btn {
  height: 36px !important;
  border: none !important;
  border-radius: 999px !important;
  background: linear-gradient(90deg, #d77475 0%, #f2b84b 100%) !important;
  color: #fff !important;
  font-size: 12px !important;
  font-weight: 900 !important;
  padding: 0 16px !important;
  box-shadow: 0 10px 22px rgba(215, 116, 117, 0.2) !important;
}

.post-cards-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-list-itemgroup {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 18px;
  min-height: 118px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.055);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.012)), rgba(11, 12, 17, 0.62);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background-color 0.22s ease,
    box-shadow 0.22s ease;
  cursor: pointer;
}

.post-list-itemgroup:hover {
  transform: translateY(-2px);
  border-color: rgba(242, 184, 75, 0.22);
  background-color: rgba(255, 255, 255, 0.035);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
}

.post-thumb-placeholder {
  width: 86px;
  height: 86px;
  border-radius: 16px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
}

.post-thumb-placeholder::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.22), transparent 34%);
}

.music-note-icon {
  position: relative;
  z-index: 1;
  font-size: 34px;
  color: rgba(255, 255, 255, 0.58);
  font-weight: 900;
}

.post-text-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  padding: 2px 0;
}

.post-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  min-width: 0;
}

.tag-top {
  background-color: rgba(242, 184, 75, 0.15) !important;
  border: none !important;
  color: #f2b84b !important;
  font-weight: 900 !important;
  font-size: 9px !important;
}

.tag-essence {
  background-color: rgba(215, 116, 117, 0.15) !important;
  border: none !important;
  color: #d77475 !important;
  font-weight: 900 !important;
  font-size: 9px !important;
}

.post-title-text {
  font-size: 15px;
  font-weight: 900;
  color: #fff;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
  line-height: 1.35;
}

.post-list-itemgroup:hover .post-title-text {
  color: #f2b84b;
}

.post-summary-text {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.46);
  margin: 0;
  line-height: 1.55;
  max-height: 180px; /* 限制总高度，防止用户发表过多内容时撑坏卡片 */
  overflow: hidden;
  display: block;
}

/* 允许富文本段落留有微小间距 */
.post-summary-text :deep(p) {
  margin: 4px 0;
}

/* 限制富文本图片为精美的缩略图，避免巨图撑爆卡片 */
.post-summary-text :deep(img) {
  max-width: 180px;
  max-height: 120px;
  width: auto;
  height: auto;
  object-fit: cover;
  border-radius: 8px;
  margin: 6px 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: block;
}

/* 限制富视频大小 */
.post-summary-text :deep(video) {
  max-width: 220px;
  max-height: 130px;
  width: auto;
  height: auto;
  border-radius: 8px;
  margin: 6px 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: block;
}

.post-meta-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
}

.post-time-stamp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 700;
}

.post-stats-indicators {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.48);
}

.indicator-item {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 52px;
  justify-content: center;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.035);
}

.indicator-icon {
  font-size: 12px;
}

.post-actions {
  width: 48px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
}

.icon-action-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.icon-action-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff8ea;
}

.featured-icon {
  color: #f2b84b;
  filter: drop-shadow(0 0 10px rgba(242, 184, 75, 0.35));
}

.enter-icon {
  color: rgba(255, 255, 255, 0.28);
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.post-list-itemgroup:hover .enter-icon {
  transform: translateX(3px);
  color: #f2b84b;
}

.empty-placeholder-text {
  min-height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 13px;
}

.empty-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 50%;
  color: #f2b84b;
  background: rgba(242, 184, 75, 0.1);
  border: 1px solid rgba(242, 184, 75, 0.18);
}

.empty-placeholder-text h4 {
  margin: 0 0 8px;
  color: #fff8ea;
  font-size: 16px;
  font-weight: 900;
}

.empty-placeholder-text p {
  max-width: 320px;
  margin: 0 0 18px;
  line-height: 1.7;
}

.card-glass-panel {
  min-width: 0;
  box-sizing: border-box;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(16, 17, 22, 0.8);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

@media (max-width: 900px) {

  .posts-overview-panel,
  .list-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .overview-stats {
    min-width: 0;
    grid-template-columns: repeat(2, 1fr);
  }

  .publish-shortcut-btn {
    width: 100% !important;
  }
}

@media (max-width: 640px) {

  .posts-overview-panel,
  .posts-list-panel {
    padding: 18px;
    border-radius: 18px;
  }

  .post-list-itemgroup {
    gap: 12px;
    padding: 14px;
  }

  .post-thumb-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 14px;
  }

  .music-note-icon {
    font-size: 26px;
  }

  .post-actions {
    display: none;
  }

  .post-meta-bottom-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
}

/* 暗黑主题下拉菜单背景与字体微调 */
:deep(.dark-dropdown-menu) {
  background-color: #1a1b20 !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

:deep(.dark-dropdown-menu .el-dropdown-menu__item) {
  color: rgba(255, 255, 255, 0.6) !important;
}

:deep(.dark-dropdown-menu .el-dropdown-menu__item:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #fff !important;
}

/* 状态标签样式 */
.tag-status-violation {
  background-color: rgba(255, 79, 99, 0.15) !important;
  border: 1px solid rgba(255, 79, 99, 0.25) !important;
  color: #ff4f63 !important;
  font-weight: 900 !important;
  font-size: 10px !important;
}

.tag-status-appealing {
  background-color: rgba(242, 184, 75, 0.15) !important;
  border: 1px solid rgba(242, 184, 75, 0.25) !important;
  color: #f2b84b !important;
  font-weight: 900 !important;
  font-size: 10px !important;
}

.tag-status-rejected {
  background-color: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.5) !important;
  font-weight: 900 !important;
  font-size: 10px !important;
}

/* 卡片禁用/下架态样式微调 */
.post-item-disabled {
  opacity: 0.68;
}

.post-list-itemgroup.post-item-disabled:hover {
  border-color: rgba(255, 255, 255, 0.055) !important;
  background-color: rgba(11, 12, 17, 0.62) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025) !important;
  transform: none !important;
}

.post-list-itemgroup.post-item-disabled:hover .post-title-text {
  color: #fff !important;
}

.post-list-itemgroup.post-item-disabled:hover .enter-icon {
  transform: none !important;
  color: rgba(255, 255, 255, 0.28) !important;
}

/* 对话框整体磨砂玻璃暗黑风格（使用 :global 以挂载至 body 的 dialog） */
:global(.dark-appeal-dialog) {
  background: rgba(22, 23, 29, 0.92) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

:global(.dark-appeal-dialog .el-dialog__title) {
  color: #fff8ea !important;
  font-weight: 900 !important;
  font-size: 16px !important;
}

:global(.dark-appeal-dialog .el-dialog__close) {
  color: rgba(255, 255, 255, 0.4) !important;
}

:global(.dark-appeal-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: #f2b84b !important;
}

:global(.dark-appeal-dialog .el-dialog__body) {
  padding: 20px 24px !important;
}

:global(.dark-appeal-dialog .appeal-guide-text) {
  margin: 0 0 16px 0;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

:global(.dark-appeal-dialog .dark-appeal-textarea .el-textarea__inner) {
  background-color: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 12px !important;
  color: #fff !important;
  font-size: 13px !important;
  padding: 10px 12px !important;
  transition: border-color 0.25s ease, box-shadow 0.25s ease !important;
}

:global(.dark-appeal-dialog .dark-appeal-textarea .el-textarea__inner:focus) {
  border-color: rgba(242, 184, 75, 0.5) !important;
  box-shadow: 0 0 10px rgba(242, 184, 75, 0.15) !important;
}

:global(.dark-appeal-dialog .dark-appeal-textarea .el-input__count) {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.3) !important;
  bottom: 8px !important;
  right: 12px !important;
}

:global(.dark-appeal-dialog .el-dialog__footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
  padding: 14px 24px !important;
}

:global(.dark-appeal-dialog .dialog-footer-actions) {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:global(.dark-appeal-dialog .cancel-dialog-btn) {
  background: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 8px !important;
  font-weight: 700 !important;
  transition: all 0.2s ease !important;
}

:global(.dark-appeal-dialog .cancel-dialog-btn:hover) {
  border-color: rgba(255, 255, 255, 0.25) !important;
  color: #fff !important;
}

:global(.dark-appeal-dialog .submit-dialog-btn) {
  background: linear-gradient(90deg, #d77475 0%, #f2b84b 100%) !important;
  border: none !important;
  color: #fff !important;
  border-radius: 8px !important;
  font-weight: 900 !important;
  box-shadow: 0 6px 15px rgba(215, 116, 117, 0.15) !important;
  transition: all 0.2s ease !important;
}

:global(.dark-appeal-dialog .submit-dialog-btn:hover) {
  box-shadow: 0 8px 20px rgba(215, 116, 117, 0.25) !important;
  transform: translateY(-1px);
}
</style>
