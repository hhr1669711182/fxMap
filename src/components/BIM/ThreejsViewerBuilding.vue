<template>
 <div class="full-screen-div">
  <!-- Three.js 画布容器 -->
  <div ref="container" class="three-canvas"></div>
  <div class="dropdown-container">
    <label>显示楼层：</label>
    <select v-model="selectedWindow" @change="onWindowChange">
      <option value=7>8楼</option>
      <option value=6>7楼</option>
      <option value=5>6楼</option>
      <option value=4>5楼</option>
      <option value=3>4楼</option>
      <option value=2>3楼</option>
      <option value=1>2楼</option>
      <option value=0>1楼</option>
    </select>
  </div>
 </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'; 
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Timer } from 'three/addons/misc/Timer.js';
import * as turf from '@turf/turf'; 
import  { dataZH } from '@/data/buildDemo.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as ClipperLib from 'js-clipper' 

const container = ref(null);
const selectedWindow = ref('7')
const onWindowChange = () => {
  //console.log('change floor ', selectedWindow.value)  
  allFloors.forEach(f => f.visible = true)
  for(let i=0; i< allFloors.length; i++){
    if (i>selectedWindow.value ){
      allFloors[i].visible = false
    }
  } 
}

const floorMeshes = []
let scene, camera, renderer, controls, buildingsGroup, animateId, labelRenderer,count;
let allFloors =[]
const buildingGeoJSON = dataZH

const WALL_HEIGHT = 0.1
const WALL_THICKNESS = 0.01  
const FLOOR_THICKNESS = 0.01

const clockTruck = new Timer()
let fireTruck = undefined
let movePath = undefined
let pathProgress = 0 // 行驶进度（0~1）
const speedTruck = 0.15 // 行驶速度
let mixer; // 动画控制器

function lonLatToLocalCoord(lon, lat, isVector3 = false) {
  // 步骤1：以园区中心点为原点（取GeoJSON第一个点作为基准）
  //113.551334716036351, 22.223844002883901
  const baseLon = 113.54581672;
  const baseLat = 22.22169833;
  // 步骤2：经纬度转平面距离（米），简化计算（或用turf计算）
  const dx = (lon - baseLon) * 111319.9; // 经度每度≈111319.9米
  const dy = (lat - baseLat) * 111319.9; // 纬度每度≈111319.9米
  // 步骤3：缩放适配Three.js场景（缩小100倍，避免模型过大）
  if(isVector3){
    return new THREE.Vector3(dx / 100, 0, -dy / 100);
  }else{
    return new THREE.Vector2(dx / 100, dy / 100);
  }  
}
// 4. 初始化Three.js场景
const initThree = async () => {
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeaf3ff);//0xf0f8ff
  // 创建相机（透视相机，适配园区尺度）
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000);
  camera.position.set(0.5, 2.0, 2); // 俯瞰视角  
  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  container.value.appendChild(renderer.domElement);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.value.clientWidth, container.value.clientHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.pointerEvents = 'none'; // 避免标签遮挡交互
  container.value.appendChild(labelRenderer.domElement);
  // 轨道控制器（鼠标交互）
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 灯光（让白模有光影层次）
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);//0xffffff
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 10.2);//0xffffff
  
  dirLight.position.set(50, 500, 10);  
  dirLight.castShadow = true;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-100, 50, -100);
  scene.add(fillLight);
  // 创建建筑组（统一管理所有建筑）
  buildingsGroup = new THREE.Group();
  scene.add(buildingsGroup);

  const loader = new GLTFLoader() 
  loader.load('/src/assets/data/gltf/B370921843501063A0.gltf',function(gltf) {  
    gltf.scene.traverse((child) => {
      if (child.isMesh) {   
        child.material.metalness=0
        //child.material.roughness=0   
      }
    }); 
    const model = gltf.scene;
    model.scale.setScalar(0.01);
    const box = new THREE.Box3().setFromObject(model);  
    let center = box.getCenter(new THREE.Vector3()); 
    center.x -=3.3
    center.y -=0.7
    center.z -=1.7
    //model.scale.set(0.1, 0.1, 0.1); // 缩放模型（根据实际大小调整）
    model.position.sub(center);   
    //model.position.set(5, 0, 0); // 模型居中  
    //scene.add(gltf.scene) 
  }) 
 
  loadFireHydrant()
  await loadFireTruck()
  loadFireFighter()  
  // 5. 解析GeoJSON并生成建筑白模
  //parseGeoJSONAndCreateBuildings();
};

async function loadExtinguisher(floor){
  const addH = floor * (FLOOR_THICKNESS + WALL_HEIGHT)
  const gltf = await loadGLTF('/src/assets/data/xf_extinguisher.glb')
  const model = gltf.scene;
  // model.scale.setScalar(0.0002);
  model.scale.set(0.00025, 0.0002, 0.00025); // 缩放模型（根据实际大小调整）  
  model.position.set(-0.95, addH, -0.55); // 模型居中 
  //scene.add(gltf.scene) 
  return model
}

function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => resolve(gltf),     // 成功时 resolve
      undefined,                   // 可选：进度回调（通常省略）
      (error) => reject(error)     // 失败时 reject
    );
  });
}

function loadFireFighter() {
  const loader = new GLTFLoader() 
  loader.load('/src/assets/data/xf_firefighter.glb',function(gltf) { 
   const model = gltf.scene;
     model.scale.setScalar(0.1);
    //model.scale.set(0., 0.1, 0.1); // 缩放模型（根据实际大小调整）  
    model.position.set(0.35, 0, -0.8); 
    scene.add(gltf.scene) 

    // 1. 创建动画混合器
   mixer = new THREE.AnimationMixer(gltf.scene);  
   if (gltf.animations.length > 0) {
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
  }
  })
}

async function loadFireTruck() {
  const gltf = await loadGLTF('/src/assets/data/xf_fire_truck.glb')
  const model = gltf.scene;
  model.scale.setScalar(0.06); 
  const localCoord = lonLatToLocalCoord(113.54606806, 22.22259461, true) 
  model.position.set(localCoord.x, localCoord.y, localCoord.z);    
 
  fireTruck = model
 //fireTruck.rotation.y += Math.PI / 2 
  scene.add(gltf.scene)  
  //drawTruckPath()
  createFireSprite(new THREE.Vector3(0, 0.9, -0.03))
}

function loadFireHydrant() {
  const loader = new OBJLoader() 
  loader.load('/src/assets/data/xf_fire_hydrant.obj', (object) => {  
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshLambertMaterial({ color: 0xff0000 })
      }
    })   
    let scale=0.002
    object.scale.set(scale, scale, scale)
    object.rotation.x = -Math.PI / 2;
    object.position.y = 0
    object.position.x = -0.7
    object.position.z = 0.5
    scene.add(object)
  }) 
}

function createFireSprite(pos) {
  const fireScale = 0.6
  const smokeScale = 0.8
  const textureLoader = new THREE.TextureLoader()
  const fireTex = textureLoader.load('/src/assets/data/smoke1.png')
  const fireMat = new THREE.SpriteMaterial({
    map: fireTex,
    transparent: true,
    opacity: 1, 
    blending: THREE.AdditiveBlending, 
    depthWrite: false,
    color: new THREE.Color(0xff3300) 
  })


  const fire = new THREE.Sprite(fireMat)
  fire.scale.set(fireScale, fireScale, fireScale)
  fire.position.copy(pos)
  scene.add(fire)
  scene.add(fire.clone())  

  const smokeMat = new THREE.SpriteMaterial({
    map: fireTex,
    transparent: true,
    opacity: 0.8, 
    blending: THREE.NormalBlending, 
    depthWrite: false,
    color: new THREE.Color(0x222222) 
  })
  const smoke = new THREE.Sprite(smokeMat)
  smoke.scale.set(smokeScale, smokeScale, smokeScale)

  smoke.position.copy(pos.clone().add(new THREE.Vector3(0, 0.2, 0)))
  scene.add(smoke) 

  let time = 0
  function animateFire() {
    time += 0.03
    const t = time
    const s = 1 + Math.sin(t * 2.5) * 0.02 // 呼吸幅度，可调整   
   
    fire.scale.set(fireScale * s, fireScale * s, fireScale * s)
    smoke.scale.set(smokeScale * s, smokeScale * s, smokeScale * s)
    requestAnimationFrame(animateFire)
  }
  animateFire() 
}

// 6. 解析GeoJSON生成3D白模
const parseGeoJSONAndCreateBuildings = () => {
  // 复用材质（减少内存占用）
  const whiteMaterial = new THREE.MeshLambertMaterial({
    color: 0xf5f5f5,//0xffffff
    //roughness: 0.6,         // 粗糙度（不要太高）
    //metalness: 0.0 ,         // 白模不要金属感
    transparent: true,
    opacity: 1
  });

  count =0
  // 遍历所有建筑Feature
  buildingGeoJSON.features.forEach((feature) => {
    count++   
    const buildGuid = feature.properties.buildGuid;
    const name = feature.properties.shortName;
    const height = feature.properties.floor / 18.0 ;
    const coordinates = feature.geometry.coordinates[0][0]; // 提取Polygon轮廓
   
    // 步骤1：转换轮廓坐标为Three.js Vector2
    const shapePoints = [];
    coordinates.forEach(([lon, lat]) => {
      const localCoord = lonLatToLocalCoord(lon, lat);
      shapePoints.push(localCoord);
    });

    // 步骤2：创建2D闭合轮廓（Shape）
    const shape = new THREE.Shape(shapePoints);

    // 步骤3：拉伸为3D几何体（ExtrudeGeometry）
    const extrudeSettings = {
      depth: height, // 拉伸高度（建筑高度）
      bevelEnabled: false // 无倒角，白模更简洁
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);   
    geometry.computeBoundingBox();

    // 3. 获取包围盒中心
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    //console.log('ExtrudeGeometry 中心坐标:', center);

    // 步骤4：创建建筑网格并添加到组
    const buildingMesh = new THREE.Mesh(geometry, whiteMaterial);
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    // 调整轴：Three.js中y轴为垂直方向，旋转几何体让轮廓在x/z平面
    buildingMesh.rotation.x = -Math.PI / 2;
    // 绑定建筑信息（用于点击交互）
    buildingMesh.userData = { name, height };
     // 1. 创建 HTML 文本元素
    const labelDiv = document.createElement('div');
    labelDiv.className = 'building-label';
    labelDiv.textContent = name;
    labelDiv.style.color = '#333';
    labelDiv.style.backgroundColor = 'rgba(255,255,255,0.8)';
    labelDiv.style.padding = '4px 8px';
    labelDiv.style.borderRadius = '4px';
    labelDiv.style.fontSize = '14px';
    labelDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

    // 2. 将 HTML 元素转为 CSS2DObject
    const label = new CSS2DObject(labelDiv);
    // 标注位置：建筑顶部中心（y轴+1，避免贴模型）
    label.position.set(
      center.x,
      center.y,
      center.z
    );   
    // buildingMesh.add(label);   
 if(buildGuid !="688B9A3F38EA48E6AECD87AB911092A1") 
    buildingsGroup.add(buildingMesh);
  });
};

function drawTruckPath(){
  const coordinates= [ [ 113.54776032, 22.22632892 ], 
   [ 113.54818221, 22.22296648 ],
   [ 113.54606806, 22.22259461 ] ]   

   const shapePoints = [];
    coordinates.forEach(([lon, lat]) => {
      const localCoord = lonLatToLocalCoord(lon, lat, true);
      shapePoints.push(localCoord);
    });   
    createPath(shapePoints) 
}

function getPointAtLine(line, t) {
  const points = line.geometry.attributes.position.array
  const vecs = []
  for (let i = 0; i < points.length; i += 3) {
    vecs.push(new THREE.Vector3(points[i], points[i+1], points[i+2]))
  }

  let totalLen = 0
  const lens = [0]
  for (let i = 1; i < vecs.length; i++) {
    totalLen += vecs[i].distanceTo(vecs[i-1])
    lens.push(totalLen)
  }

  const targetLen = t * totalLen

  for (let i = 1; i < lens.length; i++) {
    if (lens[i] >= targetLen) {
      const p1 = vecs[i-1]
      const p2 = vecs[i]
      const l1 = lens[i-1]
      const l2 = lens[i]
      const k = (targetLen - l1) / (l2 - l1)
      const p = p1.clone().lerp(p2, k)
      return p
    }
  }
  return vecs[0].clone()
}

function moveFireTruckAlongPath() {     
  if (!fireTruck || !movePath) return
 
  pathProgress += speedTruck * clockTruck.getDelta()
  //if (pathProgress > 1) pathProgress = 0 // 循环
  if (pathProgress > 1) return

  const currentPoint= getPointAtLine(movePath, pathProgress)  
  const nextPoint= getPointAtLine(movePath, (pathProgress + 0.01) % 1)
//  const ball = new THREE.Mesh(
//     new THREE.SphereGeometry(0.2),
//     new THREE.MeshBasicMaterial({ color: 0xff0000 })
//   )
//   ball.position.copy(currentPoint)
//   scene.add(ball)  
  fireTruck.position.copy(currentPoint) 
  fireTruck.lookAt(nextPoint.x, currentPoint.y, nextPoint.z)
  fireTruck.rotation.y += -Math.PI / 2
}

function createPath(pathPoints) {
  const geometry = new THREE.BufferGeometry().setFromPoints(pathPoints)
  const material = new THREE.LineBasicMaterial({ 
    color: 0xff0000 ,
    linewidth: 1,
    transparent: true,
    opacity: 0.6
    })
  const line = new THREE.Line(geometry, material)
  movePath = line 
  scene.add(line)
}

/////////////////////////////////////////////////////
async function createBuildingByFloors() { 
  const myCoor= [ [ [ [ 113.546042615579907, 22.221906792055158 ], [ 113.546069498056553, 22.221738895634108 ], [ 113.545994197606191, 22.22172922786395 ], [ 113.546015762882718, 22.2216090355167 ], [ 113.545832875450898, 22.221583926835606 ], [ 113.545816724905364, 22.221698329024715 ], [ 113.545676851016424, 22.221682716802473 ], [ 113.545693001884587, 22.221564513439027 ], [ 113.545526255544488, 22.221543139549333 ], [ 113.545504790167271, 22.221663331767164 ], [ 113.545429488236408, 22.221653562520924 ], [ 113.545402504886411, 22.221821458151037 ], [ 113.546042615579907, 22.221906792055158 ] ] ] ]
  const myCoor2=[ [ [ [ 113.5411, 22.2226 ], 
   [ 113.5412, 22.2226 ],
   [ 113.5412, 22.2227 ], 
   [ 113.5411, 22.2227 ],
   [ 113.5411, 22.2226 ]
    ] ] ]
 
  const coordinates = myCoor[0][0]
  //const coordinates = buildingGeoJSON.features[10].geometry.coordinates[0][0]
  const floors = 8
  const points = [];
  coordinates.forEach(([lon, lat]) => {
    const localCoord = lonLatToLocalCoord(lon, lat);
    points.push(localCoord);
  });
  
  const groupFloor = new THREE.Group(); 
  for (let i = 0; i < floors; i++){
    groupFloor.add(await createBuilding(points, i));  
  } 
  const addH = floors * (FLOOR_THICKNESS + WALL_HEIGHT)
  const floor = createFloor(points, FLOOR_THICKNESS, addH)
  //增加楼顶
  //groupFloor.add(floor)
  scene.add(groupFloor) 
}

async function createBuilding(points, i) {
  const addH = i * (FLOOR_THICKNESS + WALL_HEIGHT)
  const group = new THREE.Group(); 
  const floor = createFloor(points, FLOOR_THICKNESS, addH)
  const walls = createExtrudeWall(points, WALL_HEIGHT, WALL_THICKNESS, addH)
  const window = createWindowOnWall(0,addH) 
  const extinguisher =  await loadExtinguisher(i)

  group.add(floor); 
  group.add(walls);  
  group.add(window); 
  group.add(extinguisher); 
  allFloors.push(group)
  return group
}

function createWindowOnWall(floorThickness, addH) {
  const coor = [[ 113.54601576, 22.22160904 ], [113.54583288, 22.22158393 ]] 
  let x1=coor[0][0]
  let y1=coor[0][1]
  let x2=coor[1][0]
  let y2=coor[1][1]
  let lenX = (x2-x1) / 5.0
  let lenY = (y2-y1) / 5.0
  const coordinates = [[ x1 + lenX*2, y1 + lenY *2 ], [x1 + lenX*3, y1 + lenY *3 ]] 

  const points = [];
  coordinates.forEach(([lon, lat]) => {
  const localCoord = lonLatToLocalCoord(lon, lat);
  points.push(localCoord);
  });

  const halfWidth = 0.001
  let start = points[0]
  let end = points[1]

  // 线段方向
  const dx = end.x - start.x
  const dz = end.y - start.y
  const len = Math.sqrt(dx * dx + dz * dz)

  // 垂直方向（向左/右扩宽）
  const perpX = -dz / len * halfWidth
  const perpZ = dx / len * halfWidth

  //
  const pointsNew = [];
  pointsNew.push(new THREE.Vector2(start.x + perpX,  start.y + perpZ ))
  pointsNew.push(new THREE.Vector2(start.x - perpX,  start.y - perpZ ))
  pointsNew.push(new THREE.Vector2(end.x - perpX,    end.y - perpZ ))
  pointsNew.push(new THREE.Vector2(end.x + perpX,    end.y + perpZ ))

  const outerShape = new THREE.Shape(pointsNew)
  // 3. 拉伸成 3D 墙体
  const geometry = new THREE.ExtrudeGeometry(outerShape, {
    depth: 0.05,
    bevelEnabled: false
  })

  const material = new THREE.MeshLambertMaterial({ color: 0xFEB23C, side: THREE.DoubleSide })
  const wall = new THREE.Mesh(geometry, material)
  wall.rotation.x = -Math.PI / 2  // 平放
  wall.position.y = FLOOR_THICKNESS + addH + 0.035; 
  return wall
}

function createFloor(polygonPoints, floorThickness, addH) {
  const shape = new THREE.Shape(polygonPoints);
  //const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshLambertMaterial({
    color: 0x7F9FFE,
    side: THREE.DoubleSide,
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: floorThickness,
    bevelEnabled: false
  });

  const floor = new THREE.Mesh(geometry, material);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = addH;
  return floor;
}

function createExtrudeWall(points, wallHeight, wallThickness, addH) {
  //console.log("hello", points)
  // 1. 外轮廓
  const outerShape = new THREE.Shape(points)

  // 2. 内轮廓（外轮廓向内偏移 = 墙厚度）
  const innerPoints = offsetPolygon(points, -wallThickness) 
  const holePath = new THREE.Path(innerPoints)
  outerShape.holes = [holePath] // 挖空 → 变成墙

  // 3. 拉伸成 3D 墙体
  const geometry = new THREE.ExtrudeGeometry(outerShape, {
    depth: wallHeight,
    bevelEnabled: false
  })

  const material = new THREE.MeshLambertMaterial({ color: 0xB7C780, side: THREE.DoubleSide })
  const wall = new THREE.Mesh(geometry, material)
  wall.rotation.x = -Math.PI / 2  // 平放
  wall.position.y = FLOOR_THICKNESS + addH; 
  return wall
}

function offsetPolygon(points, offsetDistance) {
  // 放大系数（越大越精准，1000 比 100 效果强得多！）
  const SCALE = 1000

  // 安全判断
  if (!points || points.length < 3) return points
  if (Math.abs(offsetDistance) < 0.001) return points

  // 1. 转换为 Clipper 格式
  const path = points.map(p => ({
    X: Math.round(p.x * SCALE),
    Y: Math.round(p.y * SCALE)
  }))

  // 2. 创建偏移器
  const offset = new ClipperLib.ClipperOffset()

  // 3. 关键：尖角模式（最强、最标准）
  offset.AddPath(
    path,
    ClipperLib.JoinType.jtMiter,
    ClipperLib.EndType.etClosedPolygon
  )

  // 4. 执行偏移
  const offsetPaths = new ClipperLib.Paths()
  offset.Execute(offsetPaths, offsetDistance * SCALE)

  // 5. 降级容错：如果偏移失败，返回原多边形
  if (!offsetPaths || offsetPaths.length === 0) {
    console.log("hello error")
    return [...points]
  }

  // 6. 转回 Three.js 坐标
  return offsetPaths[0].map(p => 
    new THREE.Vector2(p.X / SCALE, p.Y / SCALE)
  )
}

// 7. 渲染循环
const animate = () => {
  animateId = requestAnimationFrame(animate);
  clockTruck.update()
  if (mixer) {
    mixer.update(clockTruck.getDelta());
  }
  //moveFireTruckAlongPath()
  controls.update(); // 平滑更新控制器
  renderer.render(scene, camera);
  //labelRenderer.render(scene, camera);
};

// 8. 组件挂载/卸载生命周期
onMounted(async() => {
  //
  if (container.value) {
    await initThree();
    await createBuildingByFloors()
    animate();
  }
});

onUnmounted(() => {
  // 销毁资源（避免内存泄漏）
  cancelAnimationFrame(animateId);
  renderer.dispose();
  scene.clear();
  buildingsGroup.clear();
  container.value?.removeChild(renderer.domElement);
  // 移除窗口监听
  window.removeEventListener('resize', handleResize);
});

// 9. 窗口自适应
const handleResize = () => {
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
};
window.addEventListener('resize', handleResize);
</script>
<style scoped>
.full-screen-div {
  /* 1. 占满视口宽高 */
  width: 100vw;
  height: 100vh;
  /* 2. 清除默认边距（避免出现滚动条） */
  margin: 0;
  padding: 0;
  /* 3. 可选：固定定位（防止滚动时偏移） */
  position: fixed;
  top: 0;
  left: 0;
  /* 可选：背景色，方便查看效果 */
  background-color: #f5f5f5;
  /* 可选：子元素居中（按需添加） */
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.building-label) {
  user-select: none; /* 禁止选中文字 */
  pointer-events: auto; /* 如需点击标注，设为auto */
}

.viewer-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.three-canvas {
  width: 100%;
  height: 100%;
}

/* 🔥 下拉框样式（悬浮在左上角） */
.dropdown-container {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 999;
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

select {
  padding: 4px 8px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}
</style>
