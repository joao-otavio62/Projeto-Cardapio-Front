import { Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, ErrorBox, Field, Spinner, inputCls, toast } from '../../components/ui'
import { adminApi } from '../../lib/api'
import { useFetch } from '../../lib/hooks'

export default function StorePage() {
  const { data: store, error, loading, reload } = useFetch(() => adminApi.store(), [])
  const [f, setF] = useState({ name: '', phone: '', fee: '', min: '', open: true })
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (store) setF({ name: store.name, phone: store.phone ?? '', fee: String(store.deliveryFee), min: String(store.minOrder), open: store.isOpen }) }, [store])

  if (loading && !store) return <Spinner />
  if (error || !store) return <ErrorBox message={error ?? 'Erro'} onRetry={reload} />
  const link = `${location.origin}/loja/${store.slug}`

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true)
    try {
      await adminApi.updateStore({ name: f.name.trim(), phone: f.phone.trim() || null, deliveryFee: Number(f.fee.replace(',', '.')) || 0, minOrder: Number(f.min.replace(',', '.')) || 0, isOpen: f.open })
      toast('Configurações salvas'); await reload()
    } catch (e2) { toast((e2 as Error).message, 'err') } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <h1 className="text-xl font-bold">Configurações da loja</h1>
      <div className="rounded-lg bg-zinc-50 p-3 text-sm">
        <p className="mb-1 font-medium">Link da loja para os clientes</p>
        <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate">{link}</code>
          <button type="button" aria-label="Copiar link" onClick={async () => { await navigator.clipboard.writeText(link); toast('Link copiado') }} className="rounded-lg p-2 hover:bg-zinc-200"><Copy className="h-4 w-4" /></button></div>
      </div>
      <label className="flex items-center justify-between rounded-lg border p-3">
        <span><strong>Loja {f.open ? 'aberta' : 'fechada'}</strong><span className="block text-xs text-zinc-500">Fechada: clientes veem o cardápio mas não finalizam pedidos.</span></span>
        <input type="checkbox" checked={f.open} onChange={(e) => setF({ ...f, open: e.target.checked })} className="h-6 w-6 accent-red-600" />
      </label>
      <Field label="Nome"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={120} /></Field>
      <Field label="Telefone"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={20} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Taxa de entrega (R$)"><input className={inputCls} inputMode="decimal" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} /></Field>
        <Field label="Pedido mínimo (R$)"><input className={inputCls} inputMode="decimal" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
      </div>
      <Button type="submit" loading={busy} className="w-full">Salvar</Button>
    </form>
  )
}
