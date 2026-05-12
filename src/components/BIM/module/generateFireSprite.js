import * as THREE from "three";
import * as turf from '@turf/turf'
import { lonLatToLocalCoord } from "./commonThree.js";
import { commonSetting } from "./commonSetting.js";

export function createFireSprite(buildingsGroup, data, fireFloor) {
  const pos = getPosition(data, fireFloor)
  const fireScale = 0.6;
  const smokeScale = 0.8;
  const textureLoader = new THREE.TextureLoader();
  const fireTex = textureLoader.load("/model3d/xf_smoke.png");
  const fireMat = new THREE.SpriteMaterial({
    map: fireTex,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    //  blending: THREE.NormalBlending,
    // depthWrite: true,
    color: new THREE.Color(0xff3300),
  });
  const fire = new THREE.Sprite(fireMat);
  fire.scale.set(fireScale, fireScale, fireScale);
  fire.position.copy(pos);
  buildingsGroup.add(fire);
  buildingsGroup.add(fire.clone());

  const smokeMat = new THREE.SpriteMaterial({
    map: fireTex,
    transparent: true,
    opacity: 0.8,
    blending: THREE.NormalBlending,
    depthWrite: false,
    color: new THREE.Color(0x222222),
  });
  const smoke = new THREE.Sprite(smokeMat);
  smoke.scale.set(smokeScale, smokeScale, smokeScale);
  smoke.position.copy(pos.clone().add(new THREE.Vector3(0, 0.2, 0)));
  buildingsGroup.add(smoke);

  let time = 0;
  function animateFire() {
    time += 0.03;
    const t = time;
    const s = 1 + Math.sin(t * 2.5) * 0.02; // 呼吸幅度，可调整
    fire.scale.set(fireScale * s, fireScale * s, fireScale * s);
    smoke.scale.set(smokeScale * s, smokeScale * s, smokeScale * s);
    requestAnimationFrame(animateFire);
  }
  animateFire();
}

function getPosition(data, fireFloor) {
  const WALL_HEIGHT = commonSetting.wallAndFloor.WALL_HEIGHT; 
  const FLOOR_THICKNESS = commonSetting.wallAndFloor.FLOOR_THICKNESS;
  let floor = fireFloor
  if(fireFloor === 0) floor = parseInt(data.disasterBuilding.properties.floor)

  const centerPoint = turf.centroid(data.disasterBuilding) 
  const coor = centerPoint.geometry.coordinates
  const localCoord = lonLatToLocalCoord(coor[0], coor[1]); 
  const addH = floor * (FLOOR_THICKNESS + WALL_HEIGHT);

  return new THREE.Vector3(localCoord.x, addH, -localCoord.y)
}
