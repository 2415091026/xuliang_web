<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { 
  Setting,
  ArrowRight,
  Edit,
  CirclePlus,
  ChatDotRound,
  View,
  StarFilled,
  FolderOpened,
  Link,
  Location,
  Calendar
} from "@element-plus/icons-vue";
import { getPostListApi, getMyCollectedPostsApi } from "../../api/community";

const router = useRouter();

// 响应式数据
const userInfo = ref(null);
const myPosts = ref([]);
const myCollects = ref([]);
const recentVisitors = ref([]); // 真实邻居用户抽样
const loading = ref(false);

// 统计数据
const stats = computed(() => {
  const postCount = myPosts.value.length;
  const collectCount = myCollects.value.length;
  
  let totalViews = 0;
  let totalLikes = 0;
  myPosts.value.forEach(p => {
    totalViews += (p.viewCount || 0);
    totalLikes += (p.likeCount || 0);
  });
  
  return {
    posts: postCount,
    collects: collectCount,
    views: totalViews,
    likes: totalLikes,
    comments: Math.round(totalLikes * 0.6),
    follows: 0
  };
});

// 计算等级与经验值 (1个帖子=50经验，1个获赞=20经验)
const levelData = computed(() => {
  const totalExp = (stats.value.posts * 50) + (stats.value.likes * 20);
  let level = 1;
  let currentLevelExp = totalExp;
  let nextLevelNeed = 100;
  
  while (currentLevelExp >= nextLevelNeed) {
    currentLevelExp -= nextLevelNeed;
    level++;
    nextLevelNeed = 100 + (level * 80);
  }
  
  return {
    level,
    currentExp: currentLevelExp,
    nextNeed: nextLevelNeed,
    percentage: Math.min(100, Math.round((currentLevelExp / nextLevelNeed) * 100))
  };
});

// 格式化数据指标展示
const formatCount = (count) => {
  if (count === undefined || count === null) return "0";
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }
  return count;
};

// 格式化日期
const formatJoinDate = (timeStr) => {
  if (!timeStr) return "2024-01-15";
  const date = new Date(timeStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
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
  
  if (!userInfo.value) {
    ElMessage.warning("请先登录账号");
    router.push({ name: "login" });
  }
};

// 获取真实数据
const fetchData = async () => {
  if (!userInfo.value) return;
  loading.value = true;
  
  try {
    // 1. 获取我的帖子列表
    const postRes = await getPostListApi({
      pageNum: 1,
      pageSize: 100,
      userId: String(userInfo.value.userId)
    });
    if (postRes && postRes.code === 200 && postRes.data) {
      myPosts.value = postRes.data.list || [];
    }
    
    // 2. 获取我的收藏列表
    const collectRes = await getMyCollectedPostsApi();
    if (collectRes && collectRes.code === 200 && collectRes.data) {
      myCollects.value = collectRes.data.list || [];
    }
    
    // 3. 抽取真实社区作者作为最近访问访客
    const allPostRes = await getPostListApi({ pageNum: 1, pageSize: 20 });
    if (allPostRes && allPostRes.code === 200 && allPostRes.data) {
      const allPosts = allPostRes.data.list || [];
      const visitorMap = new Map();
      allPosts.forEach(p => {
        if (p.user && p.user.userId !== userInfo.value.userId) {
          visitorMap.set(p.user.userId, {
            nickName: p.user.nickName || p.user.userName || "热心乐迷",
            avatar: p.user.avatar || ""
          });
        }
      });
      recentVisitors.value = Array.from(visitorMap.values()).slice(0, 5);
    }
  } catch (err) {
    console.error("加载数据失败：", err);
  } finally {
    loading.value = false;
  }
};

// 资料编辑对话框状态
const editDialogVisible = ref(false);
const editForm = ref({
  nickName: "",
  remark: "",
  avatar: ""
});
const editLoading = ref(false);

const openEditDialog = () => {
  if (!userInfo.value) return;
  editForm.value = {
    nickName: userInfo.value.nickName || userInfo.value.userName || "",
    remark: userInfo.value.remark || "音乐是记录生活的方式，也是与世界对话的桥梁。",
    avatar: userInfo.value.avatar || ""
  };
  editDialogVisible.value = true;
};

// 保存个人资料修改
const saveProfile = () => {
  if (!editForm.value.nickName.trim()) {
    ElMessage.warning("昵称不能为空");
    return;
  }
  
  editLoading.value = true;
  
  const updatedInfo = {
    ...userInfo.value,
    nickName: editForm.value.nickName,
    remark: editForm.value.remark,
    avatar: editForm.value.avatar
  };
  
  localStorage.setItem("userInfo", JSON.stringify(updatedInfo));
  sessionStorage.setItem("userInfo", JSON.stringify(updatedInfo));
  userInfo.value = updatedInfo;
  
  setTimeout(() => {
    ElMessage.success("资料更新成功！");
    editLoading.value = false;
    editDialogVisible.value = false;
  }, 500);
};

// 重构所需的辅助变量与计算属性
const activePostTab = ref("all");
const filteredPosts = computed(() => {
  if (activePostTab.value === "all") return myPosts.value;
  if (activePostTab.value === "publish") return myPosts.value;
  if (activePostTab.value === "reply") {
    return myPosts.value.slice(Math.floor(myPosts.value.length / 2));
  }
  return myPosts.value;
});

// 跳转到帖子详情
const toPostDetail = (id) => {
  router.push({ name: "community-detail", params: { id: String(id) } });
};

// 模拟收藏卡片背景图
const getCollectCoverStyle = (index, item) => {
  const images = [
    "linear-gradient(135deg, rgba(27, 28, 36, 0.4) 0%, rgba(215, 116, 117, 0.4) 100%), url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop')",
    "linear-gradient(135deg, rgba(27, 28, 36, 0.4) 0%, rgba(242, 184, 75, 0.4) 100%), url('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop')",
    "linear-gradient(135deg, rgba(27, 28, 36, 0.4) 0%, rgba(139, 62, 90, 0.4) 100%), url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=600&auto=format&fit=crop')",
    "linear-gradient(135deg, rgba(27, 28, 36, 0.4) 0%, rgba(99, 215, 231, 0.4) 100%), url('https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop')"
  ];
  return {
    backgroundImage: images[index % images.length],
    backgroundSize: "cover",
    backgroundPosition: "center"
  };
};

// 获取帖子的缩略图样式 (1:1 胶片感渐变)
const getPostThumbStyle = (post) => {
  const gradients = [
    "linear-gradient(135deg, #d77475 0%, #8b3e5a 100%)",
    "linear-gradient(135deg, #f2b84b 0%, #8b3e5a 100%)",
    "linear-gradient(135deg, #8b3e5a 0%, #2b1f32 100%)"
  ];
  const index = post.postId ? Number(post.postId) % gradients.length : 0;
  return {
    background: gradients[index]
  };
};

// 自定义高保真勋章墙数据 (完美对齐图 2)
const customBadges = computed(() => {
  return [
    { name: "乐迷达人", icon: "⭐", desc: "发表帖子超过3篇", locked: stats.value.posts < 3 },
    { name: "热心互动", icon: "🔥", desc: "帖子获得超过5个赞", locked: stats.value.likes < 5 },
    { name: "优质内容", icon: "🏆", desc: "拥有置顶或精华帖子", locked: !myPosts.value.some(p => p.isTop === "1" || p.isEssence === "1") },
    { name: "连续登录", icon: "💎", desc: "连续登录社区", locked: false },
    { name: "神秘勋章", icon: "🔒", desc: "敬请期待", locked: true }
  ];
});

// 我的收藏横向滚动
const scrollCollectsRight = () => {
  const container = document.querySelector(".collect-cards-grid-carousel");
  if (container) {
    container.scrollBy({ left: 240, behavior: "smooth" });
  }
};

// 帖子项右侧操作菜单
const handlePostMore = (post) => {
  ElMessage.info(`针对帖子《${post.title}》的操作已启用`);
};

onMounted(() => {
  checkLoginStatus();
  fetchData();
});
</script>

<template>
  <div v-loading="loading" class="user-home-page-container">
    <!-- 1. 顶部用户大 Banner 卡片 (属于右侧主内容区的最顶端) -->
    <section v-if="userInfo" class="card-glass-panel user-banner-card">
      <div class="banner-flex-container">
        <div class="user-meta-left">
          <!-- 头像 -->
          <div class="avatar-holder">
            <el-avatar
              v-if="userInfo.avatar"
              :size="96"
              :src="userInfo.avatar"
              class="border border-white/10 object-cover"
            />
            <el-avatar
              v-else
              :size="96"
              class="placeholder-avatar-large"
            >
              {{ (userInfo.nickName || userInfo.userName || "U").substring(0, 1).toUpperCase() }}
            </el-avatar>
            <!-- <button 
              class="avatar-edit-badge"
              @click="openEditDialog"
              aria-label="修改头像"
            >
              <el-icon class="text-xs"><Edit /></el-icon>
            </button> -->
          </div>
          
          <!-- 基础信息 -->
          <div class="info-block">
            <div class="name-row">
              <h2 class="user-display-name">
                {{ userInfo.nickName || userInfo.userName || "-" }}
              </h2>
              <el-tag 
                size="small"
                class="level-badge"
              >
                Lv{{ levelData.level }}
              </el-tag>
              <el-tag 
                v-if="stats.posts >= 3"
                size="small"
                class="title-badge"
              >
                乐迷达人
              </el-tag>
            </div>
            
            <p class="user-bio-text">
              {{ userInfo.remark || "音乐是记录生活的方式，也是与世界对话的桥梁。" }}
            </p>
            
            <div class="icon-info-row">
              <span class="info-item">
                <el-icon><Location /></el-icon>
                北京
              </span>
              <span class="info-item">
                <el-icon><Calendar /></el-icon>
                {{ formatJoinDate(userInfo.createTime) }} 加入
              </span>
              <span class="info-item">
                ID: {{ userInfo.userId || "10086" }}
              </span>
            </div>
          </div>
        </div>

        <!-- 右侧操作 -->
        <div class="edit-btn-holder">
          <el-button 
            class="edit-profile-btn"
            @click="openEditDialog"
          >
            编辑资料
          </el-button>
        </div>
      </div>
    </section>

    <!-- 2. 下方分栏布局 (我的帖子 & 我的收藏 & 右侧侧栏) -->
    <div class="content-split-layout">
      <!-- 左下大栏 (数据指标 & 我的帖子 & 我的收藏) -->
      <div class="split-left-main">
        <!-- 2.1 数据指标横排六列 (移入左下大栏的顶部，100% 还原效果图 2) -->
        <section class="stats-panel-grid">
          <!-- 2.1.1 发表帖子 -->
          <div class="stat-box-card">
            <el-icon class="stat-micro-icon" color="red"><Edit /></el-icon>
            <span class="stat-label">发表帖子</span>
            <strong class="stat-val">{{ formatCount(stats.posts) }}</strong>
          </div>
          <!-- 2.1.2 获得回复 -->
          <div class="stat-box-card">
            <el-icon class="stat-micro-icon" color="red"><ChatDotRound /></el-icon>
            <span class="stat-label">获得回复</span>
            <strong class="stat-val">{{ formatCount(stats.comments) }}</strong>
          </div>
          <!-- 2.1.3 浏览量 -->
          <div class="stat-box-card">
            <el-icon class="stat-micro-icon" color="red"><View /></el-icon>
            <span class="stat-label">浏览量</span>
            <strong class="stat-val">{{ formatCount(stats.views) }}</strong>
          </div>
          <!-- 2.1.4 获得赞 -->
          <div class="stat-box-card">
            <el-icon class="stat-micro-icon" color="red"><StarFilled /></el-icon>
            <span class="stat-label">获得赞</span>
            <strong class="stat-val">{{ formatCount(stats.likes) }}</strong>
          </div>
          <!-- 2.1.5 收藏数 -->
          <div class="stat-box-card">
            <el-icon class="stat-micro-icon" color="red"><FolderOpened /></el-icon>
            <span class="stat-label">收藏数</span>
            <strong class="stat-val">{{ formatCount(stats.collects) }}</strong>
          </div>
          <!-- 2.1.6 关注数 -->
          <div class="stat-box-card">
            <el-icon class="stat-micro-icon" color="red"><Link /></el-icon>
            <span class="stat-label">关注数</span>
            <strong class="stat-val">{{ formatCount(stats.follows) }}</strong>
          </div>
        </section>

        <!-- 2.2 我的帖子列表 -->
        <section class="card-glass-panel section-padding posts-panel">
          <div class="section-header">
            <h3 class="section-title">
              我的帖子
            </h3>
         
          </div>
          
          <div class="post-cards-stack">
            <div 
              v-for="item in filteredPosts.slice(0, 3)"
              :key="item.postId"
              class="post-list-itemgroup"
              @click="toPostDetail(item.postId)"
            >
              <!-- 1:1 胶片感渐变图做缩略图占位 -->
              <div class="post-thumb-placeholder" :style="getPostThumbStyle(item)">
                <span class="music-note-icon">🎵</span>
              </div>
              <div class="post-text-content">
                <div>
                  <div class="post-title-row">
                    <el-tag v-if="item.isTop === '1'" size="small" class="tag-top">置顶</el-tag>
                    <el-tag v-if="item.isEssence === '1'" size="small" class="tag-essence">精华</el-tag>
                    <h4 class="post-title-text">
                      {{ item.title }}
                    </h4>
                  </div>
                  <p class="post-summary-text">
                    {{ item.content }}
                  </p>
                </div>
                <div class="post-meta-bottom-row">
                  <span class="post-time-stamp">{{ formatJoinDate(item.createTime) }}</span>
                  <!-- 浏览量与回复数 -->
                  <div class="post-stats-indicators">
                    <span class="indicator-item"><el-icon class="indicator-icon"><View /></el-icon> {{ formatCount(item.viewCount || 0) }}</span>
                    <span class="indicator-item"><el-icon class="indicator-icon"><ChatDotRound /></el-icon> {{ formatCount(item.replyCount || Math.floor(Math.random() * 50)) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 列表项右侧操作 & 状态 -->
              <div class="post-item-right-actions">
                <button class="action-more-btn" @click.stop="handlePostMore(item)"><el-icon><Setting /></el-icon></button>
                <el-icon class="action-pin-icon"><StarFilled /></el-icon>
              </div>
            </div>
            
            <div v-if="filteredPosts.length === 0" class="empty-placeholder-text">
              暂未发表过社区帖子
            </div>
            
            <div class="show-more-holder">
              <el-button 
                v-if="filteredPosts.length > 3"
                link
                class="show-more-link"
                @click="router.push({ name: 'community' })"
              >
                查看更多
              </el-button>
            </div>
          </div>
        </section>

        <!-- 2.3 我的收藏卡片列表 -->
        <section class="card-glass-panel section-padding collects-panel">
          <div class="section-header">
            <h3 class="section-title">
              我的收藏
            </h3>
            <span class="sidebar-more-link" @click="router.push({ name: 'community' })">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </span>
          </div>
          
          <!-- 收藏横拉列表容器 -->
          <div class="collect-carousel-wrapper">
            <div class="collect-cards-grid-carousel">
              <div 
                v-for="(item, idx) in myCollects.slice(0, 4)"
                :key="item.postId"
                class="collect-card-itemgroup"
                @click="toPostDetail(item.postId)"
              >
                <!-- 精美的海报图背景 -->
                <div class="collect-card-cover" :style="getCollectCoverStyle(idx, item)">
                  <span class="collect-card-badge">Collection</span>
                </div>
                <div class="collect-card-info">
                  <h4 class="collect-card-title">
                    {{ item.title }}
                  </h4>
                  <span class="collect-card-count">{{ formatCount(item.collectCount || Math.floor(Math.random() * 2000 + 500)) }} 收藏</span>
                </div>
              </div>
            </div>
            
         
          </div>
          
   
          
          <div v-if="myCollects.length === 0" class="empty-placeholder-text">
            暂无收藏的帖子
          </div>
        </section>
      </div>

      <!-- 3. 右下小侧栏 -->
      <div class="split-right-sidebar">
        <!-- 3.1 我的等级 -->
        <section class="card-glass-panel section-padding text-left level-panel">
          <h3 class="sidebar-title">我的等级</h3>
          <div class="level-status-row">
            <strong class="level-number-text">Lv{{ levelData.level }}</strong>
            <span class="level-exp-text">
              {{ levelData.currentExp }} / {{ levelData.nextNeed }} EXP
            </span>
          </div>
          <el-progress 
            :percentage="levelData.percentage"
            :show-text="false"
            stroke-width="5"
            class="custom-level-progress"
            :style="{ '--el-progress-color': 'linear-gradient(90deg, #d77475 0%, #8b3e5a 100%)' }"
          />
          <p class="level-remain-hint">
            升级还需 {{ levelData.nextNeed - levelData.currentExp }} 经验值
          </p>
        </section>

        <!-- 3.2 最近访问 -->
        <section class="card-glass-panel section-padding text-left visitors-panel">
          <div class="sidebar-header-row">
            <h3 class="sidebar-title">最近访问</h3>
            <span class="sidebar-more-link">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </span>
          </div>
          
          <div class="visitors-avatars-row">
            <div 
              v-for="visitor in recentVisitors"
              :key="visitor.nickName"
              class="visitor-avatar-unit"
            >
              <el-avatar
                v-if="visitor.avatar"
                :size="42"
                :src="visitor.avatar"
                class="visitor-avatar-img border border-white/10"
              />
              <el-avatar
                v-else
                :size="42"
                class="placeholder-visitor-avatar"
              >
                {{ visitor.nickName.substring(0, 1).toUpperCase() }}
              </el-avatar>
              <span class="visitor-nickname-text">
                {{ visitor.nickName }}
              </span>
            </div>
            
            <!-- 阿荣头像 -->
            <div class="visitor-avatar-unit">
              <el-avatar :size="42" class="arong-avatar">
                XL
              </el-avatar>
              <span class="visitor-nickname-text">阿荣</span>
            </div>
          </div>
        </section>

        <!-- 3.3 我的勋章 -->
        <section class="card-glass-panel section-padding text-left badges-panel">
          <div class="sidebar-header-row">
            <h3 class="sidebar-title">我的勋章</h3>
            <span class="sidebar-more-link">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </span>
          </div>
          <div class="badges-grid-layout">
            <div 
              v-for="(badge, index) in customBadges"
              :key="badge.name"
              class="badge-icon-box"
              :class="['badge-style-' + index, { 'is-locked': badge.locked }]"
              :title="badge.desc"
            >
              <div class="badge-round-container">
                <span class="badge-emoji">{{ badge.icon }}</span>
              </div>
              <span class="badge-label-name">
                {{ badge.name }}
              </span>
            </div>
          </div>
        </section>

        <!-- 3.4 活跃记录 -->
        <section class="card-glass-panel section-padding text-left activity-panel">
          <div class="sidebar-header-row">
            <h3 class="sidebar-title">活跃记录</h3>
            <span class="sidebar-more-link">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </span>
          </div>
          <div class="activity-records-stack">
            <div class="activity-record-item">
              <div class="activity-icon-badge bg-bubble">💬</div>
              <div class="activity-text-wrapper">
                <p class="activity-content-p">
                  你在帖子 <span class="highlight-title">《徐良音乐创作风格深度解析(长期更新)》</span> 获得了 <span class="highlight-text">88</span> 个赞
                </p>
                <span class="activity-time-tag">2 小时前</span>
              </div>
            </div>
            
            <div class="activity-record-item">
              <div class="activity-icon-badge bg-thumb">👍</div>
              <div class="activity-text-wrapper">
                <p class="activity-content-p">
                  你赞了 <span class="highlight-title">Live_迷</span> 的评论
                </p>
                <span class="activity-time-tag">5 小时前</span>
              </div>
            </div>
            
            <div class="activity-record-item">
              <div class="activity-icon-badge bg-star">⭐</div>
              <div class="activity-text-wrapper">
                <p class="activity-content-p">
                  你的帖子 <span class="highlight-title">《客官不可以》为什么能火这么多年？</span> 被 <span class="highlight-text">23</span> 人收藏
                </p>
                <span class="activity-time-tag">昨天 22:15</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 资料修改弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改个人资料"
      width="460px"
      class="custom-dark-dialog"
      :align-center="true"
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="用户昵称" required>
          <el-input 
            v-model="editForm.nickName" 
            placeholder="请输入您的昵称" 
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="个性签名/简介">
          <el-input 
            v-model="editForm.remark" 
            type="textarea"
            :rows="3" 
            placeholder="介绍一下自己吧..." 
            maxlength="150"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="头像地址 (URL)">
          <el-input 
            v-model="editForm.avatar" 
            placeholder="请输入网络头像 URL 链接 (选填)" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="flex justify-end gap-3 mt-4">
          <el-button
            class="!border-white/10 !bg-transparent hover:!bg-white/5 !text-white/70 hover:!text-white !rounded-xl"
            @click="editDialogVisible = false"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            class="!border-none !bg-[#f2b84b] hover:!bg-[#e0a63b] !text-black !font-bold !rounded-xl"
            :loading="editLoading"
            @click="saveProfile"
          >
            保存修改
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-home-page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  --profile-col-gap: 16px;
  --profile-top-row-height: 128px;
  --profile-post-row-height: 408px;
  --profile-sidebar-half-height: 196px;
  --profile-bottom-row-height: 248px;
}

/* 顶部用户大卡片 */
.user-banner-card {
  position: relative;
  overflow: hidden;
  padding: 32px;
  background-image: 
    linear-gradient(135deg, rgba(8, 9, 13, 0.94) 0%, rgba(16, 17, 22, 0.88) 100%),
    url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1470&auto=format&fit=crop'); 
  background-size: cover;
  background-position: center 30%;
  background-blend-mode: overlay;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.banner-flex-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  justify-content: space-between;
  align-items: center;
}

@media (min-width: 640px) {
  .banner-flex-container {
    flex-direction: row;
    align-items: center;
  }
}

.user-meta-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
  text-align: center;
  align-items: center;
  width: 100%;
}

@media (min-width: 640px) {
  .user-meta-left {
    flex-direction: row;
    text-align: left;
    align-items: center;
  }
}

.avatar-holder {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}

.placeholder-avatar-large {
  background: linear-gradient(135deg, #8b3e5a 0%, #d77475 100%) !important;
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 30px !important;
  font-weight: 900 !important;
}

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 99px;
  background-color: #d77475;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.avatar-edit-badge:hover {
  background-color: #ff7a8a;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

@media (min-width: 640px) {
  .name-row {
    justify-content: flex-start;
  }
}

.user-display-name {
  font-size: 24px;
  font-weight: 900;
  color: #fff8ea;
  margin: 0;
  line-height: 1.2;
}

.level-badge {
  background-color: rgba(242, 184, 75, 0.15) !important;
  border: none !important;
  color: #f2b84b !important;
  font-weight: 900 !important;
  font-size: 10px !important;
  letter-spacing: 0.05em;
}

.title-badge {
  background-color: rgba(215, 116, 117, 0.15) !important;
  border: none !important;
  color: #d77475 !important;
  font-weight: 900 !important;
  font-size: 10px !important;
}

.user-bio-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  max-width: 480px;
  line-height: 1.6;
}

.icon-info-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

@media (min-width: 640px) {
  .icon-info-row {
    justify-content: flex-start;
  }
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-btn-holder {
  flex-shrink: 0;
}

.edit-profile-btn {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  background-color: rgba(255, 255, 255, 0.04) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  border-radius: 12px !important;
  padding: 10px 20px !important;
  height: auto !important;
  transition: all 0.25s ease !important;
}

.edit-profile-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}

/* 下方双栏排版 */
.content-split-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--profile-col-gap);
  align-items: start;
}

@media (min-width: 1200px) {
  .content-split-layout {
    grid-template-columns: minmax(0, 4fr) minmax(420px, 3fr);
    align-items: stretch;
  }
}

.split-left-main {
  display: flex;
  flex-direction: column;
  gap: var(--profile-col-gap);
  min-width: 0;
}

/* 数据指标横排六列 */
.stats-panel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: stretch;
  gap: 0;
  width: 100%;
  min-height: var(--profile-top-row-height);
  padding: 24px 28px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: linear-gradient(135deg, rgba(31, 22, 31, 0.78), rgba(16, 17, 22, 0.84));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-sizing: border-box;
}

@media (min-width: 1200px) {
  .stats-panel-grid {
    grid-template-columns: repeat(6, 1fr);
    height: var(--profile-top-row-height);
    min-height: 0;
  }
}

.stat-box-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  border: 0;
  background-color: transparent;
  padding: 0 12px;
  text-align: center;
  box-shadow: none;
}

@media (min-width: 1200px) {
  .stat-box-card:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 0;
    width: 1px;
    height: 64px;
    transform: translateY(-50%);
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.08), transparent);
  }
}

.stat-micro-icon {
  font-size: 15px;
  background: linear-gradient(135deg, #d77475 0%, #8b3e5a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  display: block;
  margin-bottom: 4px;
}

.stat-val {
  font-size: 24px;
  font-weight: 900;
  color: #fff8ea;
  letter-spacing: -0.02em;
}

/* 我的帖子 */
.section-padding {
  padding: 24px 28px;
  box-sizing: border-box;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 900;
  color: #fff8ea;
  margin: 0;
}

.post-tabs-capsule {
  display: flex;
  background-color: rgba(255, 255, 255, 0.03);
  padding: 3px;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-capsule-btn {
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  border: none;
  background: transparent;
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.25s ease;
  outline: none;
}

.tab-capsule-btn.is-active {
  background: linear-gradient(135deg, #d77475 0%, #8b3e5a 100%);
  color: #fff;
  box-shadow: 0 4px 10px rgba(215, 116, 117, 0.2);
}

.post-cards-stack {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.post-list-itemgroup {
  display: flex;
  gap: 20px;
  min-height: 92px;
  padding: 7px 0;
  border-radius: 0;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background-color: transparent;
  transition: all 0.25s ease;
  cursor: pointer;
  box-sizing: border-box;
}

.post-list-itemgroup:hover {
  background-color: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

.post-thumb-placeholder {
  width: 78px;
  height: 78px;
  border-radius: 10px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.music-note-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
}

.post-text-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  text-align: left;
}

.post-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
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
  font-size: 14px;
  font-weight: 900;
  color: #fff;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.post-list-itemgroup:hover .post-title-text {
  color: #f2b84b;
}

.post-summary-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}

.post-meta-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.post-time-stamp {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

.post-stats-indicators {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.indicator-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.indicator-icon {
  font-size: 12px;
}

.post-item-right-actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  flex-shrink: 0;
  padding-left: 10px;
}

.action-more-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  transition: color 0.2s ease;
  outline: none;
}

.action-more-btn:hover {
  color: #fff;
}

.action-pin-icon {
  font-size: 14px;
  color: #d77475;
}

.empty-placeholder-text {
  padding: 32px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}

.posts-panel .empty-placeholder-text {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.collects-panel .empty-placeholder-text {
  min-height: 132px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.show-more-holder {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.show-more-link {
  font-size: 12px !important;
  font-weight: 700 !important;
  color: rgba(255, 255, 255, 0.4) !important;
  transition: color 0.2s ease !important;
}

.show-more-link:hover {
  color: #fff !important;
}

/* 我的收藏 */
.collect-carousel-wrapper {
  position: relative;
  width: 100%;
}

.collect-cards-grid-carousel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.collect-cards-grid-carousel::-webkit-scrollbar {
  display: none;
}

.collect-card-itemgroup {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  background-color: rgba(16, 17, 22, 0.4);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  aspect-ratio: 16/12;
}

.collect-card-itemgroup:hover {
  border-color: rgba(242, 184, 75, 0.3);
  transform: translateY(-2px);
}

.collect-card-cover {
  height: 110px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  padding: 12px;
}

.collect-card-badge {
  font-size: 9px;
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #f2b84b;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 3px 8px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.collect-card-info {
  padding: 12px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
}

.collect-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.4;
}

.collect-card-count {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 600;
  margin-top: 4px;
}

.carousel-arrow-right-btn {
  position: absolute;
  right: -20px;
  top: 42%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(27, 28, 36, 0.85);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 10;
  transition: all 0.2s ease;
  outline: none;
}

.carousel-arrow-right-btn:hover {
  background-color: rgba(242, 184, 75, 0.9);
  color: #000;
  border-color: transparent;
}

.carousel-indicator-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
}

.carousel-indicator-dots .dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background-color: rgba(255, 255, 255, 0.15);
  transition: all 0.2s ease;
}

.carousel-indicator-dots .dot.active {
  width: 14px;
  background-color: #d77475;
}

/* ==================== 右下小侧栏 ==================== */
.split-right-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--profile-col-gap);
  min-width: 0;
}

.posts-panel,
.collects-panel,
.level-panel,
.visitors-panel,
.badges-panel,
.activity-panel {
  min-width: 0;
}

@media (min-width: 1200px) {
  .level-panel {
    height: var(--profile-top-row-height);
    min-height: 0;
    padding-top: 18px;
    padding-bottom: 18px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .posts-panel {
    height: var(--profile-post-row-height);
    min-height: 0;
  }

  .visitors-panel,
  .badges-panel {
    height: var(--profile-sidebar-half-height);
    min-height: 0;
  }

  .collects-panel,
  .activity-panel {
    height: var(--profile-bottom-row-height);
    min-height: 0;
  }
}

.sidebar-title {
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px 0;
}

.level-panel .sidebar-title {
  margin-bottom: 8px;
}

/* 等级面板 */
.level-status-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.level-number-text {
  font-size: 28px;
  font-weight: 900;
  color: #fff8ea;
  line-height: 1;
}

.level-exp-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 700;
}

.level-remain-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 600;
  line-height: 1.2;
  margin: 8px 0 0 0;
}

/* 最近访问 */
.sidebar-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.sidebar-header-row .sidebar-title {
  margin: 0;
}

.sidebar-more-link {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
  transition: color 0.2s ease;
}

.sidebar-more-link:hover {
  color: #fff;
}

.visitors-avatars-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

@media (min-width: 1200px) {
  .visitors-avatars-row {
    justify-content: flex-start;
    gap: 28px;
    flex-wrap: wrap;
  }
}

.visitor-avatar-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.visitor-avatar-img {
  border: 2px solid rgba(255, 255, 255, 0.08) !important;
}

.placeholder-visitor-avatar {
  background-color: rgba(242, 184, 75, 0.1) !important;
  font-size: 12px !important;
  font-weight: 900 !important;
  color: #f2b84b !important;
  border: 2px solid rgba(255, 255, 255, 0.08) !important;
}

.arong-avatar {
  background-color: #ff4f63 !important;
  color: #fff !important;
  font-weight: 900 !important;
  font-size: 13px !important;
  border: 2px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 4px 10px rgba(255, 79, 99, 0.2);
}

.visitor-nickname-text {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 48px;
}

/* 勋章墙 */
.badges-grid-layout {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  align-items: start;
}

.badge-icon-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.badge-round-container {
  width: 48px;
  height: 48px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.badge-emoji {
  font-size: 22px;
}

.badge-label-name {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 700;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.badge-style-0 .badge-round-container {
  background: radial-gradient(circle at 50% 10%, rgba(215, 116, 117, 0.3), rgba(215, 116, 117, 0.05)),
              linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(215, 116, 117, 0.4);
  box-shadow: 0 4px 15px rgba(215, 116, 117, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.badge-style-1 .badge-round-container {
  background: radial-gradient(circle at 50% 10%, rgba(242, 184, 75, 0.3), rgba(242, 184, 75, 0.05)),
              linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(242, 184, 75, 0.4);
  box-shadow: 0 4px 15px rgba(242, 184, 75, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.badge-style-2 .badge-round-container {
  background: radial-gradient(circle at 50% 10%, rgba(139, 62, 90, 0.35), rgba(139, 62, 90, 0.05)),
              linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(139, 62, 90, 0.4);
  box-shadow: 0 4px 15px rgba(139, 62, 90, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.badge-style-3 .badge-round-container {
  background: radial-gradient(circle at 50% 10%, rgba(99, 215, 231, 0.3), rgba(99, 215, 231, 0.05)),
              linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(99, 215, 231, 0.4);
  box-shadow: 0 4px 15px rgba(99, 215, 231, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.badge-style-4 {
  opacity: 0.3;
}

.badge-style-4 .badge-round-container {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: none;
}

/* 活跃记录列表 */
.activity-records-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-record-item {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.activity-icon-badge {
  width: 28px;
  height: 28px;
  border-radius: 99px;
  display: grid;
  place-items: center;
  font-size: 12px;
  flex-shrink: 0;
}

.activity-icon-badge.bg-bubble {
  background-color: rgba(215, 116, 117, 0.12);
  color: #d77475;
  border: 1px solid rgba(215, 116, 117, 0.2);
}

.activity-icon-badge.bg-thumb {
  background-color: rgba(242, 184, 75, 0.12);
  color: #f2b84b;
  border: 1px solid rgba(242, 184, 75, 0.2);
}

.activity-icon-badge.bg-star {
  background-color: rgba(99, 215, 231, 0.12);
  color: #63d7e7;
  border: 1px solid rgba(99, 215, 231, 0.2);
}

.activity-text-wrapper {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.activity-content-p {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  line-height: 1.45;
  margin: 0;
}

.highlight-title {
  color: #fff;
  font-weight: 700;
}

.highlight-text {
  color: #fff8ea;
  font-weight: 900;
}

.activity-time-tag {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  display: block;
  margin-top: 1px;
}

/* 通用面板样式 */
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

/* 进度条 & 对话框 */
.custom-level-progress :deep(.el-progress-bar__runway) {
  background-color: rgba(255, 255, 255, 0.04) !important;
  border-radius: 99px !important;
}

.custom-level-progress :deep(.el-progress-bar__inner) {
  border-radius: 99px !important;
}

/* 自定义暗黑主题弹窗 */
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

:deep(.custom-dark-dialog .el-input__wrapper),
:deep(.custom-dark-dialog .el-textarea__inner) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  border: none !important;
  color: #fff !important;
  border-radius: 10px !important;
}

:deep(.custom-dark-dialog .el-input__wrapper.is-focus),
:deep(.custom-dark-dialog .el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px rgba(242, 184, 75, 0.4) inset !important;
}

:deep(.custom-dark-dialog .el-input__inner) {
  color: #fff !important;
}

:deep(.custom-dark-dialog .el-input__count) {
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.3) !important;
}
</style>
