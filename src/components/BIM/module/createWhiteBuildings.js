import * as THREE from "three";
import { lonLatToLocalCoord } from "./commonThree.js";
import { commonSetting } from "./commonSetting.js";
//import { dataZH } from "@/data/buildDemo.js";

export const createWhiteBuildings = async (buildingsGroup, dataZH) => { 
  const whiteMaterial = new THREE.MeshLambertMaterial({
    color: 0xf5f5f5, //0xffffff
    //roughness: 0.6,         // 粗糙度（不要太高）
    //metalness: 0.0 ,         // 白模不要金属感
    transparent: true,
    opacity: 1,
  });

  dataZH.whiteBuilding.forEach((feature) => {
    const buildGuid = feature.properties.buildGuid;
    const name = feature.properties.shortName;
    const height = feature.properties.floor / 18.0;
    const coordinates = feature.geometry.coordinates[0][0]; // 提取Polygon轮廓

    const shapePoints = [];
    coordinates.forEach(([lon, lat]) => {
      const localCoord = lonLatToLocalCoord(lon, lat);
      shapePoints.push(localCoord);
    });

    const shape = new THREE.Shape(shapePoints);
    const extrudeSettings = {
      depth: height, // 拉伸高度（建筑高度）
      bevelEnabled: false, // 无倒角，白模更简洁
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.computeBoundingBox();

    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    const buildingMesh = new THREE.Mesh(geometry, whiteMaterial);
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    // 调整轴：Three.js中y轴为垂直方向，旋转几何体让轮廓在x/z平面
    buildingMesh.rotation.x = -Math.PI / 2;
    // 绑定建筑信息（用于点击交互）
    buildingMesh.userData = { name, height };
    buildingsGroup.add(buildingMesh);
  });
};

export const loadBuildingData = async () => {
  const lon = commonSetting.basePoint.baseLon 
  const lat = commonSetting.basePoint.baseLat

  const buildGuid = commonSetting.disasterBuildingID
  const radius = commonSetting.searchRadius
  const url = commonSetting.geoServerUrl
  const ws = commonSetting.gisWorkspace
  const layerName = commonSetting.whiteBuilding.layerName
  const geom = commonSetting.whiteBuilding.geom

  const postBody = `
    <wfs:GetFeature service="WFS" version="1.0.0" outputFormat="json"
    xmlns:wfs="http://www.opengis.net/wfs"
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:gml="http://www.opengis.net/gml">
    <wfs:Query typeName="${layerName}">
        <ogc:Filter>
        <ogc:DWithin>
            <ogc:PropertyName>${geom}</ogc:PropertyName>
            <gml:Point srsName="EPSG:4326">
                <gml:coordinates>${lon},${lat}</gml:coordinates>
            </gml:Point>
            <ogc:Distance units="meters">${radius}</ogc:Distance>
        </ogc:DWithin>
        </ogc:Filter>
    </wfs:Query>
    </wfs:GetFeature>`;

  const res = await fetch(`${url}/geoserver/${ws}/ows`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: postBody,
  });
  const data = await res.json();
  const whiteBuilding = data.features.filter( item => item.properties.buildGuid != buildGuid) 
  const disasterBuilding = data.features.find( item => item.properties.buildGuid === buildGuid) 
  console.log("disasterBuilding ", disasterBuilding)
  return { whiteBuilding, disasterBuilding }
};