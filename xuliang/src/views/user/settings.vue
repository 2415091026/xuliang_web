<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";

const userInfo = ref(null);
const editForm = ref({
  nickName: "",
  remark: "",
  avatar: ""
});
const loading = ref(false);

onMounted(() => {
  const infoStr = localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
  if (infoStr) {
    try {
      userInfo.value = JSON.parse(infoStr);
      editForm.value = {
        nickName: userInfo.value.nickName || userInfo.value.userName || "",
        remark: userInfo.value.remark || "音乐是记录生活的方式，也是与世界对话的桥梁。",
        avatar: userInfo.value.avatar || ""
      };
    } catch (e) {
      console.error(e);
    }
  }
});

const saveProfile = () => {
  if (!editForm.value.nickName.trim()) {
    ElMessage.warning("昵称不能为空");
    return;
  }
  
  loading.value = true;
  
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
    loading.value = false;
  }, 400);
};
</script>

<template>
  <div class="card-glass-panel section-padding text-left settings-container">
    <h3 class="section-title">系统设置</h3>
    
    <el-form :model="editForm" label-position="top" class="max-w-[480px]">
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
          :rows="4" 
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
      
      <el-form-item class="mt-8">
        <el-button
          type="primary"
          class="!border-none !bg-[#f2b84b] hover:!bg-[#e0a63b] !text-black !font-bold !rounded-xl !px-8 !py-3"
          :loading="loading"
          @click="saveProfile"
        >
          保存资料修改
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.settings-container {
  width: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: 900;
  color: #fff8ea;
  margin-bottom: 32px;
}

.card-glass-panel {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(16, 17, 22, 0.8);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

:deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.6) !important;
  font-weight: 700 !important;
  font-size: 0.875rem !important;
  margin-bottom: 0.5rem !important;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  border: none !important;
  color: #fff !important;
  border-radius: 10px !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px rgba(242, 184, 75, 0.4) inset !important;
}

:deep(.el-input__inner) {
  color: #fff !important;
}

:deep(.el-input__count) {
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.3) !important;
}
</style>
