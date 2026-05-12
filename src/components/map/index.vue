<script setup lang="ts">
import { ref, toRaw } from "vue";
import { storeToRefs } from "pinia";
import tlp from "./compass.vue";
import trp from "./trp.vue";
import card from "./card.vue";
import clear from "./clear.vue";
import brp from "./brp.vue";
import topicLayerCard from "./component/topicLayerCard.vue";
import dragPanel from "./dragPanel/index.vue";
import twoFiveDPanel from "./component/d25Panel.vue";
import threeDPanel from "./component/d3Panel.vue";
import config from "./config.vue";

import routePlan from "./component/routePlan.vue";
import {
  useMapStore,
  usePanelStore,
  useCommonStore,
  useTabsStore,
} from "@/store/index.ts";
import { PANEL_TYPES } from "../../const/const.panel.ts";
import bigPanel from "./component/bigPanel.vue";
import OpenlayersMap from "../../baseComponent/OpenlayersMap/map.vue";
import {
  AMAP_LAYER,
  LAYER_NAMES,
} from "../../baseComponent/OpenlayersMap/layers.ts";
import { THEME_COLOR } from "../../const/const.common.ts";
import { tileLoadFunction } from "../../util/mapTool.ts";
import keyboardNote from "../../baseComponent/keyboardNote.vue";
// import GithubIcon from "../../baseComponent/GithubIcon.vue";
// @ts-ignore
import { publicLink } from "../../../public/publicLink.js";
import layers from "./layers.vue";
import type { LayerChangeHandler } from "./layers.vue";

type OpenlayersMapExpose = {
  addLayer: (id: string) => boolean
  removeLayer: (id: string) => boolean
  syncLayers: (ids: string[]) => void
}

const MapStore = useMapStore();
const PanelStore = usePanelStore();
const commonStore = useCommonStore();
const tabsStore = useTabsStore();

const { type } = storeToRefs(PanelStore);

const { map } = storeToRefs(MapStore);
const openlayersMapRef = ref<OpenlayersMapExpose | null>(null);

const getMap = (map: Object) => {
  MapStore.setMap(map);
};

/** layers.vue 点击图层时回调，由 OpenlayersMap 执行实际的添加/移除 */
const handleLayerChange: LayerChangeHandler = (action, id) => {
  if (action === "add") {
    openlayersMapRef.value?.addLayer(id);
  } else {
    openlayersMapRef.value?.removeLayer(id);
  }
};

commonStore.$onAction(({ name, after }) => {
  if (name == "setThemeColor") {
    after(({ color }) => {
      const mapInstance: any = toRaw(map.value);
      if (!mapInstance) {
        return;
      }
      const baseLayer = mapInstance
        .getLayers()
        .getArray()
        .find(
          (i: { getClassName: () => string }) =>
            i.getClassName() == LAYER_NAMES.AMAP_LAYER,
        );

      if (baseLayer) {
        let source = AMAP_LAYER().getSource();
        if (color == THEME_COLOR.NIGHT && source) {
          source.setTileLoadFunction(tileLoadFunction);
        }
        baseLayer.setSource(source);
      }
    });
  }
});
</script>
<template>
  <!-- 地图及其控件-->
  <OpenlayersMap ref="openlayersMapRef" @setMap="getMap" />

  <!-- 指南针 -->
  <tlp v-if="tabsStore.activeTab === 1" />

  <!-- 鼠标hover经纬度 -->
  <brp v-if="tabsStore.activeTab === 1"/>

  <!-- 顶部panel -->
  <!-- <dragPanel /> -->

  <!-- 右侧操作栏 -->
  <trp />

  <!-- 路径规划 -->
  <routePlan v-if="type == PANEL_TYPES.ROUTE_PLAN" />

  <!-- 专题图 -->
  <!-- <topicLayerCard /> -->

  <!-- 清除 -->
  <clear />

  <!-- 卡片内容 -->
  <card />

  <!-- 大卡片 -->
  <bigPanel />

  <!-- 配置 -->
  <config />

  <!-- 图层 -->
  <layers :onLayerChange="handleLayerChange" />

  <!--鼠标按键交互卡片-->
  <!-- <keyboardNote /> -->

  <!--github图标-->
  <!-- <GithubIcon /> -->

  <!-- 2.5D顺丰白模区域地图 -->
  <!-- <twoFiveDPanel name="区域地图" :src="publicLink.d25" /> -->

  <!-- 三维模型构件 -->
  <!-- <threeDPanel name="模型构件" :src="publicLink.d3" /> -->
</template>
<style scoped>

</style>
