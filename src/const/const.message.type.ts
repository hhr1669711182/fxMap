export const MESSAGE_PROTOCOL_VERSION = '1.0.0' as const

export const MESSAGE_CHANNEL = {
  WS: 'ws',
  POST_MESSAGE: 'postMessage',
} as const

export type MessageChannel = (typeof MESSAGE_CHANNEL)[keyof typeof MESSAGE_CHANNEL]

/*&*
 * 消息系统
 * @description: 消息系统
 * @enum {string}
 * @property {string} HOST - 主系统
 * @property {string} MAP - 地图系统
 * @property {string} DISPATCH - 分发系统
 * @property {string} PANEL_25D - 25D面板系统
 * @property {string} PANEL_3D - 3D面板系统
 */
export const MESSAGE_SYSTEM = {
  HOST: 'host',
  MAP: 'map',
  DISPATCH: 'dispatch',
  PANEL_25D: 'panel_25d',
  PANEL_3D: 'panel_3d',
} as const

export type MessageSystem = (typeof MESSAGE_SYSTEM)[keyof typeof MESSAGE_SYSTEM]

/*&*
 * 消息事件键
 * @description: 消息事件键
 * @enum {string}
 * @property {string} HELLO - 欢迎消息
 * @property {string} HEARTBEAT - 心跳消息
 * @property {string} ERROR - 错误消息
 * @property {string} MAP_READY - 地图就绪消息
 * @property {string} MAP_VIEW_CHANGED - 地图视图改变消息
 * @property {string} MAP_CLICK - 地图点击消息
 * @property {string} MAP_POINTER_MOVE - 地图指针移动消息
 * @property {string} LAYER_SET_VISIBLE - 图层可见性设置消息
 * @property {string} LAYER_SET_OPACITY - 图层透明度设置消息
 * @property {string} LAYER_SET_ZINDEX - 图层Z索引设置消息
 */
export const MESSAGE_EVENT_KEY = {
  HELLO: 'hello',
  HEARTBEAT: 'heartbeat',
  ERROR: 'error',

  MAP_READY: 'map.ready',
  MAP_VIEW_CHANGED: 'map.view.changed',
  MAP_CLICK: 'map.click',
  MAP_POINTER_MOVE: 'map.pointer.move',

  LAYER_SET_VISIBLE: 'layer.set.visible',
  LAYER_SET_OPACITY: 'layer.set.opacity',
  LAYER_SET_ZINDEX: 'layer.set.zIndex',

  OVERLAY_OPEN: 'overlay.open',
  OVERLAY_CLOSE: 'overlay.close',

  DRAW_START: 'draw.start',
  DRAW_END: 'draw.end',
  DRAW_CLEAR: 'draw.clear',

  // route 路径规划
  ROUTE_PLAN_REQUEST: 'route.plan.request',
  ROUTE_PLAN_MULTIPLE: 'route.plan.multiple',
  ROUTE_PLAN_RESULT: 'route.plan.result',
  ROUTE_PLAN_CANCEL: 'route.plan.cancel',
  ROUTE_PLAN_CLEAR: 'route.plan.clear',
  ROUTE_PLAN_ERROR: 'route.plan.error',
  ROUTE_WAYPOINT_UPDATE: 'route.waypoint.update',

  // addr 地址/POI
  ADDR_SYNC_START: 'addr.sync.start',
  ADDR_SYNC_RESULT: 'addr.sync.result',
  ADDR_SYNC_CANCEL: 'addr.sync.cancel',
  ADDR_GEOCODE: 'addr.geocode',
  ADDR_POI_PICK: 'addr.poi.pick',

  // map 地图交互
  MAP_LOCATE: 'map.locate',
  MAP_POI_PICK: 'map.poi.pick',
  MAP_POI_SEARCH: 'map.poi.search',
  MAP_COORD_TRANSFORM: 'map.coord.transform',

  CONFIG_OPEN: 'config.open',
  CONFIG_SAVE: 'config.save',
  CONFIG_CANCEL: 'config.cancel',

  DISPATCH_UPDATE: 'dispatch.update',
  ALARM_UPDATE: 'alarm.update',
} as const

export type MessageEventKey = (typeof MESSAGE_EVENT_KEY)[keyof typeof MESSAGE_EVENT_KEY]

/*&*
 * 遗留消息类型映射
 * @description: 遗留消息类型映射
 * @enum {string}
 * @property {string} dispatchUpdate - 分发更新消息
 * @property {string} alarmUpdate - 报警更新消息
 */
export const LEGACY_MESSAGE_TYPE_MAP = {
  dispatchUpdate: MESSAGE_EVENT_KEY.DISPATCH_UPDATE,
  alarmUpdate: MESSAGE_EVENT_KEY.ALARM_UPDATE,
} as const

export type LegacyMessageType = keyof typeof LEGACY_MESSAGE_TYPE_MAP
