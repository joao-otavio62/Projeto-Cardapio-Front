import * as signalR from '@microsoft/signalr'
import { Bell } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Modal, toast } from '../../components/ui'
import { adminApi, BASE, tokenStore } from '../../lib/api'
import { brl, fmtDate } from '../../lib/format'
import { playNotification, unlockAudio } from '../../lib/sound'
import type { NewOrderEvent } from '../../lib/types'
import OrderDetailModal from './OrderDetailModal'

type Ctx = { unseen: NewOrderEvent[]; markSeen: (id: string) => void; refreshKey: number; connected: boolean }
const NotifCtx = createContext<Ctx | null>(null)
export const useNotifications = () => useContext(NotifCtx)!

/** Mantém a conexão SignalR. "refreshKey" muda sempre que algo muda no painel (novo pedido/status) para as telas recarregarem. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unseen, setUnseen] = useState<NewOrderEvent[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [connected, setConnected] = useState(false)
  const first = useRef(true)

  const bump = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio, { once: true })
    adminApi.unseen().then((list) =>
      setUnseen(list.map((o) => ({ orderId: o.id, code: o.code, customerName: o.customerName, total: o.total, deliveryType: o.deliveryType, createdAt: o.createdAt }))),
    ).catch(() => { /* a conexão em tempo real continua funcionando */ })

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE}/hubs/admin-notifications`, { accessTokenFactory: () => tokenStore.get() ?? '' })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    conn.on('NewOrder', (n: NewOrderEvent) => {
      setUnseen((x) => [n, ...x.filter((i) => i.orderId !== n.orderId)])
      playNotification()
      toast(`🍕 Novo pedido ${n.code} · ${brl(n.total)}`)
      bump()
    })
    conn.on('OrderStatusChanged', bump)
    conn.onreconnected(() => { setConnected(true); bump() })
    conn.onclose(() => setConnected(false))
    conn.onreconnecting(() => setConnected(false))

    conn.start().then(() => setConnected(true)).catch(() => setConnected(false))
    first.current = false
    return () => { void conn.stop() }
  }, [bump])

  const value = useMemo<Ctx>(() => ({
    unseen, refreshKey, connected,
    markSeen: (id) => { setUnseen((x) => x.filter((i) => i.orderId !== id)); void adminApi.markSeen(id).catch(() => {}) },
  }), [unseen, refreshKey, connected])

  return <NotifCtx.Provider value={value}>{children}</NotifCtx.Provider>
}

export function NotificationBell() {
  const { unseen, connected } = useNotifications()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative rounded-full p-2 hover:bg-zinc-100" aria-label={`Notificações: ${unseen.length} novos pedidos`}>
        <Bell className="h-6 w-6" />
        {unseen.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">{unseen.length}</span>}
        <span className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-zinc-300'}`} title={connected ? 'Tempo real conectado' : 'Reconectando…'} />
      </button>

      <Modal open={open && !selected} onOpenChange={setOpen} title="Novos pedidos">
        {unseen.length === 0
          ? <p className="py-6 text-center text-zinc-500">Nenhum pedido novo.</p>
          : <ul className="divide-y">
              {unseen.map((n) => (
                <li key={n.orderId}>
                  <button onClick={() => setSelected(n.orderId)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-zinc-50">
                    <span>
                      <strong>{n.code}</strong> · {n.customerName}
                      <span className="block text-xs text-zinc-500">{fmtDate(n.createdAt)} · {n.deliveryType === 'Delivery' ? 'Entrega' : 'Retirada'}</span>
                    </span>
                    <strong>{brl(n.total)}</strong>
                  </button>
                </li>
              ))}
            </ul>}
      </Modal>
      {selected && <OrderDetailModal orderId={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
