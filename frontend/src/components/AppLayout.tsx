import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Package, Archive, MapPin, CalendarDays, Megaphone, LogOut, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/',                        label: 'Inicio',                icon: LayoutDashboard },
  { to: '/socios',                  label: 'Socios',                icon: Users },
  { to: '/materiales/socios',       label: 'Materiales socios',     icon: Package },
  { to: '/materiales/asociacion',   label: 'Materiales asociación', icon: Archive },
  { to: '/lugares',                 label: 'Lugares',               icon: MapPin },
  { to: '/eventos',                 label: 'Eventos',               icon: CalendarDays },
  { to: '/publicaciones',           label: 'Publicaciones',         icon: Megaphone },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
    )

  const sidebar = (
    <nav className="flex flex-col h-full">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-brand-700 dark:text-brand-400">Tentáculos</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Gestión interna</p>
      </div>

      <ul className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'} className={navLinkClass} onClick={() => setMenuOpen(false)}>
              <Icon size={16} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{user?.name ?? user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-shrink-0 flex-col">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="relative w-56 h-full bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setMenuOpen(false)}
            >
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} className="text-gray-500 dark:text-gray-400">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-brand-700 dark:text-brand-400">Tentáculos</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
