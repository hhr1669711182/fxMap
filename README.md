<!--
 * @Author: huanghuanrong
 * @Date: 2026-03-31 15:30:08
 * @LastEditTime: 2026-04-10 15:25:08
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \OpenlayersMap\README.md
-->
# OpenlayersMap

基于 Vue3 + OpenLayers 的 Web GIS 交互示例工程，包含底图切换、常用地图控件、绘制测量、路径规划与消防调派演示、点位弹窗与 iframe 面板联动等能力。

## 技术栈

- Vue 3 + TypeScript
- Vite
- OpenLayers + ol-ext
- Pinia
- Element Plus

## 本地运行

```bash
npm i
npm run dev
```

## 功能概览

### 地图基础

- 底图：高德/Google/矢量图层组合
- 控件：全屏、比例尺等（部分控件按需开启）

### 绘制与测量

- 点/线/面/圆/矩形绘制
- 距离/面积/角度/方位角测量
- 高级几何交互（相交运算：交/并/差）

### 路径规划与调派演示

- Element Plus 自动补全：输入灾情位置/地图选点
- 最近消防站匹配：从 `zhxfdzXYList` 计算最近队站作为起点
- 驾车路线规划：拥堵分段着色（TMC）
- 车辆沿路线动画：速度随路径长度动态计算、转向角平滑

### 点位与弹窗

- 消防站点位：地图初始化加载 `zhxfdzXYList` 图标
- 点击队站：显示详情弹窗
- 警情点位：告警图标 + 通用 overlay 模板弹窗（可扩展字段）

### 面板联动（2.5D / 3D）

- 动画结束触发联动事件
- 右上角固定面板（iframe）展示
- postMessage 通信 + 广播

## 配置说明

### 行政区/城市配置

`src/baseComponent/amap/data.json` 支持数组或对象，优先读取 `data` 字段：

- `data.keywords`：行政区关键词（用于遮罩/边界）
- `data.city`：输入提示城市限制
- `data.boundaries`：可选边界缓存（为空则自动请求）

### WebService Key

高德 Web 服务 Key 建议通过运行时输入并写入 `localStorage`，避免将敏感信息写入仓库。
