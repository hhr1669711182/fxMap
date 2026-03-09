<script setup lang="ts">
import { onMounted, nextTick, onUnmounted } from "vue";
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

const emit = defineEmits(["setMap"]);

// 响应式检测
const { isMobile } = useResponsive();
const { isTouchDevice } = useTouch();

let map: Map | null = null;

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
  
  map.addControl(new FullScreen());
  map.addControl(new ScaleLine());
  // map.addControl(new ZoomToExtent({ extent: EXTENT }));

  // 打印控件（仅在桌面端）
  if (!isMobile.value) {
    const printControl = new PrintDialog({
      lang: "zh",
    });
    printControl.setSize("A4");
    map.addControl(printControl);

    printControl.on(["print", "error"], (e) => {
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
            e.print.imageHeight
          );
          pdf.save(e.print.legend ? "legend.pdf" : `openlayers_${uuid}.pdf`);
        } else {
          e.canvas.toBlob(
            (blob) => {
              const name =
                (e.print.legend ? "legend." : `map_${uuid}.`) +
                e.imageType.replace("image/", "");
              saveAs(blob, name);
            },
            e.imageType,
            e.quality
          );
        }
      } else {
        console.warn("No canvas to export");
      }
    });
  }

  emit("setMap", map);
};

/**
 * 清理资源
 */
const cleanup = () => {
  if (map) {
    map.dispose();
    map = null;
  }
};

onMounted(() => {
  nextTick(() => {
    initMap();
  });
});

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div id="map" :class="{ 'is-mobile': isMobile }" tabindex="2"></div>
</template>

<style scoped>
#map {
  height: 100%;
  width: 100%;
  touch-action: none; /* 优化触摸体验 */
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
  top: 0.5em;
  left: 0.5em;
}

:global(.is-mobile .ol-zoom) {
  left: 0.5em;
  top: 0.5em;
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
