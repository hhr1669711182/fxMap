/*
 * @Author: huanghuanrong
 * @Date: 2026-03-31 15:30:08
 * @LastEditTime: 2026-04-09 16:32:56
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \OpenlayersMap\vite.config.ts
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import qiankun from "vite-plugin-qiankun";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    qiankun("vue-openlayers-app", { useDevMode: true }),
  ],
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 8888,
    host: "0.0.0.0",  
  },
});
