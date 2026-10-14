import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, ConfirmDialog, ErrorBox, Field, Modal, Spinner, inputCls, toast } from '../../components/ui'
import { adminApi } from '../../lib/api'
import { useFetch } from '../../lib/hooks'
import type { Category } from '../../lib/types'

export default function CategoriesPage() {
  const { data, error, loading, reload } = useFetch(() => adminApi.categories(), [])
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  if (loading && !data) return <Spinner />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-xl font-bold">Categorias</h1><Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Nova</Button></div>
      <ul className="space-y-2">
        {data?.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
            <span><strong>{c.name}</strong> <span className="text-xs text-zinc-400">ordem {c.sortOrder}</span> {!c.isActive && <Badge className="bg-zinc-200 text-zinc-700">Inativa</Badge>}</span>
            <span className="flex">
              <button onClick={() => setEditing(c)} aria-label={`Editar ${c.name}`} className="rounded-lg p-2 hover:bg-zinc-100"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => setDeleting(c)} aria-label={`Excluir ${c.name}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </span>
          </li>
        ))}
      </ul>
      {editing && <CategoryModal category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`Excluir "${deleting?.name}"?`}
        description="Só é possível excluir categorias sem produtos." confirmLabel="Excluir"
        onConfirm={async () => { try { await adminApi.deleteCategory(deleting!.id); toast('Categoria excluída'); await reload() } catch (e) { toast((e as Error).message, 'err') } }} />
    </div>
  )
}

function CategoryModal({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? '')
  const [sort, setSort] = useState(String(category?.sortOrder ?? 0))
  const [active, setActive] = useState(category?.isActive ?? true)
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('')
    try { await adminApi.saveCategory(category?.id ?? null, { name: name.trim(), sortOrder: Number(sort) || 0, isActive: active }); onSaved(); onClose(); toast('Categoria salva') }
    catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={category ? 'Editar categoria' : 'Nova categoria'}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Nome"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></Field>
        <Field label="Ordem no cardápio"><input className={inputCls} inputMode="numeric" value={sort} onChange={(e) => setSort(e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />Ativa</label>
        {err && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</div>}
        <Button type="submit" loading={busy} className="w-full">Salvar</Button>
      </form>
    </Modal>
  )
}
