/*
 * @Author: huanghuanrong
 * @Date: 2026-04-29 16:52:10
 * @LastEditTime: 2026-05-11 18:23:43
 * @LastEditors: huanghuanrong
 * @Description: 文件描述
 * @FilePath: \ids-gis-web\src\Control\initMessage.ts
 */
// src/Control/initMessage.ts
import { useMessageStore } from '@/store/useMessageStore'
import { MESSAGE_SYSTEM, MESSAGE_CHANNEL, MESSAGE_EVENT_KEY } from '@/const/const.message.type'

export const initMessage = () => {
    const msg = useMessageStore()

    const isUseWS = import.meta.env.VITE_USE_WS === 'true'
    const isUsePostMessage = import.meta.env.VITE_USE_POSTMESSAGE === 'true'

    const unbindHost = msg.bindParent({
        system: MESSAGE_SYSTEM.HOST,
        acceptOrigins: ['http://192.168.173.79:5173', 'http://localhost:5173'],
    })

    const disconnectWs = msg.connectWebSocket({
        system: MESSAGE_SYSTEM.HOST,
        url: import.meta.env.VITE_WS_URL,
        socketOptions: {
            heartbeatMessage: { eventKey: MESSAGE_EVENT_KEY.HEARTBEAT, data: 'ping' },
        },
    })

    return () => {
        isUseWS && unbindHost()
        isUsePostMessage && disconnectWs()
    }
}