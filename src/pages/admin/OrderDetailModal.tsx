import { Phone } from 'lucide-react'
import { useEffect } from 'react'
import { Badge, ErrorBox, Modal, Spinner } from '../../components/ui'
import { adminApi } from '../../lib/api'
import { brl, fmtDate, maskCpf, maskPhone } from '../../lib/format'
import { useFetch } from '../../lib/hooks'
import { STATUS_COLOR, STATUS_LABEL } from '../../lib/status'
import { useNotifications } from './Notifications'

/** Detalhes completos do cliente e do pedido. Abrir marca o pedido como visto (some do sino). */
export default function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { markSeen, unseen } = useNotifications()
  const { data: o, error, reload } = useFetch(() => adminApi.order(orderId), [orderId])

  useEffect(() => { if (unseen.some((n) => n.orderId === orderId) || (o && !o.seen)) markSeen(orderId) }, [orderId, o?.seen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal open onOpenChange={(v) => !v && onClose()} title={o ? `Pedido ${o.code}` : 'Pedido'} wide>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!o && !error && <Spinner />}
      {o && (
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <Badge className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge>
            <span className="text-zinc-500">{fmtDate(o.createdAt)}</span>
          </div>

          <section className="rounded-lg bg-zinc-50 p-3">
            <h3 className="mb-1 font-bold">Cliente</h3>
            <p>{o.customerName}</p>
            <p className="text-zinc-600">CPF {maskCpf(o.customerCpf)}</p>
            {o.customerPhone && <a href={`tel:${o.customerPhone}`} className="mt-1 inline-flex items-center gap-1 font-medium text-red-600"><Phone className="h-4 w-4" />{maskPhone(o.customerPhone)}</a>}
          </section>

          <section className="rounded-lg bg-zinc-50 p-3">
            <h3 className="mb-1 font-bold">{o.deliveryType === 'Delivery' ? 'Entrega' : 'Retirada no local'}</h3>
            {o.address
              ? <p>{o.address.street}, {o.address.number}{o.address.complement && ` - ${o.address.complement}`}<br />{o.address.district} · {o.address.city}/{o.address.state} · CEP {o.address.zipCode}</p>
              : <p className="text-zinc-600">Cliente retira na loja.</p>}
          </section>

          <section>
            <h3 className="mb-1 font-bold">Itens</h3>
            <ul className="divide-y">
              {o.items.map((i, k) => (
                <li key={k} className="flex justify-between py-2">
                  <span>{i.quantity}× {i.productName}{i.notes && <em className="block text-xs text-amber-700">Obs: {i.notes}</em>}</span>
                  <span>{brl(i.total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-0.5 border-t pt-2">
              <div className="flex justify-between"><span>Subtotal</span><span>{brl(o.subtotal)}</span></div>
              {o.discountTotal > 0 && <div className="flex justify-between text-green-700"><span>Descontos</span><span>-{brl(o.discountTotal)}</span></div>}
              <div className="flex justify-between"><span>Entrega</span><span>{brl(o.deliveryFee)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{brl(o.total)}</span></div>
            </div>
          </section>

          <section>
            <h3 className="mb-1 font-bold">Pagamento</h3>
            {o.payments.map((p, k) => (
              <p key={k}>{p.method === 'Pix' ? 'PIX' : `Cartão ${p.cardBrand ?? ''} ${p.cardLast4 ? `•••• ${p.cardLast4}` : ''}`} · {brl(p.amount)} · <strong>{p.status}</strong>{p.paidAt && ` em ${fmtDate(p.paidAt)}`}</p>
            ))}
          </section>

          <section>
            <h3 className="mb-1 font-bold">Histórico</h3>
            <ul className="space-y-0.5 text-zinc-600">{o.history.map((h, k) => <li key={k}>{fmtDate(h.at)} — {STATUS_LABEL[h.status]}</li>)}</ul>
          </section>
        </div>
      )}
    </Modal>
  )
}
