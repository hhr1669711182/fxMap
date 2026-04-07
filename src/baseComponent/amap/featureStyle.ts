import { Fill, Icon, Stroke, Style } from "ol/style";
import type { AmapTmcStatus } from "./useAmapTools";

const statusToColor: Record<AmapTmcStatus, string> = {
  unknown: "#9CA3AF",
  smooth: "#22C55E",
  slow: "#F59E0B",
  jam: "#EF4444",
  serious_jam: "#7F1D1D",
};

export const createTmcLineStyle = (status: AmapTmcStatus, width = 6) => {
  return new Style({
    stroke: new Stroke({
      color: statusToColor[status] ?? statusToColor.unknown,
      width,
    }),
  });
};

export const createVehicleStyle = ({
  src,
  rotation,
  scale = 0.65,
}: {
  src: string;
  rotation: number;
  scale?: number;
}) => {
  return new Style({
    image: new Icon({
      src,
      rotation,
      rotateWithView: true,
      scale,
      anchor: [0.5, 0.5],
    }),
  });
};

export const createEndpointStyle = (type: "start" | "end" | "alarm") => {
  if (type === "alarm") {
    return createFireStationStyle(new URL("./imgs/alarm.png", import.meta.url).toString());
  };
  const color = type === "start" ? "#22C55E" : "#EF4444";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`;
  return new Style({
    image: new Icon({
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      anchor: [0.5, 0.5],
    }),
  });
};

export const createMaskStyle = () => {
  return new Style({
    fill: new Fill({ color: "rgba(0,0,0,0.12)" }),
    stroke: new Stroke({ color: "rgba(0,0,0,0)", width: 0 }),
  });
};

export const createBoundaryStyle = () => {
  return new Style({
    stroke: new Stroke({ color: "#2563EB", width: 3 }),
  });
};

export const createFireStationStyle = (iconSrc: string, scale = 0.8) => {
  return new Style({
    image: new Icon({
      src: iconSrc,
      anchor: [0.5, 1],
      scale,
    }),
  });
};

export type StyleKey =
  | "tmcLine"
  | "vehicle"
  | "endpoint"
  | "mask"
  | "boundary"
  | "fireStation";

type StyleParamsMap = {
  tmcLine: { status: AmapTmcStatus; width?: number };
  vehicle: { src: string; rotation: number; scale?: number };
  endpoint: { type: "start" | "end" | "alarm" };
  mask: undefined;
  boundary: undefined;
  fireStation: { iconSrc: string; scale?: number };
};

const cache = new Map<string, Style>();

const keyOf = (key: StyleKey, params: any) => {
  if (key === "tmcLine") return `tmcLine:${params.status}:${params.width ?? 6}`;
  if (key === "endpoint") return `endpoint:${params.type}`;
  if (key === "mask") return "mask";
  if (key === "boundary") return "boundary";
  if (key === "fireStation") return `fireStation:${params.iconSrc}:${params.scale ?? 0.8}`;
  if (key === "vehicle") return `vehicle:${params.src}:${params.scale ?? 0.65}`;
  return `${key}`;
};

export const getStyle = <K extends StyleKey>(
  key: K,
  params?: StyleParamsMap[K],
) => {
  if (key === "vehicle") {
    const p = params as StyleParamsMap["vehicle"];
    const ck = keyOf(key, p);
    const st = cache.get(ck) ?? createVehicleStyle({ src: p.src, rotation: 0, scale: p.scale });
    cache.set(ck, st);
    const img = st.getImage() as Icon;
    img.setRotation(p.rotation);
    return st;
  }

  const ck = keyOf(key, params);
  const exist = cache.get(ck);
  if (exist) return exist;

  let st: Style;
  switch (key) {
    case "tmcLine": {
      const p = params as StyleParamsMap["tmcLine"];
      st = createTmcLineStyle(p.status, p.width ?? 6);
      break;
    }
    case "endpoint": {
      const p = params as StyleParamsMap["endpoint"];
      st = createEndpointStyle(p.type);
      break;
    }
    case "mask":
      st = createMaskStyle();
      break;
    case "boundary":
      st = createBoundaryStyle();
      break;
    case "fireStation": {
      const p = params as StyleParamsMap["fireStation"];
      st = createFireStationStyle(p.iconSrc, p.scale ?? 0.8);
      break;
    }
    default:
      st = createMaskStyle();
  }

  cache.set(ck, st);
  return st;
};
