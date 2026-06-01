import { useState, useMemo } from 'react'
import { Archive, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MaterialAsociacionForm } from '@/components/materiales/MaterialAsociacionForm'
import { useMaterialesAsociacion, useCreateMaterialAsociacion, useUpdateMaterialAsociacion, useDeleteMaterialAsociacion } from '@/hooks/useMaterialesAsociacion'
import { useSocios } from '@/hooks/useSocios'
import { TIPO_MATERIAL_LABELS, ESTADO_MATERIAL_LABELS } from '@/types'
import type { MaterialAsociacion, EstadoMaterial } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'

const ESTADO_VARIANT: Record<EstadoMaterial, BadgeVariant> = {
  bueno: 'green',
  deteriorado: 'yellow',
  perdido: 'red',
}

const PAGE_SIZE = 25

export default function MaterialesAsociacionPage() {
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<MaterialAsociacion | null>(null)
  const [deleting, setDeleting] = useState<MaterialAsociacion | null>(null)

  const { data, isLoading } = useMaterialesAsociacion()
  const { data: sociosData } = useSocios()
  const createMutation = useCreateMaterialAsociacion()
  const updateMutation = useUpdateMaterialAsociacion()
  const deleteMutation = useDeleteMaterialAsociacion()

  const socioMap = useMemo(() => {
    const m = new Map<string, string>()
    sociosData?.documents.forEach(s => m.set(s.$id, `${s.apellidos}, ${s.nombre}`))
    return m
  }, [sociosData])

  const filtered = useMemo(() => {
    if (!data?.documents) return []
    return data.documents.filter(m => {
      const q = search.toLowerCase()
      const matchSearch = !q || m.nombre.toLowerCase().includes(q) || m.ubicacion?.toLowerCase().includes(q)
      const matchTipo = !filterTipo || m.tipo === filterTipo
      const matchEstado = !filterEstado || m.estado === filterEstado
      return matchSearch && matchTipo && matchEstado
    })
  }, [data, search, filterTipo, filterEstado])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const perdidos = data?.documents.filter(m => m.estado === 'perdido').length ?? 0

  const columns = [
    {
      key: 'nombre',
      header: 'Material',
      render: (m: MaterialAsociacion) => (
        <div>
          <p className="font-medium text-gray-800">{m.nombre}</p>
          {m.ubicacion && <p className="text-xs text-gray-400">{m.ubicacion}</p>}
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (m: MaterialAsociacion) => <span className="text-sm text-gray-600">{TIPO_MATERIAL_LABELS[m.tipo]}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (m: MaterialAsociacion) => (
        <Badge label={ESTADO_MATERIAL_LABELS[m.estado]} variant={ESTADO_VARIANT[m.estado]} dot />
      ),
    },
    {
      key: 'donado',
      header: 'Aportado por',
      render: (m: MaterialAsociacion) => (
        <span className="text-sm text-gray-600">
          {m.donado_por ? socioMap.get(m.donado_por) ?? '—' : '—'}
        </span>
      ),
    },
    {
      key: 'fecha',
      header: 'Adquisición',
      render: (m: MaterialAsociacion) => (
        <span className="text-sm text-gray-600">
          {m.fecha_adquisicion ? format(parseISO(m.fecha_adquisicion), 'd MMM yyyy', { locale: es }) : '—'}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-28',
      render: (m: MaterialAsociacion) => (
        <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditing(m)}
            className="text-xs px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
            Editar
          </button>
          <button onClick={() => setDeleting(m)}
            className="text-xs px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
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
          <h2 className="text-2xl font-bold text-gray-800">Materiales de la asociación</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.total} materiales registrados` : 'Cargando…'}
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Archive size={16} />
          Añadir material
        </button>
      </div>

      {perdidos > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {perdidos} material{perdidos > 1 ? 'es' : ''} marcado{perdidos > 1 ? 's' : ''} como perdido{perdidos > 1 ? 's' : ''}
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }}
          placeholder="Buscar por nombre o ubicación…" className="flex-1" />
        <select value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_MATERIAL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_MATERIAL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <Table columns={columns} rows={paginated} rowKey={m => m.$id} loading={isLoading}
        emptyState={
          <EmptyState icon={Archive} title="Sin materiales"
            description="Registra los juegos y materiales propiedad de la asociación"
            action={{ label: 'Añadir material', onClick: () => setCreating(true) }} />
        } />
      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />

      <Dialog open={creating} onClose={() => setCreating(false)} title="Añadir material" size="lg">
        <MaterialAsociacionForm
          onSubmit={data => createMutation.mutate(data as Parameters<typeof createMutation.mutate>[0], { onSuccess: () => setCreating(false) })}
          onCancel={() => setCreating(false)} loading={createMutation.isPending} />
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Editar material" size="lg">
        {editing && (
          <MaterialAsociacionForm initial={editing} isEdit
            onSubmit={data => updateMutation.mutate({ id: editing.$id, data }, { onSuccess: () => setEditing(null) })}
            onCancel={() => setEditing(null)} loading={updateMutation.isPending} />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.$id, { onSuccess: () => setDeleting(null) })}
        title="Eliminar material"
        message={`¿Eliminar "${deleting?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar" danger loading={deleteMutation.isPending} />
    </div>
  )
}
