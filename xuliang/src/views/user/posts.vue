<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { View, ChatDotRound, Setting, StarFilled, Calendar, ArrowRight, CirclePlus } from "@element-plus/icons-vue";
import { getPostListApi } from "../../api/community";

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

const toPostDetail = (id) => {
  router.push({ name: "community-detail", params: { id: String(id) } });
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

onMounted(async () => {
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
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
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
          <el-icon><CirclePlus /></el-icon>
        </el-button>
      </div>

      <div class="post-cards-stack">
        <div v-for="item in myPosts" :key="item.postId" class="post-list-itemgroup" @click="toPostDetail(item.postId)">
          <div class="post-thumb-placeholder" :style="getPostThumbStyle(item)">
            <span class="music-note-icon">♪</span>
          </div>

          <div class="post-text-content">
            <div class="post-title-row">
              <el-tag v-if="item.isTop === '1'" size="small" class="tag-top">置顶</el-tag>
              <el-tag v-if="item.isEssence === '1'" size="small" class="tag-essence">精华</el-tag>
              <h4 class="post-title-text">{{ item.title || "未命名帖子" }}</h4>
            </div>

            <p class="post-summary-text">{{ item.content || "暂无正文内容" }}</p>

            <div class="post-meta-bottom-row">
              <span class="post-time-stamp">
                <el-icon><Calendar /></el-icon>
                {{ item.createTime }}
              </span>
              <div class="post-stats-indicators">
                <span class="indicator-item">
                  <el-icon class="indicator-icon"><View /></el-icon>
                  {{ formatCount(item.viewCount) }}
                </span>
                <span class="indicator-item">
                  <el-icon class="indicator-icon"><ChatDotRound /></el-icon>
                  {{ formatCount(item.replyCount || 0) }}
                </span>
              </div>
            </div>
          </div>

          <div class="post-actions">
            <button class="icon-action-btn" type="button" aria-label="帖子操作" @click.stop>
              <el-icon><Setting /></el-icon>
            </button>
            <el-icon v-if="item.isTop === '1' || item.isEssence === '1'" class="featured-icon">
              <StarFilled />
            </el-icon>
            <el-icon class="enter-icon"><ArrowRight /></el-icon>
          </div>
        </div>

        <div v-if="myPosts.length === 0" class="empty-placeholder-text">
          <div class="empty-icon">
            <el-icon><CirclePlus /></el-icon>
          </div>
          <h4>还没有发布过帖子</h4>
          <p>去社区分享一段音乐故事、现场回忆或者创作想法。</p>
          <el-button class="empty-action-btn" @click="router.push({ name: 'community' })"> 去发布 </el-button>
        </div>
      </div>
    </section>
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
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.55;
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
</style>
