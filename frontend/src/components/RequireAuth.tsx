import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import PendingValidation from '@/components/PendingValidation'
import { isValidated, isGestorMaterial } from '@/lib/roles'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Usuarios sin ningún rol reconocido ven la pantalla de validación pendiente
  if (!isValidated(user) && !isGestorMaterial(user)) {
    return <PendingValidation />
  }

  return <>{children}</>
}
