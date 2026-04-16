/*
 * @Author: huanghuanrong
 * @Date: 2026-04-13 18:52:23
 * @LastEditTime: 2026-04-15 14:16:23
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \OpenlayersMap\src\router\index.ts
 */
import { createRouter, createWebHashHistory, createMemoryHistory } from 'vue-router'

// 引入你的页面
import ThreejsViewerRegion from '@/views/region.vue'   // 火灾/建筑页面
import ThreejsViewerBuilding from '@/views/building.vue'     // 你新增的页面
import { App } from 'vue'

const routes = [
  {
    path: '/',
    redirect: '/map',
    component: () => import('@/layout/MainLayout.vue'),
    children: [
      {
        path: '/map',
        name: 'map',
        component: import('@/views/home.vue')
      },
      {
        path: '/test',
        name: 'test',
        component: import('@/views/test/index.vue')
      },
      // {
      //   path: '/ThreejsViewerRegion',
      //   name: 'ThreejsViewerRegion',
      //   component: ThreejsViewerRegion
      // },
      // {
      //   path: '/ThreejsViewerBuilding',      // 路由地址
      //   name: 'ThreejsViewerBuilding',   // 名称
      //   component: ThreejsViewerBuilding // 对应页面
      // }
    ]
  },

]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  // if (to.name !== 'Login' && !token) {
  //   next()
  // } else {
  //   next()
  // }
  next()
})


export const resetRouter = (): void => {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !['map', 'Login'].includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
