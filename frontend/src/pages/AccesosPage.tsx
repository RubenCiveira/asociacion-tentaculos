import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserX, UserCheck, ExternalLink } from 'lucide-react'
import { useSocios } from '@/hooks/useSocios'
import { Table } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import type { Socio } from '@/types'

export default function AccesosPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useSocios()

  const sinCuenta = useMemo(
    () => (data?.documents ?? []).filter(s => !s.user_id && s.activo),
    [data],
  )

  const conCuenta = useMemo(
    () => (data?.documents ?? []).filter(s => !!s.user_id),
    [data],
  )

  const columnasSinCuenta = [
    {
      key: 'socio',
      header: 'Socio',
      render: (s: Socio) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {s.apellidos}, {s.nombre}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (s: Socio) => s.email
        ? <span className="text-sm text-gray-600 dark:text-gray-400">{s.email}</span>
        : <span className="text-sm text-gray-400 dark:text-gray-500 italic">Sin email</span>,
    },
    {
      key: 'invitar',
      header: '',
      className: 'w-32 text-right',
      render: (s: Socio) => (
        <button
          onClick={e => { e.stopPropagation(); navigate(`/socios/${s.$id}`) }}
          className="text-xs px-2.5 py-1 rounded-md bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 text-brand-600 dark:text-brand-400 transition-colors"
        >
          Gestionar
        </button>
      ),
    },
  ]

  const columnasConCuenta = [
    {
      key: 'socio',
      header: 'Socio',
      render: (s: Socio) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {s.apellidos}, {s.nombre}
        </span>
      ),
    },
    {
      key: 'user_id',
      header: 'User ID',
      render: (s: Socio) => (
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[200px] block">
          {s.user_id}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (s: Socio) => (
        <Badge label={s.activo ? 'Activo' : 'Baja'} variant={s.activo ? 'green' : 'gray'} dot />
      ),
    },
  ]

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de accesos</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Vinculación entre socios registrados y cuentas de usuario en Appwrite
        </p>
      </div>

      {/* Socios sin cuenta */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <UserX size={16} className="text-yellow-500" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            Socios activos sin cuenta vinculada
          </h3>
          <span className="text-sm text-gray-400 dark:text-gray-500">({sinCuenta.length})</span>
        </div>
        <Table
          columns={columnasSinCuenta}
          rows={sinCuenta}
          rowKey={s => s.$id}
          loading={isLoading}
          onRowClick={s => navigate(`/socios/${s.$id}`)}
          emptyState={
            <EmptyState
              icon={UserCheck}
              title="Todos los socios activos tienen cuenta vinculada"
            />
          }
        />
      </section>

      {/* Socios con cuenta */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck size={16} className="text-green-500" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            Socios con cuenta vinculada
          </h3>
          <span className="text-sm text-gray-400 dark:text-gray-500">({conCuenta.length})</span>
        </div>
        <Table
          columns={columnasConCuenta}
          rows={conCuenta}
          rowKey={s => s.$id}
          loading={isLoading}
          emptyState={<EmptyState icon={UserX} title="Ningún socio tiene cuenta vinculada aún" />}
        />
      </section>

      {/* Nota sobre datos server-side */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
          <ExternalLink size={14} />
          Usuarios pendientes de validación y cuentas huérfanas
        </h3>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Para ver usuarios registrados sin el label <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">socio</code>{' '}
          o usuarios con label <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">socio</code> sin registro asociado,
          usa el script de reporte del backend o la consola de Appwrite.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <a
            href="https://appwrite.civeira.net/console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <ExternalLink size={12} />
            Appwrite Console → Auth → Users
          </a>
          <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">
            node backend/scripts/user-report.mjs
          </code>
        </div>
      </section>
    </div>
  )
}
