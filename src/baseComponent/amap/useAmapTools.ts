import Map from "ol/Map";
import Feature from "ol/Feature";
import { LineString, Point, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { unByKey } from "ol/Observable";
import type { EventsKey } from "ol/events";
import * as olProj from "ol/proj";
import Overlay from "ol/Overlay";
import { EventBus } from "../../util/mitt.ts";
import {
  getStyle
} from "./featureStyle";

export const NAV_FINISHED_EVENT = "amap:nav:finished";

export type NavFinishedPayload = {
  origin?: LngLat;
  destination?: LngLat;
  endPoint?: LngLat;
  finishedAt: number;
};

export type FireStationPoint = {
  lng: number;
  lat: number;
  title: string;
  address?: string;
  phone?: string;
};

export const createFireStationsLayer = (
  stations: FireStationPoint[],
  iconSrc: string,
  layerName = "FIRE_STATIONS_LAYER"
) => {
  const source = new VectorSource();
  const layer = new VectorLayer({
    source,
    className: layerName,
    zIndex: 50,
  });

  const style = getStyle("fireStation", { iconSrc, scale: 0.8 });

  for (const s of stations) {
    if (!Number.isFinite(s.lng) || !Number.isFinite(s.lat)) continue;
    const f = new Feature({
      geometry: new Point(olProj.fromLonLat([s.lng, s.lat])),
    });
    f.set("data", s);
    f.setStyle(style);
    source.addFeature(f);
  }

  return layer;
};

export const mountFireStations = (params: {
  map: Map;
  stations: FireStationPoint[];
  iconSrc: string;
  popupElement: HTMLElement;
  onSelect: (data: FireStationPoint) => void;
  onClose: () => void;
}) => {
  const layer = createFireStationsLayer(params.stations, params.iconSrc);
  params.map.addLayer(layer);

  const overlay = new Overlay({
    element: params.popupElement,
    positioning: "bottom-center",
    offset: [0, -14],
    stopEvent: true,
  });
  params.map.addOverlay(overlay);

  const clickKey: EventsKey = params.map.on("singleclick", (evt) => {
    let hit = false;
    params.map.forEachFeatureAtPixel(
      evt.pixel,
      (feature, l) => {
        if (l !== layer) return false;
        const data = (feature as any).get("data") as FireStationPoint | undefined;
        if (!data) return false;
        params.onSelect(data);
        overlay.setPosition(evt.coordinate);
        hit = true;
        return true;
      },
      { hitTolerance: 6 }
    );
    if (!hit) {
      params.onClose();
      overlay.setPosition(undefined);
    }
  });

  const hide = () => {
    params.onClose();
    overlay.setPosition(undefined);
  };

  const destroy = () => {
    unByKey(clickKey);
    params.map.removeOverlay(overlay);
    params.map.removeLayer(layer);
  };

  return { layer, overlay, hide, destroy };
};

export type LngLat = [number, number];

export type AmapDistrictQuery = {
  key: string;
  keywords: string;
  subdistrict?: number;
  extensions?: "base" | "all";
};

export type AmapDrivingQuery = {
  key: string;
  origin: LngLat;
  destination: LngLat;
  waypoints?: LngLat[];
  strategy?: number;
  extensions?: "base" | "all";
};

export type AmapTmcStatus =
  | "unknown"
  | "smooth"
  | "slow"
  | "jam"
  | "serious_jam";

export type AmapTmcSegment = {
  status: AmapTmcStatus;
  polyline: LngLat[];
};

export type AmapDrivingResult = {
  fullPath: LngLat[];
  tmcs: AmapTmcSegment[];
};

export type AmapInputTip = {
  id?: string;
  name: string;
  address?: string;
  district?: string;
  adcode?: string;
  location?: LngLat;
};

export type AmapInputTipsQuery = {
  key: string;
  keywords: string;
  city?: string;
  citylimit?: boolean;
};

export type AmapRegeoQuery = {
  key: string;
  location: LngLat;
  radius?: number;
};

const AMAP_V3_DISTRICT_URL = "https://restapi.amap.com/v3/config/district";
const AMAP_V3_INPUTTIPS_URL = "https://restapi.amap.com/v3/assistant/inputtips";
const AMAP_V3_REGEO_URL = "https://restapi.amap.com/v3/geocode/regeo";
const AMAP_V3_DRIVING_URL = "https://restapi.amap.com/v3/direction/driving";

const toLngLatString = ([lng, lat]: LngLat) => `${lng},${lat}`;

const parsePolyline = (polyline: string): LngLat[] => {
  if (!polyline) return [];
  return polyline
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [lng, lat] = pair.split(",").map((v) => Number(v));
      return [lng, lat] as LngLat;
    })
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
};

export const parseMultiPolyline = (polylineGroup: string): LngLat[][] => {
  if (!polylineGroup) return [];
  return polylineGroup
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parsePolyline)
    .filter((ring) => ring.length >= 3);
};

const buildUrl = (baseUrl: string, params: Record<string, string>) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && `${v}`.length) {
      url.searchParams.set(k, `${v}`);
    }
  });
  return url.toString();
};

const jsonpRequest = <T = any>(url: string, timeoutMs = 15000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const callbackName =
      "__amap_jsonp_" +
      Math.random().toString(36).slice(2) +
      "_" +
      Date.now().toString(36);

    const script = document.createElement("script");
    let timeoutId: number | null = null;

    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = null;
      script.onerror = null;
      if (script.parentNode) script.parentNode.removeChild(script);
      try {
        delete (window as any)[callbackName];
      } catch {
        (window as any)[callbackName] = undefined;
      }
    };

    (window as any)[callbackName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("AMap JSONP timeout"));
    }, timeoutMs);

    script.onerror = () => {
      cleanup();
      reject(new Error("AMap JSONP network error"));
    };

    const sep = url.includes("?") ? "&" : "?";
    script.src = `${url}${sep}callback=${callbackName}`;
    document.head.appendChild(script);
  });
};

export const fetchInputTips = async (
  query: AmapInputTipsQuery
): Promise<AmapInputTip[]> => {
  const url = buildUrl(AMAP_V3_INPUTTIPS_URL, {
    key: query.key,
    keywords: query.keywords,
    city: query.city ?? "",
    citylimit: query.citylimit ? "true" : "false",
    output: "JSON",
  });

  const data = await jsonpRequest<any>(url);
  if (data?.status === "0") {
    return [];
  }
  const tips = (data?.tips ?? []) as any[];
  return tips
    .map((t) => {
      const loc = `${t?.location ?? ""}`.trim();
      const lngLat =
        loc && loc.includes(",")
          ? ([Number(loc.split(",")[0]), Number(loc.split(",")[1])] as LngLat)
          : undefined;
      return {
        id: t?.id,
        name: `${t?.name ?? ""}`.trim(),
        address: `${t?.address ?? ""}`.trim() || undefined,
        district: `${t?.district ?? ""}`.trim() || undefined,
        adcode: `${t?.adcode ?? ""}`.trim() || undefined,
        location: lngLat,
      } as AmapInputTip;
    })
    .filter((t) => t.name);
};

export const fetchRegeo = async (
  query: AmapRegeoQuery
): Promise<{ formattedAddress: string; poiName?: string }> => {
  const url = buildUrl(AMAP_V3_REGEO_URL, {
    key: query.key,
    location: toLngLatString(query.location),
    radius: `${query.radius ?? 200}`,
    extensions: "all",
    batch: "false",
    roadlevel: "0",
    output: "JSON",
  });

  const data = await jsonpRequest<any>(url);
  if (data?.status === "0") {
    throw new Error(`${data?.info || "AMap regeo failed"}`);
  }
  const regeocode = data?.regeocode;
  const formattedAddress = `${regeocode?.formatted_address ?? ""}`.trim();
  const poiName = `${regeocode?.pois?.[0]?.name ?? ""}`.trim() || undefined;
  return { formattedAddress, poiName };
};

export const fetchDistrictBoundary = async (
  query: AmapDistrictQuery
): Promise<LngLat[][]> => {
  const url = buildUrl(AMAP_V3_DISTRICT_URL, {
    key: query.key,
    keywords: query.keywords,
    subdistrict: `${query.subdistrict ?? 0}`,
    extensions: query.extensions ?? "all",
    output: "JSON",
  });

  const data = await jsonpRequest<any>(url);
  if (data?.status === "0") {
    throw new Error(`${data?.info || "AMap district failed"}`);
  }
  const districts = data?.districts;
  const boundary = districts?.[0]?.polyline as string | undefined;
  return boundary ? parseMultiPolyline(boundary) : [];
};

const normalizeStatus = (status: unknown): AmapTmcStatus => {
  const s = `${status ?? ""}`.toLowerCase();
  if (s === "畅通" || s === "smooth") return "smooth";
  if (s === "缓行" || s === "slow") return "slow";
  if (s === "拥堵" || s === "jam") return "jam";
  if (s === "严重拥堵" || s === "serious_jam") return "serious_jam";
  return "unknown";
};

export const fetchDrivingRoute = async (
  query: AmapDrivingQuery
): Promise<AmapDrivingResult> => {
  const url = buildUrl(AMAP_V3_DRIVING_URL, {
    key: query.key,
    origin: toLngLatString(query.origin),
    destination: toLngLatString(query.destination),
    waypoints: query.waypoints?.length
      ? query.waypoints.map(toLngLatString).join("|")
      : "",
    strategy: `${query.strategy ?? 0}`,
    extensions: query.extensions ?? "all",
    output: "JSON",
  });

  const data = await jsonpRequest<any>(url);
  if (data?.status === "0") {
    throw new Error(`${data?.info || "AMap driving failed"}`);
  }
  const path = data?.route?.paths?.[0];
  const steps = path?.steps ?? [];

  const tmcs: AmapTmcSegment[] = [];
  const fullPath: LngLat[] = [];

  for (const step of steps) {
    const stepPolyline = parsePolyline(step?.polyline ?? "");
    for (const p of stepPolyline) fullPath.push(p);

    const stepTmcs = step?.tmcs ?? [];
    for (const tmc of stepTmcs) {
      const seg = parsePolyline(tmc?.polyline ?? "");
      if (!seg.length) continue;
      tmcs.push({ status: normalizeStatus(tmc?.status), polyline: seg });
    }
  }

  if (!tmcs.length && fullPath.length) {
    tmcs.push({ status: "unknown", polyline: fullPath });
  }

  return { fullPath, tmcs };
};

export const buildMaskFeature = (
  holesLngLat: LngLat[][]
): Feature<Polygon> => {
  const outerRing: LngLat[] = [
    [73.0, 3.0],
    [136.0, 3.0],
    [136.0, 54.0],
    [73.0, 54.0],
    [73.0, 3.0],
  ];

  const coordinates = [
    outerRing.map((p) => olProj.fromLonLat(p)),
    ...holesLngLat.map((ring) => ring.map((p) => olProj.fromLonLat(p))),
  ];

  return new Feature({
    geometry: new Polygon(coordinates),
  });
};

export const buildBoundaryFeature = (ringsLngLat: LngLat[][]) => {
  const ring = ringsLngLat[0] ?? [];
  const coords = ring.map((p) => olProj.fromLonLat(p));
  return new Feature({
    geometry: new LineString(coords),
  });
};

export const buildTmcFeatures = (tmcs: AmapTmcSegment[]) => {
  return tmcs
    .map((t) => {
      const coords = t.polyline.map((p) => olProj.fromLonLat(p));
      if (coords.length < 2) return null;
      const f = new Feature({ geometry: new LineString(coords) });
      f.set("tmcStatus", t.status);
      return f;
    })
    .filter(Boolean) as Feature<LineString>[];
};

const buildProjectedDistanceIndex = (coords: number[][]) => {
  const distances: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const [x1, y1] = coords[i - 1];
    const [x2, y2] = coords[i];
    const d = Math.hypot(x2 - x1, y2 - y1);
    distances.push(distances[i - 1] + d);
  }
  return distances;
};

const interpolateOnLine = (
  coords: number[][],
  distances: number[],
  targetDistance: number
) => {
  if (!coords.length) return { point: null as number[] | null, bearing: 0 };
  if (targetDistance <= 0) {
    const bearing = coords.length >= 2 ? safeBearingRad(coords, 1) : 0;
    return { point: coords[0], bearing };
  }
  const total = distances[distances.length - 1] ?? 0;
  if (targetDistance >= total) {
    const last = coords[coords.length - 1];
    const prev = coords[coords.length - 2] ?? last;
    return { point: last, bearing: safeBearingRad(coords, coords.length - 1) };
  }

  let i = 1;
  while (i < distances.length && distances[i] < targetDistance) i++;
  const d0 = distances[i - 1];
  const d1 = distances[i];
  const t = d1 === d0 ? 0 : (targetDistance - d0) / (d1 - d0);
  const [x0, y0] = coords[i - 1];
  const [x1, y1] = coords[i];
  const x = x0 + (x1 - x0) * t;
  const y = y0 + (y1 - y0) * t;
  return { point: [x, y], bearing: safeBearingRad(coords, i) };
};

const bearingRad = (a: number[], b: number[]) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.atan2(dy, dx);
};

const isSameCoord = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];

const safeBearingRad = (coords: number[][], endIndex: number) => {
  if (coords.length < 2) return 0;
  let i = Math.max(1, Math.min(endIndex, coords.length - 1));

  let a = coords[i - 1];
  let b = coords[i];

  if (!isSameCoord(a, b)) return bearingRad(a, b);

  let j = i + 1;
  while (j < coords.length) {
    b = coords[j];
    if (!isSameCoord(a, b)) return bearingRad(a, b);
    j++;
  }

  j = i - 2;
  b = coords[i];
  while (j >= 0) {
    a = coords[j];
    if (!isSameCoord(a, b)) return bearingRad(a, b);
    j--;
  }

  return 0;
};

const normalizeAngleNear = (angle: number, reference: number | null) => {
  if (reference === null) return angle;
  let a = angle;
  while (a - reference > Math.PI) a -= Math.PI * 2;
  while (a - reference < -Math.PI) a += Math.PI * 2;
  return a;
};

export type AmapRealtimeNavOptions = {
  amapKey: string;
  xzKeywords?: string;
  refreshMs?: number;
  speedMps?: number;
  minSpeedMps?: number;
  maxSpeedMps?: number;
  minDurationSec?: number;
  maxDurationSec?: number;
  vehicleHeadingOffsetRad?: number;
  loop?: boolean;
  vehicleIconSrc: string;
};

const clampNumber = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const computeSpeedMps = (totalMeters: number, opt: AmapRealtimeNavOptions) => {
  const minSpeed = opt.minSpeedMps ?? 4;
  const maxSpeed = opt.maxSpeedMps ?? 35;
  const minDuration = opt.minDurationSec ?? 20;
  const maxDuration = opt.maxDurationSec ?? 180;

  let speed = opt.speedMps;
  if (!speed || !Number.isFinite(speed) || speed <= 0) {
    const nominalSpeed = 12;
    const duration = clampNumber(
      totalMeters / nominalSpeed,
      minDuration,
      maxDuration
    );
    speed = duration > 0 ? totalMeters / duration : nominalSpeed;
  }

  return clampNumber(speed, minSpeed, maxSpeed);
};

export class AmapRealtimeNav {
  private map: Map;
  private options: AmapRealtimeNavOptions;
  private clickKey: EventsKey | null = null;
  private picking: "idle" | "start" | "end" = "idle";
  private pickStart: LngLat | null = null;
  private pickEnd: LngLat | null = null;
  private timerId: number | null = null;
  private rafId: number | null = null;
  private vehicleFeature: Feature<Point> | null = null;
  private routeProjectedCoords: number[][] = [];
  private routeDistances: number[] = [];
  private animationStartTs = 0;
  private currentDistance = 0;
  private lastVehicleRotation: number | null = null;
  private routeLayer: VectorLayer<VectorSource> | null = null;
  private maskLayer: VectorLayer<VectorSource> | null = null;
  private pointLayer: VectorLayer<VectorSource> | null = null;
  private startMarker: Feature<Point> | null = null;
  private endMarker: Feature<Point> | null = null;
  private originLngLat: LngLat | null = null;
  private destinationLngLat: LngLat | null = null;

  constructor(map: Map, options: AmapRealtimeNavOptions) {
    this.map = map;
    this.options = {
      xzKeywords: "珠海市",
      refreshMs: 15000,
      speedMps: undefined,
      minSpeedMps: 4,
      maxSpeedMps: 35,
      minDurationSec: 20,
      maxDurationSec: 180,
      vehicleHeadingOffsetRad: Math.PI / 2,
      loop: false,
      ...options,
    };
    this.ensureLayers();
  }

  setKey(amapKey: string) {
    this.options.amapKey = amapKey;
  }

  setRegionKeywords(keywords: string) {
    (this.options as any).xzKeywords = keywords;
  }

  async loadMask(boundaryRings?: LngLat[][]) {
    const rings =
      boundaryRings?.length && boundaryRings[0]?.length
        ? boundaryRings
        : await fetchDistrictBoundary({
          key: this.options.amapKey,
          keywords: this.options.xzKeywords ?? "",
          subdistrict: 0,
          extensions: "all",
        });

    if (!rings?.length) return;

    const mask = buildMaskFeature(rings);
    mask.setStyle(getStyle("mask"));

    const boundary: any = buildBoundaryFeature(rings);
    boundary.setStyle(getStyle("boundary"));

    const source = this.maskLayer!.getSource()!;
    source.clear();
    source.addFeature(mask);
    source.addFeature(boundary);

    // const extent = boundary.getGeometry().getExtent();
    // this.map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 300 });
  }

  startPickPoints() {
    this.stop();
    this.ensureLayers();
    this.clearEndpoints();
    this.picking = "start";
    this.pickStart = null;
    this.pickEnd = null;

    const targetEl = this.map.getTargetElement();
    if (targetEl) targetEl.style.cursor = "crosshair";

    this.clickKey = this.map.on("singleclick", (evt) => {
      const lngLat = olProj.toLonLat(evt.coordinate) as LngLat;
      if (this.picking === "start") {
        this.pickStart = lngLat;
        this.setEndpoint("start", lngLat);
        this.picking = "end";
        return;
      }
      if (this.picking === "end") {
        this.pickEnd = lngLat;
        this.setEndpoint("end", lngLat);
        this.picking = "idle";
        this.exitPickingMode();
        void this.planAndStart(this.pickStart!, this.pickEnd!);
      }
    });
  }

  async pickAddressPoint(type: "start" | "end") {
    if (!this.options.amapKey) return null;
    this.exitPickingMode();

    const targetEl = this.map.getTargetElement();
    if (targetEl) targetEl.style.cursor = "crosshair";

    return await new Promise<{ lngLat: LngLat; address: string } | null>(
      (resolve) => {
        this.clickKey = this.map.on("singleclick", async (evt) => {
          this.exitPickingMode();
          const lngLat = olProj.toLonLat(evt.coordinate) as LngLat;
          try {
            const { formattedAddress, poiName } = await fetchRegeo({
              key: this.options.amapKey,
              location: lngLat,
            });
            const address = poiName
              ? `${poiName}（${formattedAddress}）`
              : formattedAddress;
            this.setEndpoint(type, lngLat);
            resolve({ lngLat, address });
          } catch {
            this.setEndpoint(type, lngLat);
            resolve({ lngLat, address: `${lngLat[0]},${lngLat[1]}` });
          }
        });
      }
    );
  }

  cancelPick() {
    this.exitPickingMode();
    this.clearEndpoints();
  }

  stop() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.animationStartTs = 0;
    this.currentDistance = 0;
    this.lastVehicleRotation = null;
    this.routeProjectedCoords = [];
    this.routeDistances = [];
    this.originLngLat = null;
    this.destinationLngLat = null;
    this.vehicleFeature = null;
    this.routeLayer?.getSource()?.clear();
    this.exitPickingMode();
  }

  destroy() {
    this.stop();
    this.map.removeLayer(this.routeLayer!);
    this.map.removeLayer(this.maskLayer!);
    this.map.removeLayer(this.pointLayer!);
    this.routeLayer = null;
    this.maskLayer = null;
    this.pointLayer = null;
  }

  private exitPickingMode() {
    if (this.clickKey) {
      unByKey(this.clickKey);
      this.clickKey = null;
    }
    this.picking = "idle";
    const targetEl = this.map.getTargetElement();
    if (targetEl) targetEl.style.cursor = "";
  }

  private ensureLayers() {
    if (!this.routeLayer) {
      this.routeLayer = new VectorLayer({
        source: new VectorSource(),
        zIndex: 20,
      });
      this.map.addLayer(this.routeLayer);
    }
    if (!this.maskLayer) {
      this.maskLayer = new VectorLayer({
        source: new VectorSource(),
        zIndex: 10,
      });
      this.map.addLayer(this.maskLayer);
    }
    if (!this.pointLayer) {
      this.pointLayer = new VectorLayer({
        source: new VectorSource(),
        zIndex: 30,
      });
      this.map.addLayer(this.pointLayer);
    }
  }

  private clearPoints() {
    this.pointLayer?.getSource()?.clear();
  }

  clearEndpoints() {
    this.startMarker = null;
    this.endMarker = null;
    this.clearPoints();
  }

  setEndpoint(type: "start" | "end", lngLat: LngLat) {
    this.ensureLayers();
    const coordinate = olProj.fromLonLat(lngLat);
    const f = new Feature({ geometry: new Point(coordinate) });
    f.setStyle(getStyle("endpoint", { type }));
    const src = this.pointLayer!.getSource()!;
    if (type === "start") {
      if (this.startMarker) src.removeFeature(this.startMarker);
      this.startMarker = f;
    } else {
      if (this.endMarker) src.removeFeature(this.endMarker);
      this.endMarker = f;
    }
    src.addFeature(f);
  }

  async planAndStart(origin: LngLat, destination: LngLat) {
    this.stop();
    if (!this.options.amapKey) return;
    this.pickStart = origin;
    this.pickEnd = destination;
    this.originLngLat = origin;
    this.destinationLngLat = destination;

    const updateRoute = async (preserveDistance: boolean) => {
      const result = await fetchDrivingRoute({
        key: this.options.amapKey,
        origin,
        destination,
        extensions: "all",
      });
      this.renderRoute(result, preserveDistance);
    };

    await updateRoute(false);

    if (this.options.refreshMs && this.options.refreshMs > 0) {
      this.timerId = window.setInterval(() => {
        void updateRoute(true);
      }, this.options.refreshMs);
    }
  }

  private renderRoute(result: AmapDrivingResult, preserveDistance: boolean) {
    const source = this.routeLayer!.getSource()!;
    source.clear();

    const tmcFeatures = buildTmcFeatures(result.tmcs);
    for (const f of tmcFeatures) {
      const status = (f.get("tmcStatus") ?? "unknown") as AmapTmcStatus;
      f.setStyle(getStyle("tmcLine", { status, width: 6 }));
      source.addFeature(f);
    }

    const fullProjected = result.fullPath.map((p) => olProj.fromLonLat(p));
    this.routeProjectedCoords = fullProjected;
    this.routeDistances = buildProjectedDistanceIndex(fullProjected);
    this.lastVehicleRotation = null;

    if (fullProjected.length >= 2) {
      const extent = new LineString(fullProjected).getExtent();
      this.map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 300 });
    }

    this.ensureVehicle(source);
    this.startVehicleAnimation(preserveDistance);
  }

  private ensureVehicle(source: VectorSource) {
    if (!this.vehicleFeature) {
      this.vehicleFeature = new Feature({ geometry: new Point([0, 0]) });
    }
    sourceAddOnce(source, this.vehicleFeature);
  }

  private startVehicleAnimation(preserveDistance: boolean) {
    if (!this.vehicleFeature) return;
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    const now = performance.now();

    const total = this.routeDistances[this.routeDistances.length - 1] ?? 0;
    if (!total || this.routeProjectedCoords.length < 2) return;

    const speed = computeSpeedMps(total, this.options);

    if (preserveDistance) {
      this.animationStartTs = now - (this.currentDistance / speed) * 1000;
    } else {
      this.currentDistance = 0;
      this.animationStartTs = now;
      this.lastVehicleRotation = null;
    }

    const loop = this.options.loop ?? false;

    const tick = (ts: number) => {
      const elapsed = (ts - this.animationStartTs) / 1000;
      const rawDist = elapsed * speed;
      const targetDist = loop ? rawDist % total : Math.min(rawDist, total);
      this.currentDistance = targetDist;
      const { point, bearing } = interpolateOnLine(
        this.routeProjectedCoords,
        this.routeDistances,
        targetDist
      );
      if (point) {
        (this.vehicleFeature!.getGeometry() as Point).setCoordinates(point);
        const offset = this.options.vehicleHeadingOffsetRad ?? Math.PI / 2;
        const desiredRotation = -bearing + offset;
        const rotation = normalizeAngleNear(desiredRotation, this.lastVehicleRotation);
        this.lastVehicleRotation = rotation;
        this.vehicleFeature!.setStyle(
          getStyle("vehicle", {
            src: this.options.vehicleIconSrc,
            rotation,
            scale: 0.65,
          })
        );
      }
      if (!loop && targetDist >= total) {
        if (this.timerId) {
          window.clearInterval(this.timerId);
          this.timerId = null;
        }
        EventBus.emit(NAV_FINISHED_EVENT, {
          origin: this.originLngLat ?? undefined,
          destination: this.destinationLngLat ?? undefined,
          endPoint: this.pickEnd ?? undefined,
          finishedAt: Date.now(),
        } as NavFinishedPayload);
        this.rafId = null;
        return;
      }
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }
}

const sourceAddOnce = (source: VectorSource, feature: Feature) => {
  if (source.getFeatures().includes(feature)) return;
  source.addFeature(feature);
};
