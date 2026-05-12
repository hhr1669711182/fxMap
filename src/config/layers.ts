/*
 * @Author: hhr
 * @Date: 2026-04-29 18:24:21
 * @LastEditTime: 2026-05-11 18:03:51
 * @LastEditors: hhr
 * @Description: 文件描述
 * @FilePath: \ids-gis-web\src\config\layers.ts
 */
/**
 * 图层配置（数据源/WMS配置）
 * 所有图层在此集中配置，store 和组件从此文件读取，不直接写死在业务逻辑里
 */
export interface LayerConfig {
  /** 图层唯一标识 */
  id: string
  /** 显示名称 */
  name: string
  /** GeoServer 工作空间 */
  workspace: string
  /** WMS 图层名（workspace:layer） */
  typeName: string
  /** WMS 服务地址（可选，默认用环境变量 VITE_GEOSERVER_WMS_URL） */
  wmsUrl?: string
  /** 是否默认可见 */
  defaultVisible?: boolean
  /** 图例/图标 */
  icon?: string
  /** 备注 */
  remark?: string
}

export const LAYER_CONFIGS: LayerConfig[] = [
  {
    id: 'hydrant',
    name: '消防栓',
    workspace: 'gis',
    typeName: 'gis:srvc_water_hydrant',
    defaultVisible: false,
    icon: 'mdi:fire-hydrant',
  },
  {
    id: 'disaster',
    name: '灾情信息',
    workspace: 'gis',
    typeName: 'gis:disaster_info',
    defaultVisible: false,
    icon: 'mdi:alert-circle-outline',
  },
  // {
  //   id: 'indoor',
  //   name: '室内消防',
  //   workspace: 'gis',
  //   typeName: 'gis:indoor_facility',
  //   defaultVisible: false,
  //   icon: 'mdi:door',
  // },
  // {
  //   id: 'special',
  //   name: '特种装备',
  //   workspace: 'gis',
  //   typeName: 'gis:special_equipment',
  //   defaultVisible: false,
  //   icon: 'mdi:hard-hat',
  // },
  {
    id: 'station',
    name: '主管队站',
    workspace: 'gis',
    typeName: 'gis:res_org_dept',
    defaultVisible: false,
    icon: 'mdi:location-radius-outline',
  },
  {
    id: 'safetyFocus',
    name: '重点单位',
    workspace: 'gis',
    typeName: 'gis:env_safetyfocus',
    defaultVisible: false,
    icon: 'mdi:office-building',
  },
  // {
  //   id: 'street',
  //   name: '街道全景',
  //   workspace: 'gis',
  //   typeName: 'gis:street_panorama',
  //   defaultVisible: false,
  //   icon: 'mdi:panorama-variant-outline',
  // },
  // {
  //   id: 'uav',
  //   name: '无人机',
  //   workspace: 'gis',
  //   typeName: 'gis:uav_track',
  //   defaultVisible: false,
  //   icon: 'mdi:drone',
  // },
]

export const getLayerConfig = (id: string): LayerConfig | undefined =>
  LAYER_CONFIGS.find((c) => c.id === id)

// export const DEFAULT_CHECKED_IDS: string[] = []
export const DEFAULT_CHECKED_IDS = LAYER_CONFIGS
  .filter((c) => c.defaultVisible)
  .map((c) => c.id)
export const LAYER_CONFIG_IDS = LAYER_CONFIGS.map((c) => c.id)
