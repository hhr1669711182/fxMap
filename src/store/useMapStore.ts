/*
 * @Author: huanghuanrong
 * @Date: 2026-03-31 15:30:08
 * @LastEditTime: 2026-04-13 18:34:23
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \OpenlayersMap\src\store\useMapStore.ts
 */
import { defineStore } from "pinia";
import { Map } from "ol";

export interface MapState {
  map: Map | Object | null;
  mode: string;
  showGrid: boolean;
  showWaterMarker: boolean;
  showSwipe: boolean;
}

export const useMapStore = defineStore("mapStore", {
  state: (): MapState => {
    return {
      map: {},
      mode: "2D",
      showGrid: false,
      showWaterMarker: false,
      showSwipe: false,
    };
  },
  actions: {
    setMap(map: Object) {
      this.map = map;
    },
    setMapMode(mode: string) {
      this.mode = mode;
      return { mode };
    },
    setShowGrid(visible: boolean) {
      this.showGrid = visible;
    },
  },
});