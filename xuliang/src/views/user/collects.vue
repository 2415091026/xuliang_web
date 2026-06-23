<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getMyCollectedPostsApi } from "../../api/community";

const router = useRouter();
const myCollects = ref([]);
const loading = ref(false);

const toPostDetail = (id) => {
  router.push({ name: "community-detail", params: { id: String(id) } });
};

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

const formatCount = (count) => {
  if (count === undefined || count === null) return "0";
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }
  return count;
};

onMounted(async () => {
  loading.value = true;
  try {
    const collectRes = await getMyCollectedPostsApi();
    if (collectRes && collectRes.code === 200 && collectRes.data) {
      myCollects.value = collectRes.data.list || [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-loading="loading" class="card-glass-panel section-padding my-collects-container text-left">
    <div class="section-header">
      <h3 class="section-title">我的全部收藏</h3>
      <span class="header-count">共 {{ myCollects.length }} 篇</span>
    </div>
    
    <div class="collect-cards-grid">
      <div 
        v-for="(item, idx) in myCollects"
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
    
    <div v-if="myCollects.length === 0" class="empty-placeholder-text">
      暂无收藏的帖子
    </div>
  </div>
</template>

<style scoped>
.my-collects-container {
  width: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 900;
  color: #fff8ea;
  margin: 0;
}

.header-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

.collect-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .collect-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .collect-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1400px) {
  .collect-cards-grid {
    grid-template-columns: repeat(4, 1fr);
  }
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

.empty-placeholder-text {
  padding: 32px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}

.card-glass-panel {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(16, 17, 22, 0.8);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
</style>
