import { BarChart3, LogOut, Package, Pizza, Settings, Tag, Percent, ClipboardList } from 'lucide-react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { NotificationBell, NotificationProvider } from './Notifications'

const links = [
  { to: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: 'produtos', label: 'Produtos', icon: Package },
  { to: 'categorias', label: 'Categorias', icon: Tag },
  { to: 'promocoes', label: 'Promoções', icon: Percent },
  { to: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: 'loja', label: 'Loja', icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  if (!user) return <Navigate to="/admin/login" replace />

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-zinc-100">
        <header className="sticky top-0 z-30 border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
            <span className="flex items-center gap-2 font-extrabold text-red-600"><Pizza className="h-6 w-6" />PizzaFlow</span>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <span className="hidden text-sm text-zinc-600 sm:inline">{user.name}</span>
              <button onClick={logout} className="rounded-full p-2 hover:bg-zinc-100" aria-label="Sair"><LogOut className="h-5 w-5" /></button>
            </div>
          </div>
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 pb-2" aria-label="Menu do painel">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-red-600 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}>
                <Icon className="h-4 w-4" />{label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl p-4"><Outlet /></main>
      </div>
    </NotificationProvider>
  )
}
