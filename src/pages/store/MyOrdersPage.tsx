import { Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Field, inputCls } from '../../components/ui'
import { publicApi } from '../../lib/api'
import { useStore } from '../../lib/cart'
import { brl, fmtDate, isValidCpf, maskCpf, onlyDigits } from '../../lib/format'
import { STATUS_COLOR, STATUS_LABEL } from '../../lib/status'
import type { PublicOrder } from '../../lib/types'

/** Aceita código (PZ-XXXXXX) ou CPF. */
export default function MyOrdersPage() {
  const { slug } = useStore()
  const [value, setValue] = useState('')
  const [orders, setOrders] = useState<PublicOrder[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isCode = /[a-z]/i.test(value)
  const onChange = (v: string) => setValue(/[a-z]/i.test(v) ? v.toUpperCase().slice(0, 12) : maskCpf(v))

  async function search(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setOrders(null)
    const v = value.trim()
    if (!v) return
    if (!isCode && !isValidCpf(v)) { setError('CPF inválido.'); return }
    setBusy(true)
    try {
      setOrders(isCode ? [await publicApi.order(slug, v)] : await publicApi.lookup(slug, onlyDigits(v)))
    } catch (err) {
      setError((err as Error).message)
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Meus pedidos</h1>
      <form onSubmit={search} className="space-y-3">
        <Field label="CPF ou código do pedido" hint="Ex.: 000.000.000-00 ou PZ-7K3M9Q">
          <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder="CPF ou código" />
        </Field>
        <Button type="submit" loading={busy} className="w-full"><Search className="h-4 w-4" />Buscar pedidos</Button>
      </form>
      {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {orders && orders.length === 0 && <p className="py-6 text-center text-zinc-500">Nenhum pedido encontrado.</p>}
      <ul className="space-y-3">
        {orders?.map((o) => (
          <li key={o.code}>
            <Link to={`/loja/${slug}/pedido/${o.code}`} className="block rounded-xl border p-4 hover:bg-zinc-50">
              <div className="flex items-center justify-between">
                <strong>{o.code}</strong>
                <Badge className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-500">{fmtDate(o.createdAt)} · {o.items.length} {o.items.length === 1 ? 'item' : 'itens'}</p>
              <p className="mt-1 font-semibold">{brl(o.total)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
