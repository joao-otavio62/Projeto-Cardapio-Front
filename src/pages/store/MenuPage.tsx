import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { QtyStepper } from '../../components/QtyStepper'
import { Button, ErrorBox, Modal, Spinner, toast, inputCls } from '../../components/ui'
import { publicApi } from '../../lib/api'
import { useCart, useStore } from '../../lib/cart'
import { brl } from '../../lib/format'
import { useDebounce, useFetch } from '../../lib/hooks'
import type { PublicProduct } from '../../lib/types'

export default function MenuPage() {
  const { slug, store } = useStore()
  const cart = useCart()
  const [search, setSearch] = useState('')
  const q = useDebounce(search.trim(), 300)
  const { data: menu, error, loading, reload } = useFetch(() => publicApi.menu(slug, q), [slug, q])
  const [selected, setSelected] = useState<PublicProduct | null>(null)

  return (
    <div>
      {!store.isOpen && <div className="bg-amber-100 px-4 py-3 text-center text-sm font-medium text-amber-900">A loja está fechada no momento. Você pode ver o cardápio, mas não finalizar pedidos.</div>}

      <div className="sticky top-[57px] z-10 border-b bg-white px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} pl-10`}
            placeholder="Buscar no cardápio (ex.: muçarela, calabreza)" aria-label="Buscar produtos" type="search" />
        </div>
        {menu && menu.categories.length > 1 && (
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {menu.categories.map((c) => (
              <a key={c.id} href={`#cat-${c.id}`} className="shrink-0 rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium hover:bg-zinc-200">{c.name}</a>
            ))}
          </nav>
        )}
      </div>

      {loading && !menu && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {menu && menu.categories.length === 0 && !loading && (
        <p className="p-8 text-center text-zinc-500">{q ? `Nada encontrado para "${q}".` : 'Cardápio vazio.'}</p>
      )}

      <div className={loading && menu ? 'opacity-60 transition' : 'transition'}>
        {menu?.categories.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-40 px-4 pt-5">
            <h2 className="mb-3 text-xl font-bold">{c.name}</h2>
            <ul className="space-y-3">
              {c.products.map((p) => {
                const img = p.media.find((m) => m.type === 'Image')?.url
                return (
                  <li key={p.id} className="flex gap-3 rounded-xl border p-3">
                    <button onClick={() => setSelected(p)} className="flex flex-1 gap-3 text-left" aria-label={`Ver ${p.name}`}>
                      {img
                        ? <img src={img} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
                        : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-red-50 text-4xl">🍕</div>}
                      <div className="min-w-0">
                        <h3 className="font-semibold">{p.name}</h3>
                        {p.description && <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">{p.description}</p>}
                        <div className="mt-1.5 flex items-baseline gap-2">
                          <span className="font-bold text-red-600">{brl(p.finalPrice)}</span>
                          {p.finalPrice < p.price && <span className="text-xs text-zinc-400 line-through">{brl(p.price)}</span>}
                        </div>
                        {p.promotionTitle && <span className="mt-1 inline-block rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-800">{p.promotionTitle}</span>}
                      </div>
                    </button>
                    <div className="flex items-end">
                      <Button disabled={!p.available} onClick={() => { cart.add(p); toast(`${p.name} adicionado`) }} aria-label={`Adicionar ${p.name}`} className="!min-h-10 !px-3">
                        {p.available ? <Plus className="h-5 w-5" /> : 'Esgotado'}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function ProductModal({ product: p, onClose }: { product: PublicProduct; onClose: () => void }) {
  const cart = useCart()
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={p.name}>
      <div className="space-y-3">
        {p.media.length > 0 && (
          <div className="flex snap-x gap-2 overflow-x-auto">
            {[...p.media].sort((a, b) => a.sortOrder - b.sortOrder).map((m) => m.type === 'Image'
              ? <img key={m.id} src={m.url} alt={p.name} className="h-56 w-full shrink-0 snap-center rounded-lg object-cover" />
              : <video key={m.id} src={m.url} controls playsInline preload="metadata" className="h-56 w-full shrink-0 snap-center rounded-lg bg-black" />)}
          </div>
        )}
        {p.description && <p className="text-sm text-zinc-600">{p.description}</p>}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={255} rows={2} className={inputCls} placeholder="Alguma observação? (ex.: sem cebola)" />
        <div className="flex items-center justify-between">
          <QtyStepper qty={qty} onChange={(q) => setQty(Math.max(1, q))} />
          <Button disabled={!p.available} onClick={() => { cart.add(p, qty, notes); toast(`${p.name} adicionado`); onClose() }}>
            Adicionar · {brl(p.finalPrice * qty)}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
