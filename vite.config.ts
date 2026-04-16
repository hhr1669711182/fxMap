/*
 * @Author: huanghuanrong
 * @Date: 2026-03-31 15:30:08
 * @LastEditTime: 2026-04-15 12:08:03
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \OpenlayersMap\vite.config.ts
 */
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
// import qiankun from "vite-plugin-qiankun";
import UnoCSS from "unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import VueDevTools from "vite-plugin-vue-devtools";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";
// import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = command === "serve";
  const isLib = process.env.BUILD_LIB === "true" || env.VITE_BUILD_LIB === "true";

  return {
    plugins: [
      vue(),
      vueJsx(),
      VueDevTools(),
      UnoCSS(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        dts: "src/types/auto-imports.d.ts",
        resolvers: [ElementPlusResolver()],
        vueTemplate: true,
      }),
      Components({
        dts: "src/types/components.d.ts",
        resolvers: [ElementPlusResolver()],
      }),
      createSvgIconsPlugin({
        iconDirs: [fileURLToPath(new URL("./src/assets/svg", import.meta.url))],
        symbolId: "icon-[dir]-[name]",
      }),
      // qiankun("vue-openlayers-app", { useDevMode: true }),
    ],
    base: isLib ? "/" : "./",
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        // "js-clipper": fileURLToPath(new URL("./src/shims/js-clipper.ts", import.meta.url)),
      },
    },
    build: {
      outDir: isLib ? "dist-lib" : "dist",
      lib: isLib
        ? {
            entry: resolve(__dirname, "src/lib/index.ts"),
            name: "OpenlayersMapLib",
            fileName: (format) => `openlayers-map.${format}.js`,
            formats: ["es"],
          }
        : undefined,
      rolldownOptions: {
        external: isLib ? ["vue", "pinia", "vue-router"] : [],
        output: {
          sourcemap: mode !== "production",
          codeSplitting: !isLib,
          globals: {},
        },
      },
    },
    optimizeDeps: isDev
      ? {
        exclude: ["@hhr001/openlayers-map-lib"],
        include: ["js-clipper"],
        needsInterop: ["js-clipper"],
        force: true,
      }
      : undefined,
    server: {
      port: 8888,
      host: "0.0.0.0",
    },
  }
});
