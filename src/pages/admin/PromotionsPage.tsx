import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, ConfirmDialog, ErrorBox, Field, Modal, Spinner, inputCls, toast } from '../../components/ui'
import { adminApi } from '../../lib/api'
import { brl, fmtDate, toLocalInput } from '../../lib/format'
import { useFetch } from '../../lib/hooks'
import type { Promotion } from '../../lib/types'

export default function PromotionsPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.promotions(), [])
  const [editing, setEditing] = useState<Promotion | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Promotion | null>(null)

  if (loading && !data) return <Spinner />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-xl font-bold">Promoções</h1><Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Nova</Button></div>
      <p className="mb-3 text-sm text-zinc-500">Depois de criar, vincule a promoção aos produtos em Produtos → Editar.</p>
      <ul className="space-y-2">
        {data?.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
            <span className="min-w-0">
              <strong>{p.title}</strong> {p.isCurrent ? <Badge className="bg-green-100 text-green-800">Vigente</Badge> : <Badge className="bg-zinc-200 text-zinc-700">{p.isActive ? 'Fora do período' : 'Inativa'}</Badge>}
              <span className="block text-sm text-zinc-600">{p.discountType === 'Percent' ? `${p.discountValue}% off` : `${brl(p.discountValue)} off`} · {fmtDate(p.startsAt)} → {fmtDate(p.endsAt)}</span>
            </span>
            <span className="flex shrink-0">
              <button onClick={() => setEditing(p)} aria-label={`Editar ${p.title}`} className="rounded-lg p-2 hover:bg-zinc-100"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => setDeleting(p)} aria-label={`Excluir ${p.title}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </span>
          </li>
        ))}
      </ul>
      {editing && <PromotionModal promo={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`Excluir "${deleting?.title}"?`}
        description="Os produtos vinculados voltam ao preço normal." confirmLabel="Excluir"
        onConfirm={async () => { try { await adminApi.deletePromotion(deleting!.id); toast('Promoção excluída'); await reload() } catch (e) { toast((e as Error).message, 'err') } }} />
    </div>
  )
}

function PromotionModal({ promo, onClose, onSaved }: { promo: Promotion | null; onClose: () => void; onSaved: () => void }) {
  const now = new Date(); const week = new Date(Date.now() + 7 * 864e5)
  const [f, setF] = useState({
    title: promo?.title ?? '', type: promo?.discountType ?? 'Percent', value: String(promo?.discountValue ?? ''),
    starts: toLocalInput(promo?.startsAt ?? now.toISOString()), ends: toLocalInput(promo?.endsAt ?? week.toISOString()), active: promo?.isActive ?? true,
  })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    const value = Number(f.value.replace(',', '.'))
    if (!(value > 0)) { setErr('Informe um desconto maior que zero.'); return }
    setBusy(true)
    try {
      await adminApi.savePromotion(promo?.id ?? null, {
        title: f.title.trim(), discountType: f.type as 'Percent' | 'Fixed', discountValue: value,
        startsAt: new Date(f.starts).toISOString(), endsAt: new Date(f.ends).toISOString(), isActive: f.active,
      })
      onSaved(); onClose(); toast('Promoção salva')
    } catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={promo ? 'Editar promoção' : 'Nova promoção'}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Título"><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo"><select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as 'Percent' | 'Fixed' })}><option value="Percent">Percentual (%)</option><option value="Fixed">Valor fixo (R$)</option></select></Field>
          <Field label="Desconto"><input className={inputCls} inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} required /></Field>
        </div>
        <Field label="Início"><input className={inputCls} type="datetime-local" value={f.starts} onChange={(e) => setF({ ...f, starts: e.target.value })} required /></Field>
        <Field label="Fim"><input className={inputCls} type="datetime-local" value={f.ends} onChange={(e) => setF({ ...f, ends: e.target.value })} required /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-4 w-4" />Ativa</label>
        {err && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</div>}
        <Button type="submit" loading={busy} className="w-full">Salvar</Button>
      </form>
    </Modal>
  )
}
