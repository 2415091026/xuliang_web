<script setup>
import { onMounted, reactive, ref } from "vue";
import { User, Lock } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getInfoApi, loginApi, registerApi, getCodeImgApi } from "../../api/login";
import { useRouter } from "vue-router";
import heroBg from "../../assets/images/09.jpg";
import { initSocket } from "../../utils/socket";

const router = useRouter();

const TOKEN_KEY = "token";
const USER_INFO_KEY = "userInfo";
const REMEMBER_ME_KEY = "rememberMe";
const REMEMBERED_USERNAME_KEY = "rememberedUserName";

// 控制登录模式与注册模式切换
const isLogin = ref(true);

const loginForm = reactive({
  userName: "",
  password: "",
  rememberMe: true,
  code: "",
  uuid: ""
});

// 验证码状态管理
const authCodeInfo = reactive({
  captchaEnabled: true, // 验证码开关
  loading: false,
  imgUrl: "",
  uuid: ""
});

// 获取验证码图片
const getValidateCode = async (isClick = false) => {
  if (isClick && !loginForm.userName.trim()) {
    ElMessage.error("请输入用户账号");
    return;
  }
  if (isClick && !loginForm.password.trim()) {
    ElMessage.error("请输入用户密码");
    return;
  }
  if (authCodeInfo.loading) return;

  authCodeInfo.loading = true;
  try {
    const res = await getCodeImgApi();
    const data = res.data || res;
    authCodeInfo.captchaEnabled = data.captchaEnabled !== false;
    authCodeInfo.uuid = data.uuid || "";
    if (authCodeInfo.captchaEnabled) {
      authCodeInfo.imgUrl = data.img || "";
    }
  } catch (err) {
    console.error("获取验证码异常：", err);
  } finally {
    authCodeInfo.loading = false;
  }
};

// 注册表单对象
const registerForm = reactive({
  userName: "",
  password: "",
  confirmPassword: ""
});

const clearLoginStorage = (storage) => {
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_INFO_KEY);
};

const saveLoginState = (token, userInfo) => {
  const targetStorage = loginForm.rememberMe ? localStorage : sessionStorage;
  const staleStorage = loginForm.rememberMe ? sessionStorage : localStorage;

  clearLoginStorage(staleStorage);
  targetStorage.setItem(TOKEN_KEY, token);
  targetStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  localStorage.setItem(REMEMBER_ME_KEY, String(loginForm.rememberMe));

  if (loginForm.rememberMe) {
    localStorage.setItem(REMEMBERED_USERNAME_KEY, loginForm.userName);
  } else {
    localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  }
};

const handleLogin = async () => {
  if (!loginForm.userName || !loginForm.password) {
    ElMessage.warning("请输入用户名和密码");
    return;
  }
  
  if (authCodeInfo.captchaEnabled && !loginForm.code.trim()) {
    ElMessage.warning("请输入验证码");
    return;
  }

  try {
    const res = await loginApi({
      userName: loginForm.userName,
      password: loginForm.password,
      code: loginForm.code,
      uuid: authCodeInfo.uuid
    });

    ElMessage.success("登录成功");
    console.log("登录成功，响应数据为：", res);

    // 适配不同的后端 token 结构进行持久化存储
    const token = res.data?.token || res.token;
    if (token) {
      const targetStorage = loginForm.rememberMe ? localStorage : sessionStorage;
      const staleStorage = loginForm.rememberMe ? sessionStorage : localStorage;

      clearLoginStorage(staleStorage);
      targetStorage.setItem(TOKEN_KEY, token);

      const infoRes = await getInfoApi();
      const userInfo = {
        ...(infoRes.user || infoRes),
        roles: infoRes.roles || [],
        permissions: infoRes.permissions || []
      };
      saveLoginState(token, userInfo);
      // 登录成功建立 WebSocket 连接
      initSocket(token);
      router.push("/");
      console.log("获取个人信息成功，响应数据为：", infoRes);
    }
  } catch (error) {
    // 接口请求异常已在 request.js 中通过 ElMessage 全局拦截中文报错
    console.error("登录发生异常：", error);
    if (authCodeInfo.captchaEnabled) {
      getValidateCode();
    }
  }
};

// 处理管理员注册
const handleRegister = async () => {
  if (!registerForm.userName || !registerForm.password || !registerForm.confirmPassword) {
    ElMessage.warning("请填写完整注册信息");
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage.warning("两次输入的密码不一致");
    return;
  }

  try {
    const res = await registerApi({
      userName: registerForm.userName,
      password: registerForm.password
    });

    ElMessage.success("注册成功！已为您自动切换到登录模式，请输入密码登录");

    // 自动带入刚注册的用户名，并切换模式
    loginForm.userName = registerForm.userName;
    isLogin.value = true;

    // 清空注册表单
    registerForm.userName = "";
    registerForm.password = "";
    registerForm.confirmPassword = "";
  } catch (error) {
    console.error("注册发生异常：", error);
  }
};

onMounted(() => {
  loginForm.rememberMe = localStorage.getItem(REMEMBER_ME_KEY) !== "false";

  if (loginForm.rememberMe) {
    loginForm.userName = localStorage.getItem(REMEMBERED_USERNAME_KEY) || "";
  }
  
  getValidateCode();
});
</script>

<template>
  <main class="min-h-screen bg-[#050609] text-[#fff8ea]">
    <section class="relative min-h-screen w-full overflow-hidden bg-[#050609]">
      <img class="absolute inset-0 h-full w-full object-cover object-[center_34%]" :src="heroBg" alt="徐良演唱现场" />
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,79,63,0.34),transparent_28vw),radial-gradient(circle_at_84%_18%,rgba(54,176,230,0.32),transparent_30vw),linear-gradient(90deg,rgba(5,6,9,0.68)_0%,rgba(5,6,9,0.28)_46%,rgba(5,6,9,0.82)_100%),linear-gradient(180deg,rgba(5,6,9,0.18)_0%,rgba(5,6,9,0.92)_100%)]"
      ></div>

      <header class="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between px-14 pb-6 pt-10 max-[760px]:px-6 max-[760px]:py-7">
        <RouterLink class="flex items-center gap-4" to="/" aria-label="返回首页">
          <span class="grid size-12 place-items-center rounded-full bg-[#ff4f63] text-sm font-black text-white shadow-[0_18px_45px_rgba(255,79,99,0.28)]"> XL </span>
          <span>
            <strong class="block font-serif text-2xl font-black leading-none">徐良</strong>
            <span class="mt-1 block text-[11px] font-black uppercase text-[#fff8ea]/58">Official Site</span>
          </span>
        </RouterLink>

        <RouterLink
          class="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/22 bg-white/[0.035] px-6 text-sm font-black text-[#fff8ea] backdrop-blur-xl transition hover:border-white/36 hover:bg-white/[0.08] focus-visible:border-white/36 focus-visible:bg-white/[0.08] focus-visible:outline-none"
          to="/"
        >
          返回首页
          <span aria-hidden="true">⌂</span>
        </RouterLink>
      </header>

      <div class="relative z-10 mx-auto grid min-h-[calc(100vh-180px)] max-w-[1400px] grid-cols-[minmax(0,1fr)_520px] items-center gap-16 px-14 pb-16 pt-4 max-[1060px]:grid-cols-1 max-[760px]:px-6">
        <section class="max-w-[620px] self-end pb-24 max-[1060px]:hidden">
          <p class="mb-4 text-[clamp(96px,11vw,180px)] font-black uppercase leading-[0.84] text-[#ff4f63]/18">Xu<br />Liang</p>
          <h1 class="font-serif text-[clamp(48px,5vw,78px)] font-black leading-tight text-[#fff8ea]">音乐连接你我</h1>
          <p class="mt-5 text-3xl font-light italic leading-none text-[#ff4f63]/78">Music connects us</p>
          <p class="mt-7 max-w-[520px] text-base leading-8 text-[#fff8ea]/62">登录后解锁更多精彩内容，收藏喜欢的音乐和现场影像，与千万乐迷一起探索徐良的音乐世界。</p>
        </section>

        <section
          class="justify-self-center w-[420px] max-[480px]:w-full rounded-[22px] border border-white/14 bg-[#07111d]/58 px-12 py-10 shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl max-[760px]:p-7 min-[1400px]:translate-x-[80px]"
        >
          <div class="text-center">
            <h2 class="text-4xl font-black text-[#fff8ea]">{{ isLogin ? "欢迎回来" : "立即注册" }}</h2>
            <p class="mt-4 text-sm font-semibold text-[#fff8ea]/48">
              {{ isLogin ? "登录你的账号，继续音乐之旅" : "创建你的账号，加入徐良的音乐世界" }}
            </p>
          </div>

          <el-form v-if="isLogin" :model="loginForm" class="mt-10 custom-login-form" @submit.prevent="handleLogin">
            <el-form-item>
              <el-input v-model="loginForm.userName" placeholder="手机号 / 邮箱" class="custom-input">
                <template #prefix>
                  <el-icon class="text-lg text-[#fff8ea]/48 mr-1"><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-input v-model="loginForm.password" type="password" placeholder="密码" show-password class="custom-input">
                <template #prefix>
                  <el-icon class="text-lg text-[#fff8ea]/48 mr-1"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="authCodeInfo.captchaEnabled">
              <div class="flex items-center gap-3 w-full">
                <el-input v-model="loginForm.code" placeholder="验证码" class="custom-input flex-grow" maxlength="4">
                  <template #prefix>
                    <el-icon class="text-lg text-[#fff8ea]/48 mr-1"><Lock /></el-icon>
                  </template>
                </el-input>
                <div 
                  class="captcha-img-container cursor-pointer flex-shrink-0" 
                  v-html="authCodeInfo.imgUrl" 
                  @click="getValidateCode(true)"
                  title="点击刷新验证码"
                ></div>
              </div>
            </el-form-item>

            <div class="flex items-center justify-between text-sm font-semibold text-[#fff8ea]/70 mb-5">
              <el-checkbox v-model="loginForm.rememberMe" label="记住我" class="custom-checkbox" />
              <a class="transition hover:text-[#fff8ea] text-sm font-semibold text-[#fff8ea]/70" href="#">忘记密码?</a>
            </div>

            <el-form-item>
              <el-button class="w-full custom-submit-btn" type="primary" native-type="submit"> 登录 </el-button>
            </el-form-item>
          </el-form>

          <el-form v-else :model="registerForm" class="mt-10 custom-login-form" @submit.prevent="handleRegister">
            <el-form-item>
              <el-input v-model="registerForm.userName" placeholder="用户名（手机号 / 邮箱）" class="custom-input">
                <template #prefix>
                  <el-icon class="text-lg text-[#fff8ea]/48 mr-1"><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-input v-model="registerForm.password" type="password" placeholder="输入密码" show-password class="custom-input">
                <template #prefix>
                  <el-icon class="text-lg text-[#fff8ea]/48 mr-1"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" show-password class="custom-input">
                <template #prefix>
                  <el-icon class="text-lg text-[#fff8ea]/48 mr-1"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button class="w-full custom-submit-btn" type="primary" native-type="submit"> 注册 </el-button>
            </el-form-item>
          </el-form>

          <div class="mt-6 border-t border-white/10 pt-5 text-center text-sm font-semibold text-[#fff8ea]/52">
            {{ isLogin ? "还没有账号?" : "已有账号?" }}
            <a
              class="font-black text-[#ff4f63] transition hover:text-[#ff7a8a] cursor-pointer"
              @click="isLogin = !isLogin"
            >
              {{ isLogin ? "立即注册" : "立即登录" }}
            </a>
          </div>
        </section>
      </div>

      <footer class="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between px-14 pb-12 text-xs font-black uppercase text-[#fff8ea]/42 max-[760px]:hidden"></footer>
    </section>
  </main>
</template>

<style scoped>
/* 覆盖 Element Plus 输入框样式 */
.custom-input {
  width: 100% !important;
}
.custom-input :deep(.el-input__wrapper) {
  width: 100% !important;
  box-sizing: border-box !important;
  background-color: rgba(255, 255, 255, 0.07) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset !important;
  border-radius: 6px;
  padding: 12px 20px;
  transition: all 0.2s ease;
}
.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(255, 79, 99, 0.6) inset !important;
}
.custom-input :deep(.el-input__inner) {
  color: #fff8ea !important;
  font-family: inherit;
  font-weight: 600;
  font-size: 1rem;
  height: 24px;
}
.custom-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 248, 234, 0.36) !important;
}
.custom-input :deep(.el-input__prefix) {
  color: rgba(255, 248, 234, 0.48);
}
.custom-input :deep(.el-input__suffix) {
  color: rgba(255, 248, 234, 0.38) !important;
}

/* 覆盖 Element Plus 复选框样式 */
.custom-checkbox {
  --el-checkbox-text-color: rgba(255, 248, 234, 0.7) !important;
  --el-checkbox-checked-text-color: #fff8ea !important;
  --el-checkbox-input-border: rgba(255, 255, 255, 0.3) !important;
  --el-checkbox-checked-input-border-color: #ff4f63 !important;
  --el-checkbox-checked-bg-color: #ff4f63 !important;
  --el-checkbox-input-border-color-hover: #ff4f63 !important;
  height: auto !important;
}
.custom-checkbox :deep(.el-checkbox__label) {
  font-weight: 600;
  font-size: 0.875rem;
}

/* 覆盖提交按钮样式 */
.custom-submit-btn {
  height: 56px !important;
  font-size: 1rem !important;
  font-weight: 900 !important;
  color: white !important;
  border: none !important;
  border-radius: 6px !important;
  background: linear-gradient(to right, #ff4f63, #6e315f) !important;
  box-shadow: 0 18px 48px rgba(255, 79, 99, 0.22) !important;
  transition: all 0.2s ease !important;
}
.custom-submit-btn:hover,
.custom-submit-btn:focus {
  filter: brightness(1.1);
}

/* 统一控制表单项底部间距 */
.custom-login-form :deep(.el-form-item) {
  margin-bottom: 20px !important;
}
.custom-login-form :deep(.el-form-item__content) {
  line-height: normal !important;
}

.captcha-img-container {
  height: 50px;
  width: 120px;
  border-radius: 6px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.captcha-img-container:hover {
  border-color: rgba(255, 79, 99, 0.6);
  background-color: rgba(255, 255, 255, 0.1);
}

.captcha-img-container :deep(svg) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
