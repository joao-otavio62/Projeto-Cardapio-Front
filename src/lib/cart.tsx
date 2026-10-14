import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PublicProduct, Store } from './types'

export type CartItem = { productId: string; name: string; price: number; qty: number; notes: string; image?: string }
type Cart = {
  items: CartItem[]; count: number; subtotal: number
  add: (p: PublicProduct, qty?: number, notes?: string) => void
  setQty: (id: string, qty: number) => void
  setNotes: (id: string, notes: string) => void
  clear: () => void
}

const CartCtx = createContext<Cart | null>(null)
export const useCart = () => useContext(CartCtx)!

export function CartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const key = `pf_cart_${slug}`
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? '[]') as CartItem[] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(items)) }, [items, key])

  const value = useMemo<Cart>(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
    add: (p, qty = 1, notes = '') => setItems((cur) => {
      const found = cur.find((i) => i.productId === p.id)
      if (found) return cur.map((i) => i.productId === p.id ? { ...i, qty: Math.min(50, i.qty + qty), notes: notes || i.notes } : i)
      return [...cur, { productId: p.id, name: p.name, price: p.finalPrice, qty, notes, image: p.media.find((m) => m.type === 'Image')?.url }]
    }),
    setQty: (id, qty) => setItems((cur) => qty <= 0 ? cur.filter((i) => i.productId !== id) : cur.map((i) => i.productId === id ? { ...i, qty: Math.min(50, qty) } : i)),
    setNotes: (id, notes) => setItems((cur) => cur.map((i) => i.productId === id ? { ...i, notes } : i)),
    clear: () => setItems([]),
  }), [items])

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

const StoreCtx = createContext<{ store: Store; slug: string } | null>(null)
export const StoreProvider = StoreCtx.Provider
export const useStore = () => useContext(StoreCtx)!
