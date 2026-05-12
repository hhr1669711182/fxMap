import { alovaInstance } from './alova'

/**
 * 主业务系统通用请求封装
 * 提供基础的 GET/POST/PUT/DELETE 方法
 */
export const http = {
  get: <T = any>(url: string, config?: any) => alovaInstance.Get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => alovaInstance.Post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => alovaInstance.Put<T>(url, data, config),
  delete: <T = any>(url: string, data?: any, config?: any) => alovaInstance.Delete<T>(url, data, config),
}

export * from './alova'
export * from './geoserver'
