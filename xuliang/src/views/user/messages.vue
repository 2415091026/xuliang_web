<template>
  <div class="card-glass-panel section-padding text-left messages-container">
    <h3 class="section-title">消息中心</h3>
    <div class="messages-stack">
      <div class="message-item-card">
        <div class="message-icon-wrapper">🎉</div>
        <div class="message-info-body">
          <div class="msg-header">
            <span class="msg-type-tag">系统通知</span>
            <span class="msg-time">今天 10:24</span>
          </div>
          <p class="msg-content">欢迎加入徐良官方社区！在这里，开启你的官方互动和音乐探索之旅吧。</p>
        </div>
      </div>
      
      <div class="message-item-card">
        <div class="message-icon-wrapper">📈</div>
        <div class="message-info-body">
          <div class="msg-header">
            <span class="msg-type-tag">升级助手</span>
            <span class="msg-time">昨天 18:50</span>
          </div>
          <p class="msg-content">恭喜！你在社区内的活跃值已达标，当前社区等级已升级至 Lv5！</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.messages-container {
  width: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: 900;
  color: #fff8ea;
  margin-bottom: 24px;
}

.messages-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  background-color: rgba(255, 255, 255, 0.01);
}

.message-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 99px;
  background-color: rgba(242, 184, 75, 0.12);
  display: grid;
  place-items: center;
  font-size: 16px;
  flex-shrink: 0;
}

.message-info-body {
  flex: 1;
  min-width: 0;
}

.msg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.msg-type-tag {
  font-size: 11px;
  font-weight: 900;
  color: #f2b84b;
}

.msg-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.msg-content {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.5;
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
