import { ArrowLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QtyStepper } from '../../components/QtyStepper'
import { Button, ConfirmDialog, inputCls } from '../../components/ui'
import { useCart, useStore } from '../../lib/cart'
import { brl } from '../../lib/format'

export default function CartPage() {
  const { slug, store } = useStore()
  const cart = useCart()
  const nav = useNavigate()
  const [clearing, setClearing] = useState(false)
  const back = `/loja/${slug}`

  if (cart.items.length === 0) return (
    <div className="p-8 text-center">
      <p className="text-5xl">🛒</p>
      <p className="mt-3 text-zinc-600">Seu carrinho está vazio.</p>
      <Link to={back} className="mt-4 inline-block font-semibold text-red-600">Ver cardápio</Link>
    </div>
  )
  const missing = store.minOrder - cart.subtotal

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Link to={back} className="flex items-center gap-1 text-sm font-medium text-zinc-600"><ArrowLeft className="h-4 w-4" />Continuar comprando</Link>
        <button onClick={() => setClearing(true)} className="text-sm font-medium text-red-600">Limpar</button>
      </div>
      <h1 className="mb-3 text-xl font-bold">Seu carrinho</h1>
      <ul className="space-y-3">
        {cart.items.map((i) => (
          <li key={i.productId} className="rounded-xl border p-3">
            <div className="flex gap-3">
              {i.image ? <img src={i.image} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-red-50 text-2xl">🍕</div>}
              <div className="flex-1">
                <p className="font-semibold">{i.name}</p>
                <p className="text-sm text-zinc-500">{brl(i.price)} cada</p>
              </div>
              <p className="font-bold">{brl(i.price * i.qty)}</p>
            </div>
            <input value={i.notes} onChange={(e) => cart.setNotes(i.productId, e.target.value)} maxLength={255} placeholder="Observação" className={`${inputCls} mt-2 !py-1.5 text-sm`} />
            <div className="mt-2 flex items-center justify-between">
              <QtyStepper qty={i.qty} onChange={(q) => cart.setQty(i.productId, q)} />
              <button onClick={() => cart.setQty(i.productId, 0)} aria-label={`Remover ${i.name}`} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"><Trash2 className="h-5 w-5" /></button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-between border-t pt-4 text-lg font-bold"><span>Subtotal</span><span>{brl(cart.subtotal)}</span></div>
      <p className="text-xs text-zinc-500">Taxa de entrega e descontos finais são calculados no checkout.</p>
      {missing > 0 && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Pedido mínimo de {brl(store.minOrder)}. Faltam {brl(missing)}.</p>}
      <Button className="mt-4 w-full" disabled={missing > 0 || !store.isOpen} onClick={() => nav(`/loja/${slug}/checkout`)}>
        {store.isOpen ? 'Ir para o checkout' : 'Loja fechada'}
      </Button>
      <ConfirmDialog open={clearing} onOpenChange={setClearing} title="Limpar carrinho?" description="Todos os itens serão removidos do carrinho." confirmLabel="Limpar" onConfirm={cart.clear} />
    </div>
  )
}
