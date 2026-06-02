import { Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function PendingValidation() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center mx-auto">
          <Clock size={30} className="text-yellow-500" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Cuenta pendiente de validación
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            Tu cuenta está registrada pero aún no tiene acceso al panel.
            Un administrador debe asignarte el rol de socio para que puedas entrar.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            ¿Qué ocurre ahora?
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">•</span>
              El administrador revisa tu solicitud de acceso
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">•</span>
              Te asigna el label <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">socio</code> en la consola
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">•</span>
              Al volver a entrar tendrás acceso completo
            </li>
          </ul>
        </div>

        <button
          onClick={() => logout().then(() => window.location.reload())}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
