import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from './components/ui'
import { AuthProvider } from './lib/auth'
import AdminLayout from './pages/admin/AdminLayout'
import CategoriesPage from './pages/admin/CategoriesPage'
import LoginPage from './pages/admin/LoginPage'
import OrdersPage from './pages/admin/OrdersPage'
import ProductsPage from './pages/admin/ProductsPage'
import PromotionsPage from './pages/admin/PromotionsPage'
import ReportsPage from './pages/admin/ReportsPage'
import StorePage from './pages/admin/StorePage'
import CartPage from './pages/store/CartPage'
import CheckoutPage from './pages/store/CheckoutPage'
import MenuPage from './pages/store/MenuPage'
import MyOrdersPage from './pages/store/MyOrdersPage'
import OrderPage from './pages/store/OrderPage'
import StoreLayout from './pages/store/StoreLayout'

const DEFAULT_STORE = (import.meta.env.VITE_DEFAULT_STORE as string | undefined) ?? 'pizzaria-demo'

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Routes>
        <Route path="/" element={<Navigate to={`/loja/${DEFAULT_STORE}`} replace />} />

        <Route path="/loja/:slug" element={<StoreLayout />}>
          <Route index element={<MenuPage />} />
          <Route path="carrinho" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="pedidos" element={<MyOrdersPage />} />
          <Route path="pedido/:code" element={<OrderPage />} />
        </Route>

        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="pedidos" replace />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="promocoes" element={<PromotionsPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="loja" element={<StorePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
