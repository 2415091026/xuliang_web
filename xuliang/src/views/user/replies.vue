<template>
  <div class="card-glass-panel section-padding text-left replies-container">
    <h3 class="section-title">我的全部回复</h3>
    <div class="empty-placeholder-text">
      暂无回复记录
    </div>
  </div>
</template>

<style scoped>
.replies-container {
  width: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: 900;
  color: #fff8ea;
  margin-bottom: 24px;
}

.empty-placeholder-text {
  padding: 48px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
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
