import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { UserPlus, Users } from 'lucide-react'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SocioForm } from '@/components/socios/SocioForm'
import { useSocios, useCreateSocio, useUpdateSocio, useDeleteSocio } from '@/hooks/useSocios'
import type { Socio } from '@/types'

const PAGE_SIZE = 25

export default function SociosPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterActivo, setFilterActivo] = useState<'todos' | 'activos' | 'baja'>('activos')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Socio | null>(null)
  const [deleting, setDeleting] = useState<Socio | null>(null)

  const soloActivos = filterActivo === 'activos' ? true : filterActivo === 'baja' ? false : undefined
  const { data, isLoading } = useSocios({ soloActivos })
  const createMutation = useCreateSocio()
  const updateMutation = useUpdateSocio()
  const deleteMutation = useDeleteSocio()

  const filtered = useMemo(() => {
    if (!data?.documents) return []
    const q = search.toLowerCase()
    if (!q) return data.documents
    return data.documents.filter(s =>
      s.nombre.toLowerCase().includes(q) ||
      s.apellidos.toLowerCase().includes(q) ||
      (s.email?.toLowerCase().includes(q) ?? false),
    )
  }, [data, search])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function onSearchChange(v: string) { setSearch(v); setPage(1) }
  function onFilterChange(v: typeof filterActivo) { setFilterActivo(v); setPage(1) }

  const columns = [
    {
      key: 'nombre',
      header: 'Socio',
      render: (s: Socio) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{s.apellidos}, {s.nombre}</p>
          {s.email && <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>}
        </div>
      ),
    },
    {
      key: 'fnac',
      header: 'F. nacimiento',
      render: (s: Socio) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(parseISO(s.fecha_nacimiento), 'd MMM yyyy', { locale: es })}
        </span>
      ),
    },
    {
      key: 'alta',
      header: 'Alta',
      render: (s: Socio) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(parseISO(s.fecha_alta), 'd MMM yyyy', { locale: es })}
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
    {
      key: 'acciones',
      header: '',
      className: 'w-28',
      render: (s: Socio) => (
        <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setEditing(s)}
            className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => setDeleting(s)}
            className="text-xs px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Socios</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {data ? `${data.total} registros totales` : 'Cargando…'}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus size={16} />
          Nuevo socio
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar por nombre, apellidos o email…"
          className="flex-1"
        />
        <select
          value={filterActivo}
          onChange={e => onFilterChange(e.target.value as typeof filterActivo)}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="activos">Solo activos</option>
          <option value="baja">Solo bajas</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        rows={paginated}
        rowKey={s => s.$id}
        loading={isLoading}
        onRowClick={s => navigate(`/socios/${s.$id}`)}
        emptyState={
          <EmptyState
            icon={Users}
            title="No hay socios"
            description={search ? 'No hay resultados para esa búsqueda' : 'Añade el primer socio de la asociación'}
            action={!search ? { label: 'Nuevo socio', onClick: () => setCreating(true) } : undefined}
          />
        }
      />
      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />

      {/* Modal crear */}
      <Dialog open={creating} onClose={() => setCreating(false)} title="Nuevo socio" size="lg">
        <SocioForm
          onSubmit={data => {
            createMutation.mutate(
              { ...data, fecha_alta: new Date().toISOString() },
              { onSuccess: () => setCreating(false) },
            )
          }}
          onCancel={() => setCreating(false)}
          loading={createMutation.isPending}
        />
      </Dialog>

      {/* Modal editar */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Editar socio" size="lg">
        {editing && (
          <SocioForm
            initial={editing}
            isEdit
            onSubmit={data => {
              updateMutation.mutate(
                { id: editing.$id, data },
                { onSuccess: () => setEditing(null) },
              )
            }}
            onCancel={() => setEditing(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Dialog>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.$id, { onSuccess: () => setDeleting(null) })
        }}
        title="Eliminar socio"
        message={`¿Seguro que quieres eliminar a ${deleting?.nombre} ${deleting?.apellidos}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
