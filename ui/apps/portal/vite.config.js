import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../..", "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://66.29.134.153/motakase/api";

  return {
    envDir: "../..",
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    },
    preview: {
      port: 4174
    }
  };
});
