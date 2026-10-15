import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Badge, Button, ConfirmDialog, ErrorBox, Field, Modal, Spinner, inputCls, toast } from '../../components/ui'
import { adminApi } from '../../lib/api'
import { brl } from '../../lib/format'
import { useDebounce, useFetch } from '../../lib/hooks'
import type { Category, Product, Promotion } from '../../lib/types'

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const q = useDebounce(search.trim(), 300)
  const { data, error, loading, reload } = useFetch(() => adminApi.products(q), [q])
  const refs = useFetch(() => Promise.all([adminApi.categories(), adminApi.promotions()]), [])
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  async function remove(p: Product) {
    try { await adminApi.deleteProduct(p.id); toast('Produto excluído'); await reload() }
    catch (e) { toast((e as Error).message, 'err') }
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input className={inputCls} placeholder="Buscar produto…" value={search} onChange={(e) => setSearch(e.target.value)} type="search" aria-label="Buscar produto" />
        <Button onClick={() => setEditing('new')} disabled={!refs.data?.[0].length}><Plus className="h-4 w-4" />Novo</Button>
      </div>
      {refs.data && refs.data[0].length === 0 && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Crie uma categoria antes de cadastrar produtos.</p>}
      {loading && !data && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((p) => {
          const img = p.media.find((m) => m.type === 'Image')?.url
          const low = p.trackStock && p.stockQuantity <= p.lowStockAlert
          return (
            <li key={p.id} className={`flex gap-3 rounded-xl bg-white p-3 shadow-sm ${!p.isActive ? 'opacity-60' : ''}`}>
              {img ? <img src={img} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-red-50 text-3xl">🍕</div>}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-zinc-500">{p.categoryName}</p>
                <p className="font-bold text-red-600">{brl(p.finalPrice)} {p.finalPrice < p.price && <span className="text-xs font-normal text-zinc-400 line-through">{brl(p.price)}</span>}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {!p.isActive && <Badge className="bg-zinc-200 text-zinc-700">Inativo</Badge>}
                  {p.trackStock && <Badge className={low ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>Estoque: {p.stockQuantity}</Badge>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`} className="rounded-lg p-2 hover:bg-zinc-100"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleting(p)} aria-label={`Excluir ${p.name}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          )
        })}
      </ul>
      {data && data.items.length === 0 && !loading && <p className="py-8 text-center text-zinc-500">Nenhum produto encontrado.</p>}

      {editing && refs.data && (
        <ProductModal product={editing === 'new' ? null : editing} categories={refs.data[0]} promotions={refs.data[1]}
          onChanged={reload} onClose={() => { setEditing(null); void reload() }} />
      )}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`Excluir "${deleting?.name}"?`}
        description="O produto e suas fotos/vídeos serão removidos. Pedidos antigos continuam com o histórico." confirmLabel="Excluir"
        onConfirm={() => deleting && remove(deleting)} />
    </div>
  )
}

function ProductModal({ product, categories, promotions, onClose, onChanged }:
  { product: Product | null; categories: Category[]; promotions: Promotion[]; onClose: () => void; onChanged: () => void }) {
  const [current, setCurrent] = useState<Product | null>(product)
  const [f, setF] = useState({
    name: product?.name ?? '', description: product?.description ?? '', price: product ? String(product.price) : '',
    categoryId: product?.categoryId ?? categories[0]?.id ?? '', promotionId: product?.promotionId ?? '',
    trackStock: product?.trackStock ?? false, stockQuantity: String(product?.stockQuantity ?? 0), lowStockAlert: String(product?.lowStockAlert ?? 5),
    isActive: product?.isActive ?? true,
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [stockDelta, setStockDelta] = useState('')
  const [delMedia, setDelMedia] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    const price = Number(f.price.replace(',', '.'))
    if (!f.name.trim() || isNaN(price) || price < 0) { setErr('Informe nome e preço válidos.'); return }
    setBusy(true)
    try {
      const saved = await adminApi.saveProduct(current?.id ?? null, {
        categoryId: f.categoryId, name: f.name.trim(), description: f.description.trim() || null, price,
        promotionId: f.promotionId || null, trackStock: f.trackStock, stockQuantity: Number(f.stockQuantity) || 0,
        lowStockAlert: Number(f.lowStockAlert) || 0, isActive: f.isActive,
      })
      const wasNew = !current
      setCurrent(saved); onChanged()
      toast(wasNew ? 'Produto criado. Agora você pode enviar fotos e vídeos.' : 'Produto salvo')
    } catch (e2) { setErr((e2 as Error).message) } finally { setBusy(false) }
  }

  async function upload(files: FileList | null) {
    if (!files?.length || !current) return
    setBusy(true)
    try {
      for (const file of Array.from(files)) {
        const m = await adminApi.uploadMedia(current.id, file)
        setCurrent((c) => c && { ...c, media: [...c.media, m] })
      }
      onChanged(); toast('Arquivo enviado')
    } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false); if (file.current) file.current.value = '' }
  }

  async function adjust() {
    const q = parseInt(stockDelta, 10)
    if (!current || !q) return
    try { const p = await adminApi.adjustStock(current.id, q); setCurrent(p); setStockDelta(''); onChanged(); toast('Estoque atualizado') }
    catch (e) { toast((e as Error).message, 'err') }
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={current ? 'Editar produto' : 'Novo produto'} wide scrollable>
      <form onSubmit={save} className="space-y-3">
        <Field label="Nome"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={140} required /></Field>
        <Field label="Descrição"><textarea className={inputCls} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={2000} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço (R$)"><input className={inputCls} inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required /></Field>
          <Field label="Categoria"><select className={inputCls} value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        </div>
        <Field label="Promoção"><select className={inputCls} value={f.promotionId} onChange={(e) => setF({ ...f, promotionId: e.target.value })}>
          <option value="">Sem promoção</option>{promotions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} className="h-4 w-4" />Ativo no cardápio</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.trackStock} onChange={(e) => setF({ ...f, trackStock: e.target.checked })} className="h-4 w-4" />Controlar estoque</label>
        {f.trackStock && (
          <div className="grid grid-cols-2 gap-3">
            {!current && <Field label="Estoque inicial"><input className={inputCls} inputMode="numeric" value={f.stockQuantity} onChange={(e) => setF({ ...f, stockQuantity: e.target.value })} /></Field>}
            <Field label="Alertar abaixo de"><input className={inputCls} inputMode="numeric" value={f.lowStockAlert} onChange={(e) => setF({ ...f, lowStockAlert: e.target.value })} /></Field>
          </div>
        )}
        {err && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</div>}
        <Button type="submit" loading={busy} className="w-full">Salvar</Button>
      </form>

      {current && (
        <div className="mt-5 space-y-4 border-t pt-4">
          {current.trackStock && (
            <div>
              <h3 className="mb-1 font-bold">Estoque atual: {current.stockQuantity}</h3>
              <div className="flex gap-2">
                <input className={inputCls} inputMode="numeric" placeholder="+10 entrada / -2 saída" value={stockDelta} onChange={(e) => setStockDelta(e.target.value)} />
                <Button variant="outline" type="button" onClick={adjust}>Ajustar</Button>
              </div>
            </div>
          )}
          <div>
            <h3 className="mb-2 font-bold">Fotos e vídeos</h3>
            <div className="flex flex-wrap gap-2">
              {current.media.map((m) => (
                <div key={m.id} className="relative h-24 w-24 overflow-hidden rounded-lg bg-zinc-100">
                  {m.type === 'Image' ? <img src={m.url} alt="" className="h-full w-full object-cover" /> : <video src={m.url} className="h-full w-full object-cover" muted />}
                  <button type="button" onClick={() => setDelMedia(m.id)} aria-label="Remover mídia" className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => file.current?.click()} disabled={busy} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-zinc-500 hover:bg-zinc-50">
                <ImagePlus className="h-5 w-5" />Adicionar
              </button>
              <input ref={file} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(e) => void upload(e.target.files)} />
            </div>
            <p className="mt-1 text-xs text-zinc-500">Imagens até 10 MB (JPG, PNG, WEBP) · vídeos até 50 MB (MP4, WEBM).</p>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!delMedia} onOpenChange={(o) => !o && setDelMedia(null)} title="Remover mídia?" description="O arquivo será apagado da nuvem." confirmLabel="Remover"
        onConfirm={async () => {
          if (!current || !delMedia) return
          try { await adminApi.deleteMedia(current.id, delMedia); setCurrent({ ...current, media: current.media.filter((m) => m.id !== delMedia) }); onChanged() }
          catch (e) { toast((e as Error).message, 'err') }
        }} />
    </Modal>
  )
}
