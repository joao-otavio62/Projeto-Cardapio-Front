import { ClipboardList, Pizza, ShoppingBag } from 'lucide-react'
import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { ChatWidget } from '../../components/ChatWidget'
import { ErrorBox, Spinner } from '../../components/ui'
import { publicApi } from '../../lib/api'
import { CartProvider, StoreProvider, useCart } from '../../lib/cart'
import { brl } from '../../lib/format'
import { useFetch } from '../../lib/hooks'

export default function StoreLayout() {
  const { slug = '' } = useParams()
  const { data: store, error, loading } = useFetch(() => publicApi.store(slug), [slug])

  if (loading && !store) return <Spinner className="mt-20" />
  if (error || !store) return <ErrorBox message={error ?? 'Loja não encontrada.'} />

  return (
    <CartProvider slug={slug}>
      <StoreProvider value={{ store, slug }}>
        <Shell name={store.name} slug={slug} />
        <ChatWidget slug={slug} />
      </StoreProvider>
    </CartProvider>
  )
}

function Shell({ name, slug }: { name: string; slug: string }) {
  const { count, subtotal } = useCart()
  const { pathname } = useLocation()
  const showBar = count > 0 && !pathname.endsWith('/carrinho') && !pathname.endsWith('/checkout')
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white pb-28 shadow-sm">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/95 px-4 py-3 backdrop-blur">
        <Link to={`/loja/${slug}`} className="flex items-center gap-2 text-lg font-extrabold text-red-600">
          <Pizza className="h-6 w-6" />{name}
        </Link>
        <Link to={`/loja/${slug}/pedidos`} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
          <ClipboardList className="h-4 w-4" />Meus pedidos
        </Link>
      </header>
      <Outlet />
      {showBar && (
        <Link to={`/loja/${slug}/carrinho`}
          className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[calc(100%-2rem)] max-w-xl items-center justify-between rounded-xl bg-red-600 px-5 py-4 font-semibold text-white shadow-xl">
          <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />Ver carrinho ({count})</span>
          <span>{brl(subtotal)}</span>
        </Link>
      )}
    </div>
  )
}
