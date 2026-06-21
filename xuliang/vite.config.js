import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      // 匹配所有以 /api 开头的请求路径
      '/api': {
        target: 'https://timefolding.online/prod-api', // 后端真实服务地址和端口（请根据实际后端服务进行修改）
        changeOrigin: true, // 允许跨域
        // 路径重写：如果后端的真实接口中不包含 '/api' 前缀，则需要将其替换为空
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})

