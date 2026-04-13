/*
 * @Author: huanghuanrong
 * @Date: 2026-03-31 15:30:08
 * @LastEditTime: 2026-04-13 18:55:36
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \OpenlayersMap\src\main.ts
 */
import { createApp } from "vue";
import type { App as VueApp } from "vue";
import { createPinia, setActivePinia } from "pinia";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import {
  renderWithQiankun,
  qiankunWindow,
  QiankunProps,
} from "vite-plugin-qiankun/dist/helper";
import "element-plus/dist/index.css";
import "virtual:svg-icons-register";
import 'virtual:uno.css'
import "./style.css";
import "./styles/day.css";
import "./styles/night.css";
import { drag } from "./directives/index.ts";
import App from "./App.vue";
import router from '@/router'

let app: VueApp | null = null;

const createInstance = () => {
  const app = createApp(App);

  const pinia = createPinia();
  setActivePinia(pinia);

  app.use(pinia);
  // app.use(ElementPlus);
  app.use(router);

  // Object.entries(ElementPlusIconsVue).forEach(([key, component]) => {
  //   app.component(key, component);
  // });

  app.directive("drag", drag);
  return app;
};

const mount = (props: QiankunProps = {} as any) => {
  const node = props.container
    ? props.container.querySelector("#app")
    : document.getElementById("app");
  app = createInstance();
  app.mount(node!);
};

const unmount = () => {
  app?.unmount();
  app = null;
};

renderWithQiankun({
  mount,
  bootstrap() {},
  unmount,
  update() {},
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  mount({} as any);
}
