import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import RequireAuth from '@/components/RequireAuth'
import AppLayout from '@/components/AppLayout'
import LoginPage from '@/pages/LoginPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import SociosPage from '@/pages/SociosPage'
import SocioDetailPage from '@/pages/SocioDetailPage'

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
              <Route index element={<Navigate to="/socios" replace />} />
              <Route path="/socios" element={<SociosPage />} />
              <Route path="/socios/:id" element={<SocioDetailPage />} />
              <Route path="/materiales/socios" element={<PlaceholderPage title="Materiales de socios" description="Juegos y materiales aportados por cada socio" />} />
              <Route path="/materiales/asociacion" element={<PlaceholderPage title="Materiales de la asociación" description="Inventario propiedad de la asociación" />} />
              <Route path="/lugares" element={<PlaceholderPage title="Lugares" description="Espacios donde se realizan las reuniones" />} />
              <Route path="/eventos" element={<PlaceholderPage title="Eventos" description="Calendario de partidas y actividades" />} />
              <Route path="/publicaciones" element={<PlaceholderPage title="Publicaciones" description="Gestor de contenido para redes sociales" />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
