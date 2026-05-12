import { useMessageStore } from '@/store/useMessageStore'
import {
  MESSAGE_CHANNEL,
  MESSAGE_EVENT_KEY,
  MESSAGE_SYSTEM,
} from '@/const/const.message.type'

export * from '@/const/const.message.type'

// ============ Route Controller ============

type RouteResultHandler = (data: any) => void
let routeResultHandler: RouteResultHandler | null = null

export const onRouteResult = (handler: RouteResultHandler) => {
  routeResultHandler = handler
  const store = useMessageStore()
  store.subscribe(MESSAGE_EVENT_KEY.ROUTE_PLAN_RESULT, (envelope) => {
    routeResultHandler?.(envelope.data)
  })
}

let routeRequestHandler: RouteResultHandler | null = null
export const onRouteRequest = (handler: RouteResultHandler) => {
  routeRequestHandler = handler
  const store = useMessageStore()
  store.subscribe(MESSAGE_EVENT_KEY.ROUTE_PLAN_REQUEST, (envelope) => {
    routeRequestHandler?.(envelope.data)
  })
}

// ============ Addr Controller ============

type AddrResultHandler = (data: any) => void
let addrResultHandler: AddrResultHandler | null = null

export const onAddrResult = (handler: AddrResultHandler) => {
  addrResultHandler = handler
  const store = useMessageStore()
  store.subscribe(MESSAGE_EVENT_KEY.ADDR_SYNC_RESULT, (envelope) => {
    addrResultHandler?.(envelope.data)
  })
}

// ============ POI Controller ============

type POIResultHandler = (data: any) => void
let poiResultHandler: POIResultHandler | null = null

export const onPOIResult = (handler: POIResultHandler) => {
  poiResultHandler = handler
  const store = useMessageStore()
  store.subscribe(MESSAGE_EVENT_KEY.ADDR_POI_PICK, (envelope) => {
    poiResultHandler?.(envelope.data)
  })
}

export const onPOIRequest = (handler: POIResultHandler) => {
  const store = useMessageStore()
  store.subscribe(MESSAGE_EVENT_KEY.MAP_LOCATE, (envelope) => {
    handler(envelope.data)
  })
}


// ============ 来电提醒接口 ============


// ============ 统一发送（可选）============

export const routeCtrl = {
  send(data: any) {
    useMessageStore().publish(MESSAGE_EVENT_KEY.ROUTE_PLAN_MULTIPLE, data, {
      system: MESSAGE_SYSTEM.MAP,
      channel: MESSAGE_CHANNEL.WS,
    })
  },
  cancel(routeId: string) {
    useMessageStore().publish(MESSAGE_EVENT_KEY.ROUTE_PLAN_CANCEL, { routeId }, {
      system: MESSAGE_SYSTEM.MAP,
      channel: MESSAGE_CHANNEL.WS,
    })
  },
}

export const addrCtrl = {
  receive(handler: POIResultHandler) {
    useMessageStore().subscribe(MESSAGE_EVENT_KEY.ADDR_POI_PICK, (envelope) => {
      handler(envelope.data)
    })
  },
  send(data: any) {
    useMessageStore().publish(MESSAGE_EVENT_KEY.ADDR_POI_PICK, data, {
      system: MESSAGE_SYSTEM.HOST,
      channel: MESSAGE_CHANNEL.POST_MESSAGE,
      // dom iframe => store refDoms => iframeRegistry.get()
      // iframe: () => iframeRegistry.get(MESSAGE_SYSTEM.PANEL_25D)?.()
    })
  },
}

export const poiCtrl = {
  send(data: any) {
    useMessageStore().publish(MESSAGE_EVENT_KEY.MAP_POI_PICK, data, {
      system: MESSAGE_SYSTEM.MAP,
      channel: MESSAGE_CHANNEL.WS,
    })
  },
}
