import { useState, useMemo } from 'react'
import { MapPin, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchBar } from '@/components/ui/SearchBar'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LugarForm } from '@/components/lugares/LugarForm'
import { useLugares, useCreateLugar, useUpdateLugar, useDeleteLugar } from '@/hooks/useLugares'
import { TIPO_LUGAR_LABELS } from '@/types'
import type { Lugar } from '@/types'

export default function LugaresPage() {
  const [search, setSearch] = useState('')
  const [filterActivo, setFilterActivo] = useState<'todos' | 'activos' | 'inactivos'>('activos')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Lugar | null>(null)
  const [deleting, setDeleting] = useState<Lugar | null>(null)

  const soloActivos = filterActivo === 'activos' ? true : filterActivo === 'inactivos' ? false : undefined
  const { data, isLoading } = useLugares({ soloActivos })
  const createMutation = useCreateLugar()
  const updateMutation = useUpdateLugar()
  const deleteMutation = useDeleteLugar()

  const filtered = useMemo(() => {
    if (!data?.documents) return []
    const q = search.toLowerCase()
    if (!q) return data.documents
    return data.documents.filter(l =>
      l.nombre.toLowerCase().includes(q) || l.direccion?.toLowerCase().includes(q),
    )
  }, [data, search])

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Lugares</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {data ? `${data.total} lugares registrados` : 'Cargando…'}
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
          <MapPin size={16} />
          Nuevo lugar
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o dirección…" className="flex-1" />
        <select value={filterActivo}
          onChange={e => setFilterActivo(e.target.value as typeof filterActivo)}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MapPin} title="Sin lugares"
          description="Registra los espacios donde se reúne la asociación"
          action={{ label: 'Nuevo lugar', onClick: () => setCreating(true) }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(lugar => (
            <div key={lugar.$id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{lugar.nombre}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{TIPO_LUGAR_LABELS[lugar.tipo]}</p>
                </div>
                <Badge label={lugar.activo ? 'Activo' : 'Inactivo'}
                  variant={lugar.activo ? 'green' : 'gray'} dot />
              </div>

              {lugar.direccion && (
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                  <MapPin size={13} className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                  {lugar.direccion}
                </p>
              )}

              {lugar.capacidad && (
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Users size={13} className="text-gray-400 dark:text-gray-500" />
                  Hasta {lugar.capacidad} personas
                </p>
              )}

              {lugar.notas && (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">{lugar.notas}</p>
              )}

              <div className="flex gap-2 pt-1 border-t border-gray-50 dark:border-gray-800 mt-auto">
                <button onClick={() => setEditing(lugar)}
                  className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                  Editar
                </button>
                <button onClick={() => setDeleting(lugar)}
                  className="text-xs px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="Nuevo lugar" size="md">
        <LugarForm
          onSubmit={data => createMutation.mutate(data as Parameters<typeof createMutation.mutate>[0], { onSuccess: () => setCreating(false) })}
          onCancel={() => setCreating(false)} loading={createMutation.isPending} />
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Editar lugar" size="md">
        {editing && (
          <LugarForm initial={editing} isEdit
            onSubmit={data => updateMutation.mutate({ id: editing.$id, data }, { onSuccess: () => setEditing(null) })}
            onCancel={() => setEditing(null)} loading={updateMutation.isPending} />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.$id, { onSuccess: () => setDeleting(null) })}
        title="Eliminar lugar"
        message={`¿Eliminar "${deleting?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar" danger loading={deleteMutation.isPending} />
    </div>
  )
}
