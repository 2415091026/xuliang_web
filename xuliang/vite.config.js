import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import VitePluginImageTools from "vite-plugin-image-tools";
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const { VITE_APP_ENV } = env;
  return {
    base: VITE_APP_ENV === "production" ? "/" : "/",
    plugins: [
      vue(),
      tailwindcss(),
      VitePluginImageTools({
        quality: 90,
        enableDev: true,
        enableDevConvert: true,
      }),
    ],
    // build: {
    //   outDir: VITE_APP_ENV === "production" ? "dist/web" : "dist",
    //   emptyOutDir: true
    // },
    server: {
      host: true,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/profile": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
  };
});
