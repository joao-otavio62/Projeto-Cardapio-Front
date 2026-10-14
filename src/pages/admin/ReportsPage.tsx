import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErrorBox, Spinner, inputCls } from '../../components/ui'
import { adminApi } from '../../lib/api'
import { brl, isoDate } from '../../lib/format'
import { useFetch } from '../../lib/hooks'
import { STATUS_LABEL } from '../../lib/status'
import type { OrderStatus } from '../../lib/types'

export default function ReportsPage() {
  const [from, setFrom] = useState(isoDate(new Date(Date.now() - 29 * 864e5)))
  const [to, setTo] = useState(isoDate(new Date()))
  const { data: r, error, loading, reload } = useFetch(() => adminApi.report(from, to), [from, to])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="mr-auto text-xl font-bold">Relatórios</h1>
        <label className="text-sm">De<input type="date" className={inputCls} value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-sm">Até<input type="date" className={inputCls} value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !r && <Spinner />}
      {r && (
        <div className={loading ? 'opacity-60' : ''}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[['Faturamento', brl(r.revenue)], ['Pedidos pagos', String(r.ordersCount)], ['Ticket médio', brl(r.averageTicket)], ['Cancelados', String(r.cancelledCount)]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-zinc-500">{k}</p><p className="mt-1 text-xl font-extrabold">{v}</p></div>
            ))}
          </div>

          <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-bold">Faturamento por dia</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={r.daily.map((d) => ({ ...d, label: d.date.slice(8, 10) + '/' + d.date.slice(5, 7) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} interval="preserveStartEnd" />
                  <YAxis fontSize={12} width={56} tickFormatter={(v: number) => `R$${v}`} />
                  <Tooltip formatter={(v: number, n: string) => [n === 'revenue' ? brl(v) : v, n === 'revenue' ? 'Faturamento' : 'Pedidos']} />
                  <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-bold">Mais vendidos</h2>
              {r.topProducts.length === 0 ? <p className="text-sm text-zinc-500">Sem vendas no período.</p> :
                <ol className="space-y-1 text-sm">{r.topProducts.map((p, i) => <li key={p.productName} className="flex justify-between gap-2"><span className="truncate">{i + 1}. {p.productName}</span><span className="shrink-0 text-zinc-600">{p.quantity} un · {brl(p.revenue)}</span></li>)}</ol>}
            </section>
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-bold">Pedidos por status</h2>
              <ul className="space-y-1 text-sm">{r.byStatus.map((s) => <li key={s.status} className="flex justify-between"><span>{STATUS_LABEL[s.status as OrderStatus] ?? s.status}</span><strong>{s.count}</strong></li>)}</ul>
            </section>
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-bold">Estoque baixo</h2>
              {r.lowStock.length === 0 ? <p className="text-sm text-green-700">Tudo certo com o estoque ✔</p> :
                <ul className="space-y-1 text-sm">{r.lowStock.map((p) => <li key={p.productId} className="flex justify-between"><span className="truncate">{p.name}</span><strong className={p.stockQuantity === 0 ? 'text-red-600' : 'text-amber-600'}>{p.stockQuantity} un</strong></li>)}</ul>}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
