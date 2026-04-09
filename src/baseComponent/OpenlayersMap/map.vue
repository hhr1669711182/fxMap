<script setup lang="ts">
import { onMounted, nextTick, onUnmounted, ref, computed } from "vue";
import Map from "ol/Map";
import View from "ol/View";
import * as olProj from "ol/proj";
import OSM from "ol/source/OSM.js";
import TileLayer from "ol/layer/Tile";
import {
  ZoomSlider,
  FullScreen,
  ScaleLine,
  ZoomToExtent,
  OverviewMap,
} from "ol/control";
import { KeyboardPan } from "ol/interaction";
import PrintDialog from "ol-ext/control/PrintDialog";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import { VECTOR_LAYER, AMAP_LAYER, GOOGLE_LAYER } from "./layers.ts";
import { EXTENT, ZOOM, CENTER } from "./const.map.ts";
import { useResponsive, useTouch } from "../../composables/useResponsive.ts";
import {
  AmapRealtimeNav,
  fetchInputTips,
  mountFireStations,
} from "../amap/useAmapTools.ts";
import amapData from "../amap/data.json";
import carImg from "../amap/imgs/car.png";
import fireImg from "../amap/imgs/xfz.png";
import { zhxfdzXYList } from "../amap/mapData.ts";
import { getDistance } from "ol/sphere";
import { ElMessage } from "element-plus";
import { EventBus } from "../../util/mitt.ts";
import { useTabsStore } from "@/store";

import ljImg from "@/assets/svg/lj.svg";
import xcImg from "@/assets/svg/xc.svg";
import zjImg from "@/assets/svg/jz.svg";

// @ts-ignore
import { publicLink } from "../../../public/publicLink.js";
import { storeToRefs } from "pinia";

const emit = defineEmits(["setMap"]);

// 响应式检测
const { isMobile } = useResponsive();
const { isTouchDevice } = useTouch();

let map: Map | null = null;
let nav: AmapRealtimeNav | null = null;
const navPanelRef = ref<HTMLElement | null>(null);

const firePopupRef = ref<HTMLElement | null>(null);
const firePopupVisible = ref(false);
const navVisible = ref(false);
const fireSelected = ref<any | null>(null);
let fireManager: { hide: () => void; destroy: () => void } | null = null;

// 解析动态配置（支持数组与对象），优先 data 字段
const configList = Array.isArray(amapData)
  ? (amapData as any[])
  : [amapData as any];
const firstCfg = (configList[0] || {}) as any;
const regionCfg = firstCfg.data || firstCfg;

// const amapKey = ref<string>(
//   localStorage.getItem("AMAP_WEBSERVICE_KEY") ||
//     (amapData as any).amapWebServiceKey ||
//     ""
// );

const amapKey = ref<string>("7405ae6dde247ee87be4e7d8021056f4");

const ensureAmapKey = () => {
  if (amapKey.value) return amapKey.value;
  const input = window.prompt(
    "请输入高德 Web 服务 Key（用于行政区边界/路径规划）",
    "",
  );
  if (!input) return "";
  amapKey.value = input.trim();
  localStorage.setItem("AMAP_WEBSERVICE_KEY", amapKey.value);
  return amapKey.value;
};

type TipItem = {
  id?: string;
  name: string;
  address?: string;
  district?: string;
  adcode?: string;
  location?: [number, number];
};

const startText = ref("");
const endText = ref("");
const startTips = ref<TipItem[]>([]);
const endTips = ref<TipItem[]>([]);
const startCoord = ref<[number, number] | null>(null);
const endCoord = ref<[number, number] | null>(null);
const activeDropdown = ref<"start" | "end" | null>(null);
const isPlanning = ref(false);

const canStart = computed(() => !!endCoord.value && !isPlanning.value);

const formatTipText = (t: TipItem) => {
  const parts = [t.name, t.district, t.address].filter(Boolean);
  return parts.join(" ");
};

const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  waitMs: number,
) => {
  let timer: number | null = null;
  return (...args: Parameters<T>) => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), waitMs);
  };
};

const loadBeijingMaskIfReady = async () => {
  if (!nav || !amapKey.value) return;
  try {
    await nav.loadMask((regionCfg?.boundaries as any) || []);
  } catch {
    return;
  }
};

const queryTips = async (type: "start" | "end") => {
  if (!nav) return;
  const key = ensureAmapKey();
  if (!key) return;
  nav.setKey(key);
  await loadBeijingMaskIfReady();

  const keywords = (type === "start" ? startText.value : endText.value).trim();
  if (!keywords) {
    if (type === "start") startTips.value = [];
    else endTips.value = [];
    return;
  }

  const tips = (await fetchInputTips({
    key,
    keywords,
    city: (regionCfg?.city as string) || "",
    citylimit: true,
  })) as TipItem[];

  const filtered = tips.filter(
    (t) =>
      t.location &&
      Number.isFinite(t.location[0]) &&
      Number.isFinite(t.location[1]),
  );

  if (type === "start") startTips.value = filtered;
  else endTips.value = filtered;
};

const queryStartTips = debounce(() => queryTips("start"), 220);
const queryEndTips = debounce(() => queryTips("end"), 220);

const selectTip = (type: "start" | "end", tip: TipItem) => {
  if (!tip.location || !nav) return;
  const text = formatTipText(tip);
  if (type === "start") {
    startText.value = text;
    startCoord.value = tip.location;
    nav.setEndpoint("start", tip.location);
  } else {
    endText.value = text;
    endCoord.value = tip.location;
    nav.setEndpoint("end", tip.location);
  }
  activeDropdown.value = null;
};

const fetchDisasterSuggestions = async (
  queryString: string,
  cb: (list: Array<any>) => void,
) => {
  const q = (queryString || "").trim();
  if (!q) {
    cb([]);
    return;
  }
  if (!nav) {
    cb([]);
    return;
  }
  const key = ensureAmapKey();
  if (!key) {
    cb([]);
    return;
  }
  nav.setKey(key);
  await loadBeijingMaskIfReady();

  try {
    const tips = (await fetchInputTips({
      key,
      keywords: q,
      city: (regionCfg?.city as string) || "",
      citylimit: true,
    })) as TipItem[];

    const items = tips
      .filter(
        (t) =>
          t.location &&
          Number.isFinite(t.location[0]) &&
          Number.isFinite(t.location[1]),
      )
      .map((t) => ({
        ...t,
        value: formatTipText(t),
      }));

    cb(items);
  } catch {
    cb([]);
  }
};

const onDisasterSelect = (item: any) => {
  const loc = item?.location as [number, number] | undefined;
  if (!loc) {
    // if (!nav) return;
    // nav.endMarker = null;
    return;
  }
  endText.value = item?.value || formatTipText(item);
  endCoord.value = loc;
  if (map) {
    map.getView().animate({
      center: olProj.fromLonLat(loc),
      duration: 300,
    });
    // 标注点
    nav?.setEndpoint("end", loc);
  }
};

const getNearestFireStation = (target: [number, number]) => {
  let best: any = null;
  let bestDist = Infinity;
  for (const s of zhxfdzXYList as any[]) {
    if (!Number.isFinite(s?.lng) || !Number.isFinite(s?.lat)) continue;
    const d = getDistance(target, [s.lng, s.lat]);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best ? { station: best, distanceMeters: bestDist } : null;
};

const pickOnMap = async (type: "start" | "end") => {
  if (!nav) return;
  const key = ensureAmapKey();
  if (!key) return;
  nav.setKey(key);
  await loadBeijingMaskIfReady();

  const picked = await nav.pickAddressPoint(type);
  if (!picked) return;

  if (type === "start") {
    startText.value = picked.address;
    startCoord.value = picked.lngLat;
  } else {
    endText.value = picked.address;
    endCoord.value = picked.lngLat;
  }
  activeDropdown.value = null;
};

const onFatherMessage = async (coord: [number, number]) => {
  // tabs切换地图模式
  tabsStore.setActiveTab(1);

  endCoord.value = coord;
  startSimulate();
  // 逆地址解析，获取地址信息
  const address = await nav?.reverseGeocode(coord);
  endText.value = address || "";
  // 关闭模型
  EventBus.emit("panelClose");
};

const startSimulate = async () => {
  if (!nav || !endCoord.value) return;
  const key = ensureAmapKey();
  if (!key) return;
  nav.setKey(key);
  await loadBeijingMaskIfReady();

  isPlanning.value = true;
  try {
    const nearest = getNearestFireStation(endCoord.value);
    if (!nearest) {
      ElMessage.warning("未找到可用的消防站坐标");
      return;
    }
    const start: [number, number] = [nearest.station.lng, nearest.station.lat];
    startCoord.value = start;
    startText.value = nearest.station.title;

    nav.setEndpoint("start", start);
    nav.setEndpoint("alarm", endCoord.value);
    await nav.planAndStart(start, endCoord.value);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "路径规划失败";
    ElMessage.error(msg);
  } finally {
    isPlanning.value = false;
  }
};

const clearNav = () => {
  nav?.stop();
  nav?.clearEndpoints();
  EventBus.emit("panelClose");
  startText.value = "";
  endText.value = "";
  startTips.value = [];
  endTips.value = [];
  startCoord.value = null;
  endCoord.value = null;
  activeDropdown.value = null;
};

const handleDocumentClick = (e: MouseEvent) => {
  const el = navPanelRef.value;
  if (!el) return;
  if (!el.contains(e.target as Node)) {
    activeDropdown.value = null;
  }
};

const closeFirePopup = () => {
  firePopupVisible.value = false;
  fireSelected.value = null;
  if (fireManager) fireManager.hide();
};

/**
 * 初始化地图
 * 适配桌面端和H5手机端
 */
const initMap = () => {
  const overviewMapControl = new OverviewMap({
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
    ],
  });

  const keyboardPan = new KeyboardPan({
    pixelDelta: 100,
    duration: 200,
  });

  const amapLayer = AMAP_LAYER();
  const googleLayer = GOOGLE_LAYER;
  const vectorLayer = VECTOR_LAYER();

  map = new Map({
    layers: [amapLayer, googleLayer, vectorLayer],
    target: "map",
    view: new View({
      center: olProj.fromLonLat(CENTER),
      zoom: ZOOM.INIT,
      minZoom: ZOOM.MIN,
      maxZoom: ZOOM.MAX,
    }),
  });

  // 添加键盘事件监听（仅在桌面端）
  if (!isMobile.value) {
    document.addEventListener("keydown", function (event) {
      console.log("Key pressed: ", event.key);
    });
  }

  // 添加地图控件，根据设备类型调整
  // map.addControl(overviewMapControl);

  if (!isMobile.value) {
    // map.addControl(new ZoomSlider());
  }

  // map.addControl(new FullScreen());
  map.addControl(new ScaleLine());
  // map.addControl(new ZoomToExtent({ extent: EXTENT }));

  // 打印控件（仅在桌面端）
  if (!isMobile.value) {
    const printControl = new PrintDialog({
      lang: "zh",
    });
    printControl.setSize("A4");
    // map.addControl(printControl);

    printControl.on(["print", "error"], (e: any) => {
      if (e.image) {
        const uuid = uuidv4().replace(/-/g, "");
        if (e.pdf) {
          const pdf = new jsPDF({
            orientation: e.print.orientation,
            unit: e.print.unit,
            format: e.print.size,
          });
          pdf.addImage(
            e.image,
            "JPEG",
            e.print.position[0],
            e.print.position[0],
            e.print.imageWidth,
            e.print.imageHeight,
          );
          pdf.save(e.print.legend ? "legend.pdf" : `openlayers_${uuid}.pdf`);
        } else {
          e.canvas.toBlob(
            (blob: any) => {
              const name =
                (e.print.legend ? "legend." : `map_${uuid}.`) +
                e.imageType.replace("image/", "");
              saveAs(blob, name);
            },
            e.imageType,
            e.quality,
          );
        }
      } else {
        console.warn("No canvas to export");
      }
    });
  }

  nav = new AmapRealtimeNav(map, {
    amapKey: amapKey.value,
    xzKeywords: (regionCfg?.adcode as string) || "",
    vehicleIconSrc: carImg,
  });

  if (amapKey.value) {
    nav.loadMask((regionCfg?.boundaries as any) || []).catch(() => {});
  }

  if (firePopupRef.value) {
    fireManager = mountFireStations({
      map,
      stations: zhxfdzXYList as any,
      iconSrc: fireImg,
      popupElement: firePopupRef.value,
      onSelect: (data) => {
        fireSelected.value = data;
        firePopupVisible.value = true;
      },
      onClose: () => {
        firePopupVisible.value = false;
        fireSelected.value = null;
      },
    });
  }

  emit("setMap", map);
};

/**
 * 清理资源
 */
const cleanup = () => {
  fireManager?.destroy();
  fireManager = null;
  if (nav) {
    nav.destroy();
    nav = null;
  }
  if (map) {
    map.dispose();
    map = null;
  }
};

// tabs 模型
const tabsStore = useTabsStore();
const { activeTab } = storeToRefs(tabsStore);
const tabs = ref([
  {
    label: "路径规划",
    name: 1,
    icon: ljImg,
  },
  {
    label: "现场态势",
    name: 2,
    icon: xcImg,
  },
  {
    label: "建筑剖面",
    name: 3,
    icon: zjImg,
  },
]);

onMounted(() => {
  nextTick(() => {
    initMap();
  });
  document.addEventListener("click", handleDocumentClick, true);
  window.addEventListener("message", function (event) {
    console.log("收到消息：", event, event.data);
    // if (event.origin !== location.origin) return;
    const coord = event.data.payload as [number, number];
    coord?.length >= 2 && onFatherMessage(coord);
  });
});

onUnmounted(() => {
  cleanup();
  document.removeEventListener("click", handleDocumentClick, true);
});
</script>

<template>
  <div
    v-show="activeTab === 1"
    id="map"
    :class="{ 'is-mobile': isMobile }"
    tabindex="2"
  >
    <!-- 队站弹窗 -->
    <div ref="firePopupRef" class="fire_popup" v-show="firePopupVisible">
      <div class="fire_popup_header">
        <div class="fire_popup_title">{{ fireSelected?.title }}</div>
        <button class="fire_popup_close" type="button" @click="closeFirePopup">
          ×
        </button>
      </div>
      <div class="fire_popup_body">
        <div v-if="fireSelected?.address" class="fire_popup_row">
          <span class="fire_popup_k">地址</span>
          <span class="fire_popup_v">{{ fireSelected.address }}</span>
        </div>
        <div v-if="fireSelected?.phone" class="fire_popup_row">
          <span class="fire_popup_k">电话</span>
          <span class="fire_popup_v">{{ fireSelected.phone }}</span>
        </div>
        <div class="fire_popup_row">
          <span class="fire_popup_k">坐标</span>
          <span class="fire_popup_v">
            {{ fireSelected?.lng }}, {{ fireSelected?.lat }}
          </span>
        </div>
      </div>
    </div>

    <!-- 调派路径规划 -->
    <div ref="navPanelRef" class="nav_panel_new">
      <div class="nav_row">
        <el-button class="nav_pick" type="primary" @click="pickOnMap('end')">
          选点
        </el-button>

        <div class="nav_field">
          <el-autocomplete
            v-model="endText"
            class="nav_input_ep"
            placeholder="输入查询灾情位置"
            :fetch-suggestions="fetchDisasterSuggestions"
            :trigger-on-focus="false"
            clearable
            @select="onDisasterSelect"
          />
        </div>

        <div class="nav_actions">
          <el-button
            type="primary"
            :disabled="!canStart"
            @click="startSimulate"
          >
            {{ isPlanning ? "规划中..." : "开始" }}
          </el-button>
          <el-button :disabled="isPlanning" @click="clearNav">清除</el-button>
        </div>
      </div>
    </div>
  </div>

  <!-- tab panel 模型 -->
  <div class="bottom_nav_tab">
    <div
      v-for="tab in tabs"
      :key="tab.name"
      class="tab_item"
      :class="{ tab_item_active: tab.name == activeTab }"
      @click="tabsStore.setActiveTab(tab.name)"
    >
      <img :src="tab.icon" alt="" />
      {{ tab.label }}
    </div>
  </div>

  <div v-show="activeTab === 2">
    <iframe
      ref="iframeRef"
      :src="publicLink.d25 || 'about:blank'"
      class="iframe_panel_iframe"
    />
  </div>
  <div v-show="activeTab === 3">
    <iframe
      ref="iframeRef"
      :src="publicLink.d3 || 'about:blank'"
      class="iframe_panel_iframe"
    />
  </div>
</template>

<style scoped>
.iframe_panel_iframe {
  width: 100%;
  height: 100vh;
  border: 0;
}

.bottom_nav_tab {
  position: absolute;
  bottom: 0.5em;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  width: 100%;
  height: 40px;
  background: url("@/assets/bottomBg.png") center no-repeat;
  background-size: 100% 100%;

  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
.tab_item {
  /* width: 56px; */
  /* height: 20px; */
  font-family:
    PingFangSC,
    PingFang SC;
  font-weight: 500;
  font-size: 14px;
  color: #ffffff;
  line-height: 20px;
  text-align: left;
  font-style: normal;
  opacity: 0.5;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  pointer-events: pointer;
  cursor: pointer;
}

.tab_item_active {
  opacity: 1;
}

.tab_item img {
  width: 20px;
  height: 20px;
}

#map {
  height: 100%;
  width: 100%;
  touch-action: none; /* 优化触摸体验 */
}

:deep(.el-button + .el-button) {
  margin-left: 0px;
}

.nav_panel {
  position: absolute;
  top: 0.5em;
  /* left: 52px; */
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  width: 340px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(8px);
}

.nav_panel_new {
  position: absolute;
  top: 0.5em;
  /* left: 52px; */
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  min-width: 450px;
  width: auto;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(8px);
}

.fire_popup {
  position: absolute;
  min-width: 260px;
  max-width: 320px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
  pointer-events: auto;
}

.fire_popup_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.fire_popup_title {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
  line-height: 1.2;
}

.fire_popup_close {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  background: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  line-height: 1;
}

.fire_popup_body {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}

.fire_popup_row {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 8px;
  font-size: 12px;
  color: #111827;
}

.fire_popup_k {
  color: rgba(17, 24, 39, 0.7);
}

.fire_popup_v {
  word-break: break-all;
}

.nav_row {
  width: 100%;
  display: grid;
  grid-template-columns: 50px 1fr auto;
  gap: 10px;
  align-items: center;
}

.nav_row + .nav_row {
  margin-top: 10px;
}

.nav_label {
  font-size: 13px;
  color: #111827;
  line-height: 32px;
}

.nav_field {
  position: relative;
  display: grid;
  /* grid-template-columns: 1fr 56px; */
  gap: 8px;
}

.nav_input_ep {
  width: 100%;
}

.nav_input {
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  padding: 0 10px;
  outline: none;
  font-size: 13px;
}

.nav_input:focus {
  border-color: rgba(37, 99, 235, 0.7);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.nav_pick {
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(17, 24, 39, 0.9);
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
}

.nav_pick:hover {
  background: rgba(17, 24, 39, 1);
}

.nav_dropdown {
  grid-column: 1 / -1;
  margin-top: 6px;
  max-height: 220px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.98);
}

.nav_option {
  width: 100%;
  text-align: left;
  padding: 10px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.2;
  color: #111827;
}

.nav_option:hover {
  background: rgba(37, 99, 235, 0.08);
}

.nav_actions {
  /* margin-top: 12px; */
  display: flex;
  gap: 10px;
}

.nav_action {
  flex: 1;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(37, 99, 235, 0.92);
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
}

.nav_action:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.nav_action_secondary {
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
}

/* 基础控件样式 */
:global(.ol-control) {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
}

:global(.ol-control button) {
  width: 36px;
  height: 36px;
  font-size: 16px;
}

/* 移动端适配 */
:global(.is-mobile .ol-control button) {
  width: 44px;
  height: 44px;
  font-size: 18px;
}

:global(.is-mobile .ol-scale-line) {
  font-size: 14px;
  padding: 2px 8px;
}

:global(.ol-overviewmap) {
  bottom: 3.5em;
  right: 0.5em;
  width: 150px;
  height: 150px;
}

:global(.is-mobile .ol-overviewmap) {
  bottom: 5em;
  width: 120px;
  height: 120px;
}

/* 打印控件适配 */
:global(.ol-control.ol-print-dialog) {
  top: 0.5em;
  right: 7.5em;
}

:global(.is-mobile .ol-control.ol-print-dialog) {
  display: none;
}

/* 全屏控件适配 */
:global(.ol-rotate) {
  top: 3em;
  right: 0.5em;
}

:global(.is-mobile .ol-rotate) {
  top: 4em;
}

/* 缩放控件适配 */
:global(.ol-zoom) {
  top: calc(100% - 120px) !important;
  left: 0.5em;
}

:global(.is-mobile .ol-zoom) {
  left: 0.5em;
  /* top: 0.5em; */
  top: calc(100% - 120px) !important;
}

:global(.ol-zoom button) {
  width: 36px;
  height: 36px;
}

:global(.is-mobile .ol-zoom button) {
  width: 44px;
  height: 44px;
}
</style>
