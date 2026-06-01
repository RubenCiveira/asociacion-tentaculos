import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Megaphone, LayoutGrid, List } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchBar } from '@/components/ui/SearchBar'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PublicacionForm } from '@/components/publicaciones/PublicacionForm'
import { usePublicaciones, useCreatePublicacion, useUpdatePublicacion, useDeletePublicacion } from '@/hooks/usePublicaciones'
import { RED_SOCIAL_LABELS, ESTADO_PUBLICACION_LABELS } from '@/types'
import type { Publicacion, EstadoPublicacion, RedSocial } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'

const ESTADO_VARIANT: Record<EstadoPublicacion, BadgeVariant> = {
  borrador: 'gray',
  listo: 'yellow',
  publicado: 'green',
}

const ESTADOS: EstadoPublicacion[] = ['borrador', 'listo', 'publicado']

function PublicacionCard({ pub, onEdit, onDelete }: {
  pub: Publicacion
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-gray-800 text-sm leading-snug">{pub.titulo}</p>
        <Badge label={ESTADO_PUBLICACION_LABELS[pub.estado]} variant={ESTADO_VARIANT[pub.estado]} dot />
      </div>
      <p className="text-xs text-gray-500 line-clamp-3">{pub.contenido}</p>
      <div className="flex flex-wrap gap-1">
        {pub.redes.map(red => (
          <span key={red} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
            {RED_SOCIAL_LABELS[red as RedSocial]}
          </span>
        ))}
      </div>
      {pub.fecha_publicacion && (
        <p className="text-xs text-gray-400">
          {format(parseISO(pub.fecha_publicacion), 'd MMM yyyy', { locale: es })}
        </p>
      )}
      <div className="flex gap-2 pt-2 border-t border-gray-50">
        <button onClick={onEdit}
          className="text-xs px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
          Editar
        </button>
        <button onClick={onDelete}
          className="text-xs px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default function PublicacionesPage() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'kanban' | 'lista'>('kanban')
  const [filterRed, setFilterRed] = useState<RedSocial | ''>('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Publicacion | null>(null)
  const [deleting, setDeleting] = useState<Publicacion | null>(null)

  const { data, isLoading } = usePublicaciones()
  const createMutation = useCreatePublicacion()
  const updateMutation = useUpdatePublicacion()
  const deleteMutation = useDeletePublicacion()

  const filtered = useMemo(() => {
    if (!data?.documents) return []
    return data.documents.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.titulo.toLowerCase().includes(q) || p.contenido.toLowerCase().includes(q)
      const matchRed = !filterRed || p.redes.includes(filterRed)
      return matchSearch && matchRed
    })
  }, [data, search, filterRed])

  const byEstado = useMemo(() => {
    const m: Record<EstadoPublicacion, Publicacion[]> = { borrador: [], listo: [], publicado: [] }
    filtered.forEach(p => m[p.estado].push(p))
    return m
  }, [filtered])

  function handleCreate(formData: Parameters<typeof createMutation.mutate>[0]) {
    createMutation.mutate(formData, { onSuccess: () => setCreating(false) })
  }

  function handleUpdate(formData: Partial<Parameters<typeof createMutation.mutate>[0]>) {
    if (editing) updateMutation.mutate({ id: editing.$id, data: formData }, { onSuccess: () => setEditing(null) })
  }

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Publicaciones</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.total} publicaciones` : 'Cargando…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('lista')}
              className={`p-1.5 rounded-md transition-colors ${view === 'lista' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400'}`}>
              <List size={16} />
            </button>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Megaphone size={16} />
            Nueva publicación
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por título o contenido…" className="flex-1" />
        <select value={filterRed} onChange={e => setFilterRed(e.target.value as RedSocial | '')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="">Todas las redes</option>
          {(Object.entries(RED_SOCIAL_LABELS) as [RedSocial, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="Sin publicaciones"
          description="Crea publicaciones para preparar el contenido de las redes sociales"
          action={{ label: 'Nueva publicación', onClick: () => setCreating(true) }} />
      ) : view === 'kanban' ? (
        /* Kanban */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ESTADOS.map(estado => (
            <div key={estado}>
              <div className="flex items-center gap-2 mb-3">
                <Badge label={ESTADO_PUBLICACION_LABELS[estado]} variant={ESTADO_VARIANT[estado]} dot />
                <span className="text-sm text-gray-400 font-medium">{byEstado[estado].length}</span>
              </div>
              <div className="space-y-3">
                {byEstado[estado].length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-100 h-24 flex items-center justify-center text-xs text-gray-400">
                    Vacío
                  </div>
                ) : (
                  byEstado[estado].map(p => (
                    <PublicacionCard key={p.$id} pub={p}
                      onEdit={() => setEditing(p)}
                      onDelete={() => setDeleting(p)} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Lista */
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.$id}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <Badge label={ESTADO_PUBLICACION_LABELS[p.estado]} variant={ESTADO_VARIANT[p.estado]} dot />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm">{p.titulo}</p>
                <p className="text-xs text-gray-400 truncate">{p.contenido}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {p.redes.map(red => (
                  <span key={red} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {RED_SOCIAL_LABELS[red as RedSocial]}
                  </span>
                ))}
              </div>
              {p.fecha_publicacion && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {format(parseISO(p.fecha_publicacion), 'd MMM', { locale: es })}
                </span>
              )}
              <div className="flex gap-2">
                <button onClick={() => setEditing(p)}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                  Editar
                </button>
                <button onClick={() => setDeleting(p)}
                  className="text-xs px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="Nueva publicación" size="xl">
        <PublicacionForm
          onSubmit={data => handleCreate(data as Parameters<typeof createMutation.mutate>[0])}
          onCancel={() => setCreating(false)} loading={createMutation.isPending} />
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Editar publicación" size="xl">
        {editing && (
          <PublicacionForm initial={editing} isEdit
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)} loading={updateMutation.isPending} />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.$id, { onSuccess: () => setDeleting(null) })}
        title="Eliminar publicación"
        message={`¿Eliminar "${deleting?.titulo}"?`}
        confirmLabel="Eliminar" danger loading={deleteMutation.isPending} />
    </div>
  )
}
