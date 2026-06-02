import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, Users, MapPin, CalendarPlus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MiniCalendario } from '@/components/eventos/MiniCalendario'
import { EventoForm } from '@/components/eventos/EventoForm'
import { useEventos, useCreateEvento, useUpdateEvento, useDeleteEvento } from '@/hooks/useEventos'
import { useLugares } from '@/hooks/useLugares'
import { TIPO_JUEGO_LABELS, ESTADO_EVENTO_LABELS } from '@/types'
import type { Evento, TipoJuego, EstadoEvento } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'

const ESTADO_VARIANT: Record<EstadoEvento, BadgeVariant> = {
  planificado: 'blue',
  confirmado: 'green',
  cancelado: 'red',
  realizado: 'gray',
}

export default function EventosPage() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [filterEstado, setFilterEstado] = useState<EstadoEvento | ''>('')
  const [filterTipo, setFilterTipo] = useState<TipoJuego | ''>('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Evento | null>(null)
  const [deleting, setDeleting] = useState<Evento | null>(null)

  const { data, isLoading } = useEventos()
  const { data: lugaresData } = useLugares()
  const createMutation = useCreateEvento()
  const updateMutation = useUpdateEvento()
  const deleteMutation = useDeleteEvento()

  const lugarMap = useMemo(() => {
    const m = new Map<string, string>()
    lugaresData?.documents.forEach(l => m.set(l.$id, l.nombre))
    return m
  }, [lugaresData])

  const filtered = useMemo(() => {
    if (!data?.documents) return []
    return data.documents.filter(e => {
      const matchEstado = !filterEstado || e.estado === filterEstado
      const matchTipo = !filterTipo || e.tipo_juego === filterTipo
      const matchDate = !selectedDate || isSameDay(parseISO(e.fecha_inicio), selectedDate)
      return matchEstado && matchTipo && matchDate
    })
  }, [data, filterEstado, filterTipo, selectedDate])

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Eventos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {data ? `${data.total} eventos registrados` : 'Cargando…'}
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
          <CalendarPlus size={16} />
          Nuevo evento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: calendario + filtros */}
        <div className="space-y-4">
          <MiniCalendario
            eventos={data?.documents ?? []}
            selectedDate={selectedDate}
            onSelectDate={d => setSelectedDate(prev => prev && isSameDay(prev, d) ? null : d)}
          />
          {selectedDate && (
            <button onClick={() => setSelectedDate(null)}
              className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline">
              Ver todos los eventos
            </button>
          )}
          <div className="space-y-2">
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value as EstadoEvento | '')}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">Todos los estados</option>
              {(Object.entries(ESTADO_EVENTO_LABELS) as [EstadoEvento, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as TipoJuego | '')}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">Todos los tipos</option>
              {(Object.entries(TIPO_JUEGO_LABELS) as [TipoJuego, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de eventos */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Sin eventos"
              description={selectedDate ? `No hay eventos el ${format(selectedDate, 'd MMMM', { locale: es })}` : 'Crea el primer evento de la asociación'}
              action={{ label: 'Nuevo evento', onClick: () => setCreating(true) }} />
          ) : (
            <div className="space-y-3">
              {filtered.map(evento => (
                <div key={evento.$id}
                  onClick={() => navigate(`/eventos/${evento.$id}`)}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 cursor-pointer hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{evento.titulo}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <CalendarDays size={12} />
                          {format(parseISO(evento.fecha_inicio), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                        </span>
                        {evento.lugar_id && lugarMap.get(evento.lugar_id) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MapPin size={12} />
                            {lugarMap.get(evento.lugar_id)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Users size={12} />
                          {evento.asistentes.length}
                          {evento.max_jugadores ? `/${evento.max_jugadores}` : ''} asistentes
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge label={ESTADO_EVENTO_LABELS[evento.estado]} variant={ESTADO_VARIANT[evento.estado]} dot />
                      <Badge label={TIPO_JUEGO_LABELS[evento.tipo_juego]} variant="purple" />
                    </div>
                  </div>
                  {evento.descripcion && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">{evento.descripcion}</p>
                  )}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditing(evento)}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                      Editar
                    </button>
                    <button onClick={() => setDeleting(evento)}
                      className="text-xs px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={creating} onClose={() => setCreating(false)} title="Nuevo evento" size="xl">
        <EventoForm
          onSubmit={data => createMutation.mutate(
            { ...data, fecha_fin: data.fecha_fin || undefined, lugar_id: data.lugar_id || undefined } as Parameters<typeof createMutation.mutate>[0],
            { onSuccess: () => setCreating(false) },
          )}
          onCancel={() => setCreating(false)} loading={createMutation.isPending} />
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Editar evento" size="xl">
        {editing && (
          <EventoForm initial={editing} isEdit
            onSubmit={data => updateMutation.mutate({ id: editing.$id, data }, { onSuccess: () => setEditing(null) })}
            onCancel={() => setEditing(null)} loading={updateMutation.isPending} />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.$id, { onSuccess: () => setDeleting(null) })}
        title="Eliminar evento"
        message={`¿Eliminar "${deleting?.titulo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar" danger loading={deleteMutation.isPending} />
    </div>
  )
}
