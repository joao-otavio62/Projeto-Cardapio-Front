import { Check, Copy } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, ErrorBox, Spinner, toast } from '../../components/ui'
import { publicApi } from '../../lib/api'
import { useStore } from '../../lib/cart'
import { brl, fmtDate } from '../../lib/format'
import { useFetch } from '../../lib/hooks'
import { STATUS_COLOR, STATUS_LABEL } from '../../lib/status'
import type { OrderStatus } from '../../lib/types'

export default function OrderPage() {
  const { slug } = useStore()
  const { code = '' } = useParams()
  const { data: o, error, reload } = useFetch(() => publicApi.order(slug, code), [slug, code])

  // atualiza sozinho (status muda no painel da loja / PIX é pago) até o pedido encerrar
  useEffect(() => {
    if (!o || o.status === 'Finished' || o.status === 'Cancelled') return
    const t = setInterval(() => { void reload() }, 5000)
    return () => clearInterval(t)
  }, [o?.status, reload]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !o) return <ErrorBox message={error} onRetry={reload} />
  if (!o) return <Spinner className="mt-10" />

  const steps: OrderStatus[] = ['Received', 'Preparing', o.deliveryType === 'Delivery' ? 'OutForDelivery' : 'ReadyForPickup', 'Finished']
  const reached = steps.indexOf(o.status)
  const pix = o.status === 'PendingPayment' && o.payment?.method === 'Pix' ? o.payment : null

  return (
    <div className="space-y-5 p-4">
      <div className="rounded-xl bg-red-50 p-5 text-center">
        <p className="text-sm text-zinc-600">Código do pedido</p>
        <p className="mt-1 select-all text-3xl font-extrabold tracking-wider text-red-700">{o.code}</p>
        <p className="mt-1 text-xs text-zinc-500">Guarde este código para consultar o pedido depois.</p>
        <Badge className={`mt-3 ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</Badge>
      </div>

      {pix && (
        <div className="space-y-3 rounded-xl border p-4 text-center">
          <h2 className="font-bold">Pague com PIX para confirmar o pedido</h2>
          {pix.pixQrCodeBase64 && <img src={`data:image/png;base64,${pix.pixQrCodeBase64}`} alt="QR Code PIX" className="mx-auto h-52 w-52" />}
          {pix.pixCopyPaste && (
            <>
              <p className="break-all rounded-lg bg-zinc-100 p-2 text-xs text-zinc-600">{pix.pixCopyPaste}</p>
              <Button variant="outline" className="w-full" onClick={async () => { await navigator.clipboard.writeText(pix.pixCopyPaste!); toast('Código PIX copiado!') }}>
                <Copy className="h-4 w-4" />Copiar código PIX
              </Button>
            </>
          )}
          {pix.pixExpiresAt && <p className="text-xs text-zinc-500">Válido até {fmtDate(pix.pixExpiresAt)}. Esta tela atualiza sozinha após o pagamento.</p>}
        </div>
      )}

      {o.status === 'Cancelled' && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">Pedido cancelado. Se você pagou, entre em contato com a loja.</div>}

      {reached >= 0 && (
        <ol className="space-y-3 rounded-xl border p-4">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= reached ? 'bg-green-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                {i <= reached ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={i === reached ? 'font-bold' : i < reached ? '' : 'text-zinc-400'}>{STATUS_LABEL[s]}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-xl border p-4">
        <h2 className="mb-2 font-bold">Itens</h2>
        <ul className="divide-y text-sm">
          {o.items.map((i, k) => (
            <li key={k} className="flex justify-between py-2">
              <span>{i.quantity}× {i.productName}{i.notes && <em className="block text-xs text-zinc-500">{i.notes}</em>}</span>
              <span>{brl(i.total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{brl(o.total)}</span></div>
        <p className="mt-1 text-xs text-zinc-500">{o.deliveryType === 'Delivery' ? 'Entrega' : 'Retirada no local'} · {fmtDate(o.createdAt)}</p>
      </div>
      <Link to={`/loja/${slug}`} className="block text-center font-semibold text-red-600">Voltar ao cardápio</Link>
    </div>
  )
}
