<!--
 * @Author: huanghuanrong
 * @Date: 2026-03-31 15:30:08
 * @LastEditTime: 2026-04-13 19:05:39
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \OpenlayersMap\src\App.vue
-->
<script setup lang="ts">
import { onBeforeMount } from "vue";
import home from "./view/home.vue";
import IndexModal from "./components/Modals/index.vue";

const container: Element | null = document.querySelector("#svgBase");
const fetchSymbols = () => {
  fetch("./icons.svg")
    .then((response) => response.text())
    .then((content) => {
      if (container && content) {
        container.innerHTML = content;
      }
    });
};

onBeforeMount(() => {
  fetchSymbols();
});
</script>

<template>
  <!-- <home /> -->
  <index-modal />
  <router-view />
</template>

<style scoped></style>
