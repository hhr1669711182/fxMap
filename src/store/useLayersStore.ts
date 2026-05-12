/*
 * @Author: huanghuanrong
 * @Date: 2026-05-06 16:45:28
 * @LastEditTime: 2026-05-08 18:58:00
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \ids-gis-web\src\store\useLayersStore.ts
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  DEFAULT_CHECKED_IDS,
  LAYER_CONFIGS,
  LAYER_CONFIG_IDS,
  type LayerConfig,
} from '@/config/layers'

const layerIdSet = new Set(LAYER_CONFIG_IDS)

const normalizeLayerIds = (ids: string[]) => {
  const next: string[] = []
  ids.forEach((id) => {
    if (layerIdSet.has(id) && !next.includes(id)) {
      next.push(id)
    }
  })
  return next
}

export const useLayersStore = defineStore(
  'layers',
  () => {
    const checkedIds = ref<string[]>([...DEFAULT_CHECKED_IDS])

    const visibleIds = computed(() => new Set(checkedIds.value))

    const items = computed(() =>
      LAYER_CONFIGS.map((config) => ({
        ...config,
        disabled: false,
      })),
    )

    const setCheckedIds = (ids: string[]) => {
      checkedIds.value = normalizeLayerIds(ids)
    }

    const setLayerVisible = (id: string, visible: boolean) => {
      if (!layerIdSet.has(id)) return

      const set = new Set(checkedIds.value)
      if (visible) set.add(id)
      else set.delete(id)

      setCheckedIds(Array.from(set))
    }

    const toggle = (id: string) => {
      if (!layerIdSet.has(id)) return
      setLayerVisible(id, !visibleIds.value.has(id))
    }

    const toggleAll = (checked: boolean) => {
      setCheckedIds(checked ? LAYER_CONFIG_IDS : [])
    }

    const isChecked = (id: string) => visibleIds.value.has(id)

    const getConfig = (id: string): LayerConfig | undefined =>
      LAYER_CONFIGS.find((config) => config.id === id)

    setCheckedIds(checkedIds.value)

    return {
      checkedIds,
      visibleIds,
      items,
      setCheckedIds,
      setLayerVisible,
      toggle,
      toggleAll,
      isChecked,
      getConfig,
    }
  },
  {
    persist: {
      storage: sessionStorage,
      pick: ['checkedIds'],
    },
  },
)
