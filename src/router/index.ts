/*
 * @Author: huanghuanrong
 * @Date: 2026-05-09 13:54:25
 * @LastEditTime: 2026-05-12 10:34:09
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \ids-gis-web\src\router\index.ts
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import MainLayout from '@/layout/MainLayout.vue'
import ThreejsViewerRegion from '@/views/region.vue'
import ThreejsViewerBuilding from '@/views/building.vue'
import { setupRouterGuard } from './guard'
import { unregisterDynamicRoutes } from './dynamic'
import { ROUTE_NAMES } from './constants'

export const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAMES.ROOT,
    redirect: '/map',
    component: MainLayout,
    children: [
      {
        path: 'map',
        name: ROUTE_NAMES.MAP,
        component: () => import('@/views/home.vue'),
        meta: {
          title: '地图',
        },
      },
      {
        path: 'test',
        name: ROUTE_NAMES.TEST,
        component: () => import('@/views/test/index.vue'),
        meta: {
          title: '测试',
        },
      },
      {
        path: 'ThreejsViewerRegion',
        name: ROUTE_NAMES.THREE_REGION,
        component: ThreejsViewerRegion,
        meta: {
          title: '区域三维',
        },
      },
      {
        path: 'ThreejsViewerBuilding',
        name: ROUTE_NAMES.THREE_BUILDING,
        component: ThreejsViewerBuilding,
        meta: {
          title: '建筑三维',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/map',
  },

]

const staticRouteNames = new Set(
  staticRoutes
    .flatMap((route) => [route, ...(route.children ?? [])])
    .map((route) => route.name)
    .filter(Boolean),
)

const router = createRouter({
  history: createWebHashHistory(),
  routes: staticRoutes,
})

setupRouterGuard(router)

export const resetRouter = (): void => {
  unregisterDynamicRoutes()

  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !staticRouteNames.has(name)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
