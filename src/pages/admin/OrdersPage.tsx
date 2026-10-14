import { useEffect, useState } from 'react'
import { Badge, Button, ConfirmDialog, ErrorBox, Spinner, toast } from '../../components/ui'
import { adminApi } from '../../lib/api'
import { brl, fmtDate } from '../../lib/format'
import { useFetch } from '../../lib/hooks'
import { NEXT_LABEL, nextStatus, STATUS_COLOR, STATUS_LABEL } from '../../lib/status'
import type { AdminOrderListItem, OrderStatus } from '../../lib/types'
import OrderDetailModal from './OrderDetailModal'
import { useNotifications } from './Notifications'

const COLUMNS: { title: string; statuses: OrderStatus[] }[] = [
  { title: 'Recebido', statuses: ['Received'] },
  { title: 'Em preparo', statuses: ['Preparing'] },
  { title: 'Entrega / Retirada', statuses: ['OutForDelivery', 'ReadyForPickup'] },
  { title: 'Finalizado', statuses: ['Finished'] },
]

export default function OrdersPage() {
  const { refreshKey } = useNotifications()
  const { data, error, loading, reload } = useFetch(() => adminApi.orders(), [])
  const [detail, setDetail] = useState<string | null>(null)
  const [cancel, setCancel] = useState<AdminOrderListItem | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [tab, setTab] = useState(0)

  useEffect(() => { void reload() }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps (SignalR avisa mudanças)
  useEffect(() => { const t = setInterval(() => { void reload() }, 60000); return () => clearInterval(t) }, [reload])

  async function move(o: AdminOrderListItem, to: OrderStatus) {
    setBusyId(o.id)
    try { await adminApi.setStatus(o.id, to); toast(`${o.code} → ${STATUS_LABEL[to]}`); await reload() }
    catch (e) { toast((e as Error).message, 'err') }
    finally { setBusyId(null) }
  }

  if (loading && !data) return <Spinner />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />
  const orders = data?.items ?? []

  return (
    <div>
      <div className="mb-3 flex gap-1 overflow-x-auto md:hidden">
        {COLUMNS.map((c, i) => {
          const n = orders.filter((o) => c.statuses.includes(o.status)).length
          return <button key={c.title} onClick={() => setTab(i)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${tab === i ? 'bg-zinc-900 text-white' : 'bg-white'}`}>{c.title} ({n})</button>
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {COLUMNS.map((col, i) => {
          const list = orders.filter((o) => col.statuses.includes(o.status))
          return (
            <section key={col.title} className={`${tab === i ? 'block' : 'hidden'} md:block`}>
              <h2 className="mb-2 hidden font-bold md:block">{col.title} <span className="text-zinc-400">({list.length})</span></h2>
              <ul className="space-y-3">
                {list.length === 0 && <li className="rounded-xl border border-dashed p-6 text-center text-sm text-zinc-400">Sem pedidos</li>}
                {list.map((o) => {
                  const next = nextStatus(o.status, o.deliveryType === 'Delivery')
                  return (
                    <li key={o.id} className={`rounded-xl bg-white p-3 shadow-sm ${!o.seen ? 'ring-2 ring-red-400' : ''}`}>
                      <button onClick={() => setDetail(o.id)} className="block w-full text-left">
                        <div className="flex items-center justify-between"><strong>{o.code}</strong><span className="text-sm font-semibold">{brl(o.total)}</span></div>
                        <p className="truncate text-sm">{o.customerName}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">{fmtDate(o.createdAt)}
                          <Badge className={STATUS_COLOR[o.status]}>{o.deliveryType === 'Delivery' ? '🛵 Entrega' : '🏪 Retirada'}</Badge></p>
                      </button>
                      {(next || o.status === 'Received' || o.status === 'Preparing') && (
                        <div className="mt-3 flex gap-2">
                          {next && <Button className="flex-1 !min-h-10" loading={busyId === o.id} onClick={() => move(o, next)}>{NEXT_LABEL[next]}</Button>}
                          {(o.status === 'Received' || o.status === 'Preparing') && <Button variant="outline" className="!min-h-10 text-red-600" onClick={() => setCancel(o)}>Cancelar</Button>}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      {detail && <OrderDetailModal orderId={detail} onClose={() => { setDetail(null); void reload() }} />}
      <ConfirmDialog open={!!cancel} onOpenChange={(o) => !o && setCancel(null)} title={`Cancelar pedido ${cancel?.code}?`}
        description="O pedido será cancelado e o estoque devolvido. Se já foi pago, o estorno precisa ser feito no Mercado Pago."
        confirmLabel="Cancelar pedido" onConfirm={() => cancel && move(cancel, 'Cancelled')} />
    </div>
  )
}
