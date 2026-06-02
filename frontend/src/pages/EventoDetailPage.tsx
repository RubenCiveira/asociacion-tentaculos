import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Pencil, MapPin, Users, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { EventoForm } from '@/components/eventos/EventoForm'
import { useEvento, useUpdateEvento } from '@/hooks/useEventos'
import { useLugares } from '@/hooks/useLugares'
import { useParticipacionesEvento } from '@/hooks/useParticipaciones'
import { useAuth } from '@/contexts/AuthContext'
import { canWriteEventos } from '@/lib/roles'
import { TIPO_JUEGO_LABELS, ESTADO_EVENTO_LABELS } from '@/types'
import type { EstadoEvento } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'

const ESTADO_VARIANT: Record<EstadoEvento, BadgeVariant> = {
  planificado: 'blue',
  confirmado: 'green',
  cancelado: 'red',
  realizado: 'gray',
}

export default function EventoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)

  const { user } = useAuth()
  const canWrite = canWriteEventos(user)
  const { data: evento, isLoading } = useEvento(id!)
  const { data: lugaresData } = useLugares()
  const { data: participacionesData } = useParticipacionesEvento(id!)
  const updateMutation = useUpdateEvento()

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )

  if (!evento) return (
    <div className="text-center py-20 text-gray-400 dark:text-gray-500">
      <p>Evento no encontrado.</p>
      <button onClick={() => navigate('/eventos')} className="mt-3 text-sm text-brand-600 hover:underline">
        Volver al calendario
      </button>
    </div>
  )

  const lugar = lugaresData?.documents.find(l => l.$id === evento.lugar_id)
  const participaciones = participacionesData?.documents ?? []

  const duracion = evento.fecha_fin
    ? differenceInMinutes(parseISO(evento.fecha_fin), parseISO(evento.fecha_inicio))
    : null

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => navigate('/eventos')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
        <ArrowLeft size={15} />
        Eventos
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge label={TIPO_JUEGO_LABELS[evento.tipo_juego]} variant="purple" />
            <Badge label={ESTADO_EVENTO_LABELS[evento.estado]} variant={ESTADO_VARIANT[evento.estado]} dot />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{evento.titulo}</h2>
        </div>
        {canWrite && <button onClick={() => setEditing(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <Pencil size={14} />
          Editar
        </button>}
      </div>

      {/* Info principal */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Clock size={15} className="text-gray-400 dark:text-gray-500" />
          <span>
            {format(parseISO(evento.fecha_inicio), "EEEE d MMMM yyyy 'a las' HH:mm", { locale: es })}
            {duracion && ` · ${Math.floor(duracion / 60)}h${duracion % 60 > 0 ? ` ${duracion % 60}min` : ''}`}
          </span>
        </div>
        {lugar && (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <MapPin size={15} className="text-gray-400 dark:text-gray-500" />
            <span>{lugar.nombre}{lugar.direccion && ` — ${lugar.direccion}`}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Users size={15} className="text-gray-400 dark:text-gray-500" />
          <span>
            {participaciones.length} asistente{participaciones.length !== 1 ? 's' : ''}
            {evento.max_jugadores ? ` de ${evento.max_jugadores} máximo` : ''}
          </span>
        </div>
        {evento.descripcion && (
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line pt-2 border-t border-gray-50 dark:border-gray-800">
            {evento.descripcion}
          </p>
        )}
      </div>

      {/* Asistentes */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Users size={14} />
          Asistentes confirmados
        </h3>
        {participaciones.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin asistentes registrados</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {participaciones.map(p => {
              const nombre = p.nombre_display ?? 'Usuario sin socio'
              return (
                <div key={p.$id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full">
                  <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                    {nombre[0]}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{nombre}</span>
                  {p.estado === 'rechazado' && (
                    <span className="text-xs text-red-400">(rechazado)</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {evento.notas && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Notas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{evento.notas}</p>
        </div>
      )}

      <Dialog open={editing} onClose={() => setEditing(false)} title="Editar evento" size="xl">
        <EventoForm initial={evento} isEdit
          onSubmit={data => updateMutation.mutate({ id: evento.$id, data }, { onSuccess: () => setEditing(false) })}
          onCancel={() => setEditing(false)} loading={updateMutation.isPending} />
      </Dialog>
    </div>
  )
}
