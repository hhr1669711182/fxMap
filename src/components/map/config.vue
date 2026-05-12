<template>
   <div  class="cfg-toggle" @click="onSettings">
      <Icon icon="streamline-plump-color:map-fold" :size="24" />
    </div>

  <div v-if="configOpen" class="cfg-panel">
    <div class="cfg-tabs">
      <button class="cfg-tab" :class="{ active: activeTab === 'feature' }" type="button" @click="activeTab = 'feature'">
        功能配置
      </button>
      <button class="cfg-tab" :class="{ active: activeTab === 'layer' }" type="button" @click="activeTab = 'layer'">
        图层配置
      </button>
    </div>

    <div v-if="activeTab === 'feature'">
      <div class="cfg-feature">
        <div v-for="item in featureSliders" :key="item.key" class="cfg-s-row">
          <div class="cfg-s-label">{{ item.label }}</div>
          <div class="cfg-s-body">
            <span class="cfg-s-val">{{ getFeature(item.key) }}</span>
            <el-slider
              :model-value="getFeature(item.key)"
              :min="item.min"
              :max="item.max"
              :step="item.step"
              :show-tooltip="false"
              @update:modelValue="(v: any) => setFeature(item.key, v)"
            />
            <span class="cfg-s-max">{{ item.max }}</span>
          </div>
        </div>

        <div class="cfg-opt">
          <div v-for="item in featureFields" :key="item.key" class="cfg-opt-row">
            <div class="cfg-opt-label">{{ item.label }}</div>
            <template v-if="item.kind === 'radio'">
              <el-radio-group
                :model-value="getFeature(item.key)"
                class="cfg-opt-group"
                @update:modelValue="(v: any) => setFeature(item.key, v)"
              >
                <el-radio v-for="opt in item.options" :key="String(opt.value)">{{ opt.label }}</el-radio>
              </el-radio-group>
            </template>
            <template v-else>
              <div class="cfg-opt-inline">
                <el-input-number
                  :model-value="getFeature(item.key)"
                  :min="item.min"
                  :max="item.max"
                  :step="item.step"
                  :precision="item.precision"
                  size="small"
                  @update:modelValue="(v: any) => setFeature(item.key, v)"
                />
                <span class="cfg-unit">{{ item.unit }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>


   <div v-if="activeTab === 'layer'">
     <div class="cfg-top">
      <div class="cfg-field">
        <div class="cfg-label">分组名称:</div>
        <!-- <el-input v-model="currentGroup.name" size="small" /> -->
         <el-select v-model="currentGroup.name" size="small" :teleported="false" @change="onGroupNameChange">
            <el-option v-for="n in groupNameOptions" :key="n" :label="String(n)" :value="n" />
          </el-select>
      </div>
      <div class="cfg-field">
        <div class="cfg-label">图层组顺序:</div>
        <div class="cfg-inline">
          <el-select v-model="groupOrder" size="small" :teleported="false" @change="onGroupOrderChange">
            <el-option v-for="n in groupOrderOptions" :key="n" :label="String(n)" :value="n" />
          </el-select>
          <el-switch v-model="currentGroup.visible" size="small" @change="onGroupVisibleChange" />
        </div>
      </div>
    </div>

    <div class="cfg-body">
      <div class="cfg-left">
        <div class="cfg-section-title">资源配置:</div>
        <div class="cfg-card">
          <div class="cfg-subtitle">选择大类:</div>
          <div class="cfg-radio-list">
            <div v-for="cat in currentGroup.categories" :key="cat.id" class="cfg-radio-row">
              <button class="cfg-radio" type="button" @click="selectCategory(cat.id)">
                <span class="cfg-dot" :class="{ on: cat.id === selectedCategoryId }" />
                <span class="cfg-radio-text">{{ cat.name }}</span>
              </button>
              <div class="cfg-cat-actions">
                <el-switch v-model="cat.visible" size="small" @change="() => onCategoryVisibleChange(cat.id)" />
                <!-- <div class="cfg-order">
                  <button class="cfg-btn" type="button" @click="moveCategory(cat.id, -1)">▲</button>
                  <button class="cfg-btn" type="button" @click="moveCategory(cat.id, 1)">▼</button>
                </div> -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="cfg-right">
        <div class="cfg-card">
          <div class="cfg-right-head">
            <div class="cfg-subtitle">选择细类资源:</div>
            <div class="cfg-subtitle text-right text-sm">默认显示</div>
          </div>
          <div class="cfg-items">
            <div v-for="sub in currentCategory.subCategories" :key="sub.id" class="cfg-item">
              <div class="cfg-check">
                <el-checkbox v-model="sub.enabled" size="small" />
                <span class="cfg-item-text">{{ sub.name }}</span>
              </div>
              <div class="cfg-item-actions">
                <el-switch v-model="sub.visible" size="small" @change="recalcStates" />
                <!-- <div class="cfg-order">
                  <button class="cfg-btn" type="button" @click="moveSub(sub.id, -1)">▲</button>
                  <button class="cfg-btn" type="button" @click="moveSub(sub.id, 1)">▼</button>
                </div> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
   </div>

    <div class="cfg-footer">
      <el-button size="small" @click="onCancel">取消</el-button>
      <el-button size="small" type="primary" :disabled="!isDirty" @click="onSave">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { usePanelStore } from '@/store/usePanelStore'

const panelStore = usePanelStore()
const { configOpen } = storeToRefs(panelStore)

type ConfigTab = 'feature' | 'layer'

type TriState = 'on' | 'off' | 'partial'

type ConfigSubCategory = {
  id: string
  name: string
  order: number
  enabled: boolean
  visible: boolean
}

type ConfigCategory = {
  id: string
  name: string
  order: number
  visible: boolean
  visibleState?: TriState
  subCategories: ConfigSubCategory[]
}

type ConfigGroup = {
  id: string
  name: string
  order: number
  visible: boolean
  visibleState?: TriState
  categories: ConfigCategory[]
}

type FeatureSettings = {
  minZoom: number
  maxZoom: number
  alarmZoom: number
  showNav: boolean
  showDraw: boolean
  showOther: boolean
  showEagleEye: boolean
  mapMode: 'dispatch' | 'oneMap'
  bufferKm: number
  queryCustomPoi: boolean
  showCaseClosedStyle: boolean
  showUavTrack: boolean
}

type SliderField = {
  kind: 'slider'
  key: keyof Pick<FeatureSettings, 'minZoom' | 'maxZoom' | 'alarmZoom'>
  label: string
  min: number
  max: number
  step?: number
}

type RadioField = {
  kind: 'radio'
  key: keyof Omit<FeatureSettings, 'minZoom' | 'maxZoom' | 'alarmZoom' | 'bufferKm'>
  label: string
  options: { label: string; value: any }[]
}

type NumberField = {
  kind: 'number'
  key: 'bufferKm'
  label: string
  unit: string
  min?: number
  max?: number
  step?: number
  precision?: number
}

type FeatureField = RadioField | NumberField

export type PanelConfigPayload = {
  version: string
  updatedAt: string
  feature: FeatureSettings
  featureConfig: ConfigGroup[]
  layerConfig: ConfigGroup[]
}

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

const defaultPayload = (): PanelConfigPayload => {
  const baseGroup = (): ConfigGroup => ({
    id: 'g-1',
    name: '接警',
    order: 1,
    visible: true,
    categories: [
      {
        id: 'cat-water',
        name: '水资源',
        order: 1,
        visible: true,
        subCategories: [
          // { id: 'w-1', name: '消防水鹤', order: 1, enabled: false, visible: false },
          // { id: 'w-2', name: '消防码头', order: 2, enabled: true, visible: false },
          { id: 'w-3', name: '消防栓', order: 3, enabled: true, visible: true },
          // { id: 'w-4', name: '消防水池', order: 4, enabled: true, visible: true },
          // { id: 'w-5', name: '天然水源', order: 5, enabled: true, visible: false },
          // { id: 'w-6', name: '灾情信息', order: 6, enabled: true, visible: false },
          // { id: 'w-7', name: '水文', order: 7, enabled: true, visible: true },
          // { id: 'w-8', name: '室内消防设施', order: 8, enabled: true, visible: false },
        ],
      },
      // { id: 'cat-video', name: '视频资源', order: 2, visible: true, subCategories: [] },
      { id: 'cat-battle', name: '作战资源', order: 3, visible: true, 
      subCategories: [
       { id: 'w-1', name: '消防队站', order: 1, enabled: false, visible: false },
          { id: 'w-2', name: '消防车辆', order: 2, enabled: true, visible: false },
          // { id: 'w-3', name: '消防机构', order: 3, enabled: true, visible: true },
      ] },
      { id: 'cat-social', name: '社会资源', order: 4, visible: true, subCategories: [
        
      ] },
    ],
  })

  return {
    version: '1',
    updatedAt: new Date().toISOString(),
    feature: {
      minZoom: 0,
      maxZoom: 21,
      alarmZoom: 22,
      showNav: true,
      showDraw: true,
      showOther: true,
      showEagleEye: true,
      mapMode: 'dispatch',
      bufferKm: 0.2,
      queryCustomPoi: true,
      showCaseClosedStyle: true,
      showUavTrack: true,
    },
    featureConfig: [baseGroup()],
    layerConfig: [baseGroup()],
  }
}

const props = defineProps<{ modelValue?: PanelConfigPayload; defaultTab?: ConfigTab }>()
const emit = defineEmits<{
  (e: 'save', payload: PanelConfigPayload): void
  (e: 'cancel'): void
  (e: 'update:modelValue', payload: PanelConfigPayload): void
}>()

const initial = ref<PanelConfigPayload>(deepClone(props.modelValue ?? defaultPayload()))
const draft = reactive<PanelConfigPayload>(deepClone(initial.value))

const feature = computed(() => draft.feature)

const getFeature = <K extends keyof FeatureSettings>(key: K): FeatureSettings[K] => feature.value[key]
const setFeature = <K extends keyof FeatureSettings>(key: K, value: FeatureSettings[K]) => {
  ;(feature.value as any)[key] = value
}

const featureSliders = computed<SliderField[]>(() => [
  { kind: 'slider', key: 'minZoom', label: '最小缩放比例：', min: 0, max: 22, step: 1 },
  { kind: 'slider', key: 'maxZoom', label: '最大缩放比例：', min: 0, max: 22, step: 1 },
  { kind: 'slider', key: 'alarmZoom', label: '警情定位比例：', min: 0, max: 22, step: 1 },
])

const featureFields = computed<FeatureField[]>(() => [
  {
    kind: 'radio',
    key: 'showNav',
    label: '地图工具导航组件：',
    options: [
      { label: '隐藏', value: false },
      { label: '显示', value: true },
    ],
  },
  {
    kind: 'radio',
    key: 'showDraw',
    label: '地图工具绘制组件：',
    options: [
      { label: '隐藏', value: false },
      { label: '显示', value: true },
    ],
  },
  {
    kind: 'radio',
    key: 'showOther',
    label: '地图工具其它组件：',
    options: [
      { label: '隐藏', value: false },
      { label: '显示', value: true },
    ],
  },
  {
    kind: 'radio',
    key: 'showEagleEye',
    label: '鹰眼：',
    options: [
      { label: '隐藏', value: false },
      { label: '显示', value: true },
    ],
  },
  {
    kind: 'radio',
    key: 'mapMode',
    label: '地图：',
    options: [
      { label: '接处警', value: 'dispatch' },
      { label: '一张图', value: 'oneMap' },
    ],
  },
  {
    kind: 'number',
    key: 'bufferKm',
    label: '缓冲范围：',
    unit: '千米',
    min: 0,
    step: 0.1,
    precision: 1,
  },
  {
    kind: 'radio',
    key: 'queryCustomPoi',
    label: '查询自定义兴趣点：',
    options: [
      { label: '是', value: true },
      { label: '否', value: false },
    ],
  },
  {
    kind: 'radio',
    key: 'showCaseClosedStyle',
    label: '灾情结案状态样式：',
    options: [
      { label: '显示', value: true },
      { label: '不显示', value: false },
    ],
  },
  {
    kind: 'radio',
    key: 'showUavTrack',
    label: '无人机实时轨迹：',
    options: [
      { label: '显示', value: true },
      { label: '不显示', value: false },
    ],
  },
])

const activeTab = ref<ConfigTab>(props.defaultTab ?? 'layer')

const selected = reactive<{ feature: { groupId: string; categoryId: string }; layer: { groupId: string; categoryId: string } }>(
  {
    feature: { groupId: initial.value.featureConfig[0]?.id ?? 'g-1', categoryId: initial.value.featureConfig[0]?.categories?.[0]?.id ?? 'cat-water' },
    layer: { groupId: initial.value.layerConfig[0]?.id ?? 'g-1', categoryId: initial.value.layerConfig[0]?.categories?.[0]?.id ?? 'cat-water' },
  },
)

const configByTab = computed(() => (activeTab.value === 'feature' ? draft.featureConfig : draft.layerConfig))
const selectedByTab = computed(() => (activeTab.value === 'feature' ? selected.feature : selected.layer))

const currentGroup = computed(() => {
  const group = configByTab.value.find((g) => g.id === selectedByTab.value.groupId) ?? configByTab.value[0]
  if (group && selectedByTab.value.groupId !== group.id) selectedByTab.value.groupId = group.id
  return group
})

const selectedCategoryId = computed({
  get: () => selectedByTab.value.categoryId,
  set: (v: string) => {
    selectedByTab.value.categoryId = v
  },
})

const currentCategory = computed(() => {
  const cat = currentGroup.value.categories.find((c) => c.id === selectedByTab.value.categoryId) ?? currentGroup.value.categories[0]
  if (cat && selectedByTab.value.categoryId !== cat.id) selectedByTab.value.categoryId = cat.id
  return cat
})

const groupNameOptions = computed(() => {
  return configByTab.value.map((g) => g.name)
})

const onGroupNameChange = (v: string) => {
  currentGroup.value.name = v
}

const groupOrderOptions = computed(() => {
  const n = configByTab.value.length
  return Array.from({ length: Math.max(n, 1) }, (_, i) => i + 1)
})

const groupOrder = computed({
  get: () => currentGroup.value.order,
  set: (v: number) => {
    currentGroup.value.order = v
  },
})

const stableSnapshot = (v: PanelConfigPayload) => JSON.stringify(v)
const isDirty = computed(() => stableSnapshot(draft) !== stableSnapshot(initial.value))

const normalizeOrders = (items: { order: number }[]) => {
  const sorted = [...items].sort((a, b) => a.order - b.order)
  sorted.forEach((it, idx) => {
    it.order = idx + 1
  })
}

const computeTriState = (values: boolean[]): TriState => {
  const on = values.filter(Boolean).length
  if (on === 0) return 'off'
  if (on === values.length) return 'on'
  return 'partial'
}

const recalcStates = () => {
  for (const group of configByTab.value) {
    for (const cat of group.categories) {
      const subVis = cat.subCategories.map((s) => s.visible)
      if (subVis.length) {
        cat.visibleState = computeTriState(subVis)
        cat.visible = cat.visibleState === 'on'
      } else {
        cat.visibleState = cat.visible ? 'on' : 'off'
      }
    }
    const hasPartial = group.categories.some((c) => c.visibleState === 'partial')
    if (hasPartial) {
      group.visibleState = 'partial'
      group.visible = false
    } else {
      const catOn = group.categories.filter((c) => c.visibleState === 'on').length
      if (catOn === 0) {
        group.visibleState = 'off'
        group.visible = false
      } else if (catOn === group.categories.length) {
        group.visibleState = 'on'
        group.visible = true
      } else {
        group.visibleState = 'partial'
        group.visible = false
      }
    }
  }
}

const selectCategory = (id: string) => {
  selectedCategoryId.value = id
}

const onGroupVisibleChange = (v: any) => {
  const g = currentGroup.value
  for (const cat of g.categories) {
    cat.visible = v
    for (const sub of cat.subCategories) sub.visible = v
  }
  recalcStates()
}

const onCategoryVisibleChange = (categoryId: string) => {
  const g = currentGroup.value
  const cat = g.categories.find((c) => c.id === categoryId)
  if (!cat) return
  for (const sub of cat.subCategories) sub.visible = cat.visible
  recalcStates()
}

const onGroupOrderChange = (v: number) => {
  const list = configByTab.value
  const g = currentGroup.value
  g.order = v
  normalizeOrders(list)
  list.sort((a, b) => a.order - b.order)
}

// const moveSub = (id: string, delta: number) => {
//   const list = currentCategory.value.subCategories
//   const idx = list.findIndex((s) => s.id === id)
//   const target = idx + delta
//   if (idx < 0 || target < 0 || target >= list.length) return
//   const a = list[idx]
//   const b = list[target]
//   const tmp = a.order
//   a.order = b.order
//   b.order = tmp
//   list.sort((x, y) => x.order - y.order)
// }

// const moveCategory = (id: string, delta: number) => {
//   const list = currentGroup.value.categories
//   const idx = list.findIndex((c) => c.id === id)
//   const target = idx + delta
//   if (idx < 0 || target < 0 || target >= list.length) return
//   const a = list[idx]
//   const b = list[target]
//   const tmp = a.order
//   a.order = b.order
//   b.order = tmp
//   list.sort((x, y) => x.order - y.order)
// }

const resetFromInitial = (payload: PanelConfigPayload) => {
  const next = deepClone(payload)
  initial.value = deepClone(next)
  Object.assign(draft, next)

  selected.feature.groupId = next.featureConfig[0]?.id ?? 'g-1'
  selected.feature.categoryId = next.featureConfig[0]?.categories?.[0]?.id ?? 'cat-water'
  selected.layer.groupId = next.layerConfig[0]?.id ?? 'g-1'
  selected.layer.categoryId = next.layerConfig[0]?.categories?.[0]?.id ?? 'cat-water'

  recalcStates()
}

const onSave = () => {
  const payload: PanelConfigPayload = deepClone({
    ...draft,
    updatedAt: new Date().toISOString(),
  })
  initial.value = deepClone(payload)
  emit('update:modelValue', payload)
  emit('save', payload)
}

const onCancel = () => {
  resetFromInitial(initial.value)
  emit('cancel')
  onSettings()
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) resetFromInitial(v)
  },
  { deep: true },
)

watch(activeTab, () => {
  recalcStates()
})

watch(
  () => feature.value.minZoom,
  (v) => {
    if (v > feature.value.maxZoom) feature.value.maxZoom = v
    if (feature.value.alarmZoom < v) feature.value.alarmZoom = v
  },
)

watch(
  () => feature.value.maxZoom,
  (v) => {
    if (v < feature.value.minZoom) feature.value.minZoom = v
    if (feature.value.alarmZoom > v) feature.value.alarmZoom = v
  },
)

watch(
  () => feature.value.alarmZoom,
  (v) => {
    if (v < feature.value.minZoom) feature.value.alarmZoom = feature.value.minZoom
    if (v > feature.value.maxZoom) feature.value.alarmZoom = feature.value.maxZoom
  },
)

const onSettings = () => {
  panelStore.setConfigOpen(!configOpen.value)
}

recalcStates()
</script>

<style scoped lang="less">
@c-bg1: #0b1b2a;
@c-bg2: #06131f;
@c-text: rgba(235, 248, 255, 0.92);
@c-cyan: rgba(39, 210, 255, 0.55);
@c-cyan-35: rgba(39, 210, 255, 0.35);
@c-cyan-25: rgba(39, 210, 255, 0.25);
@c-cyan-12: rgba(39, 210, 255, 0.12);
@c-text-cyan: rgba(144, 246, 255, 0.92);
@c-text-cyan-95: rgba(144, 246, 255, 0.95);
@c-text-sub: rgba(176, 247, 255, 0.92);
@c-gold: rgba(255, 155, 0, 0.9);

@gap: 10px;
@col-right: 120px;

  .cfg-toggle {
    position: fixed;
    top: 20px;
    left: 30px;
    height: 30px;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    // border: 1px solid #f0f0f0;
  }


.row-grid(@right: @col-right) {
  display: grid;
  grid-template-columns: 1fr @right;
  align-items: center;
  gap: @gap;
}

.card() {
  background: rgba(2, 18, 30, 0.55);
  border: 1px solid @c-cyan-25;
  border-radius: 10px;
  padding: 10px;
}

.small-label() {
  color: @c-text-cyan;
  font-size: 13px;
}

.btn() {
  width: 28px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid @c-cyan-25;
  background: rgba(0, 0, 0, 0.25);
  color: @c-text-cyan;
  cursor: pointer;
  line-height: 20px;

  &:active {
    transform: translateY(1px);
  }
}

.cfg-panel {
  position: absolute;
  top: 50px;
  left: 20px;
  z-index: 11;
  width: 520px;
  max-width: 90vw;
  padding: 12px;
  color: @c-text;
  background: linear-gradient(180deg, @c-bg1 0%, @c-bg2 100%);
  border: 2px solid @c-cyan;
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35) inset;


  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    background: rgba(0, 0, 0, 0.22);
    box-shadow: 0 0 0 1px @c-cyan-25 inset;
  }

  :deep(.el-input__inner),
  :deep(.el-select__selected-item) {
    color: @c-text;
  }

  :deep(.el-switch) {
    --el-switch-on-color: @c-gold;
    --el-switch-off-color: @c-cyan-35;
  }

  :deep(.el-checkbox__inner) {
    border-color: @c-cyan-35;
    background-color: rgba(0, 0, 0, 0.25);
  }

  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    border-color: @c-gold;
    background-color: @c-gold;
  }

  :deep(.el-button--primary) {
    --el-button-bg-color: rgba(39, 210, 255, 0.75);
    --el-button-border-color: rgba(39, 210, 255, 0.75);
    --el-button-hover-bg-color: rgba(39, 210, 255, 0.85);
    --el-button-hover-border-color: rgba(39, 210, 255, 0.85);
  }

  :deep(.el-button.is-disabled.el-button--primary) {
    --el-button-bg-color: rgba(39, 210, 255, 0.25);
    --el-button-border-color: rgba(39, 210, 255, 0.25);
  }

  .cfg-tabs {
    display: flex;
    gap: 8px;
    padding-bottom: 10px;
  }

  .cfg-tab {
    appearance: none;
    border: 1px solid @c-cyan-35;
    background: rgba(0, 0, 0, 0.25);
    color: @c-text-cyan-95;
    padding: 6px 14px;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    font-size: 14px;

    &.active {
      background: linear-gradient(180deg, rgba(246, 195, 107, 0.95) 0%, rgba(191, 140, 56, 0.95) 100%);
      border-color: rgba(255, 210, 140, 0.7);
      color: rgba(255, 255, 255, 0.95);
    }
  }

  .cfg-top {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: @gap;
    padding: 6px 0 12px;
  }

  .cfg-field {
    display: grid;
    grid-template-columns: 84px 1fr;
    align-items: center;
    gap: 8px;
  }

  .cfg-label {
    .small-label();
  }

  .cfg-inline {
    display: flex;
    align-items: center;
    gap: @gap;
  }

  .cfg-body {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 12px;
  }

  .cfg-section-title {
    .small-label();
    margin-bottom: 8px;
  }

  .cfg-card {
    .card();
  }

  .cfg-subtitle {
    color: @c-text-sub;
    font-size: 13px;
  }

  .cfg-radio-list {
    display: grid;
    gap: @gap;
    padding-top: 10px;
  }

  .cfg-radio-row {
    .row-grid(1fr);
  }

  .cfg-radio {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    appearance: none;
    background: transparent;
    border: 0;
    padding: 0;
    text-align: left;
  }

  .cfg-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    border: 2px solid rgba(255, 186, 72, 0.75);
    box-sizing: border-box;

    &.on {
      background: @c-gold;
    }
  }

  .cfg-radio-text {
    color: @c-text-cyan;
    font-size: 14px;
  }

  .cfg-cat-actions,
  .cfg-item-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: @gap;
  }

  .cfg-right-head {
    .row-grid(@col-right);
    padding-bottom: 10px;
  }

  .cfg-items {
    max-height: 260px;
    overflow: auto;
    padding-right: 4px;
  }

  .cfg-item {
    .row-grid(1fr);
    padding: 6px 0;
    border-top: 1px solid @c-cyan-12;

    &:first-child {
      border-top: 0;
    }
  }

  .cfg-check {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cfg-item-text {
    color: @c-text-cyan;
    font-size: 14px;
  }

  .cfg-order {
    display: flex;
    gap: 6px;
  }

  .cfg-btn {
    .btn();
  }

  .cfg-footer {
    display: flex;
    justify-content: flex-end;
    gap: @gap;
    padding-top: 12px;
  }

  .cfg-feature {
    display: grid;
    gap: 12px;
    padding: 6px 0 0;
  }

  .cfg-s-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    align-items: center;
    gap: @gap;
  }

  .cfg-s-label {
    .small-label();
  }

  .cfg-s-body {
    display: grid;
    grid-template-columns: 34px 1fr 28px;
    align-items: center;
    gap: 10px;
  }

  .cfg-s-val,
  .cfg-s-max {
    color: @c-text-cyan;
    font-size: 12px;
  }

  .cfg-opt {
    display: grid;
    gap: 8px;
    padding-top: 6px;
  }

  .cfg-opt-row {
    display: grid;
    grid-template-columns: 150px 1fr;
    align-items: center;
    gap: @gap;
  }

  .cfg-opt-label {
    .small-label();
  }

  .cfg-opt-inline {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cfg-unit {
    color: @c-text-cyan;
    font-size: 12px;
  }
}
</style>
