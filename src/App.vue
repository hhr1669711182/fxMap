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
  <home />
  <index-modal />
</template>

<style scoped></style>
