/*
 * @Author: huanghuanrong
 * @Date: 2026-04-09 17:11:03
 * @LastEditTime: 2026-04-09 17:39:52
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \OpenlayersMap\src\store\useTabsStore.ts
 */
import { defineStore } from "pinia";
import { ref } from "vue";

const STORAGE_KEY = "OPENLAYERS_ACTIVE_TAB";

const loadActiveTab = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 1;
};

export const useTabsStore = defineStore("tabsStore", () => {
  const activeTab = ref<number>(typeof window === "undefined" ? 1 : loadActiveTab());

  const setActiveTab = (tab: number) => {
    activeTab.value = tab;
    try {
      localStorage.setItem(STORAGE_KEY, `${tab}`);
    } catch {
      return;
    }
  };

  return {
    activeTab,
    setActiveTab,
  };
});
