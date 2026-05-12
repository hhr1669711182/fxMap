import * as turf from '@turf/turf'
import { CoordinateUtil } from "./transformCoordinate.js";

export const commonSetting = {
  basePoint: { baseLon: 113.54581672, baseLat: 22.22169833 },
  disasterBuildingID: "688B9A3F38EA48E6AECD87AB911092A1",
  truckFullPath: [
    [
      [113.54776032, 22.22632892],
      [113.54818221, 22.22296648],
      [113.54606806, 22.22259461],
    ],
  ],

  geoServerUrl: "http://192.168.172.103:8090",
  searchRadius: 350,
  buildRadius: 200,
  gisWorkspace: "gis",

  fireHydrant: { layerName: "gis:srvc_water_hydrant", geom: "geom" },
  whiteBuilding: { layerName: "gis:mapBuilding", geom: "geom" },

  wallAndFloor: {
    WALL_HEIGHT: 0.1,
    WALL_THICKNESS: 0.01,
    FLOOR_THICKNESS: 0.01,
  },
};

export const getDispatchData = (dispatchStore) => {
  console.log("dispatchStore", dispatchStore) 
  let gisPoint = CoordinateUtil.gcj02Towgs84(dispatchStore.alarmData.gisX, dispatchStore.alarmData.gisY) 
  commonSetting.basePoint.baseLon = gisPoint[0]
  commonSetting.basePoint.baseLat = gisPoint[1]

  const navPathPlanData = dispatchStore.navPathPlanData
  for(const key in navPathPlanData){  
    let truckPath =[]
    navPathPlanData[key].fullPath.forEach(item =>{
      truckPath.push(CoordinateUtil.gcj02Towgs84(item[0], item[1]))
    })   
    const path = calculatePath(truckPath)
    commonSetting.truckFullPath.push(path) 
  }
};

const calculatePath = (fullPath) => {
  let idx = 0;
  const basePoint = [
    commonSetting.basePoint.baseLon,
    commonSetting.basePoint.baseLat,
  ];
  for (let i = 0; i < fullPath.length; i++) {
    const distance = turf.distance(basePoint, fullPath[i], { units: "meters" });
    if (distance < commonSetting.searchRadius) {
      idx = i;
      break;
    }
  }
  return fullPath.slice(idx);
};
