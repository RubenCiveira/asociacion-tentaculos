import { useState, useMemo } from 'react'
import { Package } from 'lucide-react'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MaterialSocioForm } from '@/components/materiales/MaterialSocioForm'
import { useMaterialesSocio, useCreateMaterialSocio, useUpdateMaterialSocio, useDeleteMaterialSocio } from '@/hooks/useMaterialesSocio'
import { useSocios } from '@/hooks/useSocios'
import { TIPO_MATERIAL_LABELS } from '@/types'
import type { MaterialSocio } from '@/types'

const PAGE_SIZE = 25

export default function MaterialesSocioPage() {
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterPrestado, setFilterPrestado] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<MaterialSocio | null>(null)
  const [deleting, setDeleting] = useState<MaterialSocio | null>(null)

  const { data, isLoading } = useMaterialesSocio()
  const { data: sociosData } = useSocios()
  const createMutation = useCreateMaterialSocio()
  const updateMutation = useUpdateMaterialSocio()
  const deleteMutation = useDeleteMaterialSocio()

  const socioMap = useMemo(() => {
    const m = new Map<string, string>()
    sociosData?.documents.forEach(s => m.set(s.$id, `${s.apellidos}, ${s.nombre}`))
    return m
  }, [sociosData])

  const filtered = useMemo(() => {
    if (!data?.documents) return []
    return data.documents.filter(m => {
      const q = search.toLowerCase()
      const matchSearch = !q || m.nombre.toLowerCase().includes(q) ||
        socioMap.get(m.socio_id)?.toLowerCase().includes(q)
      const matchTipo = !filterTipo || m.tipo === filterTipo
      const matchPrestado = filterPrestado === '' ? true :
        filterPrestado === 'si' ? m.prestado_asociacion : !m.prestado_asociacion
      return matchSearch && matchTipo && matchPrestado
    })
  }, [data, search, filterTipo, filterPrestado, socioMap])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function resetPage() { setPage(1) }

  const columns = [
    {
      key: 'nombre',
      header: 'Material',
      render: (m: MaterialSocio) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{m.nombre}</p>
          {m.descripcion && <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">{m.descripcion}</p>}
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (m: MaterialSocio) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{TIPO_MATERIAL_LABELS[m.tipo]}</span>
      ),
    },
    {
      key: 'socio',
      header: 'Propietario',
      render: (m: MaterialSocio) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{socioMap.get(m.socio_id) ?? '—'}</span>
      ),
    },
    {
      key: 'prestado',
      header: 'Estado',
      render: (m: MaterialSocio) => m.prestado_asociacion
        ? <Badge label="Prestado a asociación" variant="blue" dot />
        : <Badge label="En poder del socio" variant="gray" />,
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-28',
      render: (m: MaterialSocio) => (
        <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditing(m)}
            className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
            Editar
          </button>
          <button onClick={() => setDeleting(m)}
            className="text-xs px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors">
            Eliminar
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Materiales de socios</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {data ? `${data.total} materiales registrados` : 'Cargando…'}
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Package size={16} />
          Añadir material
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <SearchBar value={search} onChange={v => { setSearch(v); resetPage() }}
          placeholder="Buscar por nombre o socio…" className="flex-1" />
        <select value={filterTipo} onChange={e => { setFilterTipo(e.target.value); resetPage() }}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_MATERIAL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={filterPrestado} onChange={e => { setFilterPrestado(e.target.value); resetPage() }}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="">Todos</option>
          <option value="si">Prestados</option>
          <option value="no">En poder del socio</option>
        </select>
      </div>

      <Table columns={columns} rows={paginated} rowKey={m => m.$id} loading={isLoading}
        emptyState={
          <EmptyState icon={Package} title="Sin materiales"
            description="Registra los juegos y materiales aportados por los socios"
            action={{ label: 'Añadir material', onClick: () => setCreating(true) }} />
        } />
      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />

      <Dialog open={creating} onClose={() => setCreating(false)} title="Añadir material" size="lg">
        <MaterialSocioForm
          onSubmit={data => createMutation.mutate(data, { onSuccess: () => setCreating(false) })}
          onCancel={() => setCreating(false)}
          loading={createMutation.isPending}
        />
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Editar material" size="lg">
        {editing && (
          <MaterialSocioForm
            initial={editing} isEdit
            onSubmit={data => updateMutation.mutate({ id: editing.$id, data }, { onSuccess: () => setEditing(null) })}
            onCancel={() => setEditing(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.$id, { onSuccess: () => setDeleting(null) })}
        title="Eliminar material"
        message={`¿Eliminar "${deleting?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar" danger loading={deleteMutation.isPending}
      />
    </div>
  )
}
