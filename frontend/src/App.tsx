import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import RequireAuth from '@/components/RequireAuth'
import AppLayout from '@/components/AppLayout'
import LoginPage from '@/pages/LoginPage'
import SociosPage from '@/pages/SociosPage'
import SocioDetailPage from '@/pages/SocioDetailPage'
import MaterialesSocioPage from '@/pages/MaterialesSocioPage'
import MaterialesAsociacionPage from '@/pages/MaterialesAsociacionPage'
import LugaresPage from '@/pages/LugaresPage'
import EventosPage from '@/pages/EventosPage'
import EventoDetailPage from '@/pages/EventoDetailPage'
import PublicacionesPage from '@/pages/PublicacionesPage'
import DashboardPage from '@/pages/DashboardPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="/socios" element={<SociosPage />} />
              <Route path="/socios/:id" element={<SocioDetailPage />} />
              <Route path="/materiales/socios" element={<MaterialesSocioPage />} />
              <Route path="/materiales/asociacion" element={<MaterialesAsociacionPage />} />
              <Route path="/lugares" element={<LugaresPage />} />
              <Route path="/eventos" element={<EventosPage />} />
              <Route path="/eventos/:id" element={<EventoDetailPage />} />
              <Route path="/publicaciones" element={<PublicacionesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
