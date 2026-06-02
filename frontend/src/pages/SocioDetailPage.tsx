import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Pencil, Package, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { SocioForm } from '@/components/socios/SocioForm'
import { CuentaAcceso } from '@/components/socios/CuentaAcceso'
import { useSocio, useUpdateSocio } from '@/hooks/useSocios'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/lib/roles'
import { useMaterialesSocio } from '@/hooks/useMaterialesSocio'
import { useEventos } from '@/hooks/useEventos'
import { useParticipacionesSocio } from '@/hooks/useParticipaciones'
import { TIPO_MATERIAL_LABELS, TIPO_JUEGO_LABELS, ESTADO_EVENTO_LABELS } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'
import type { EstadoEvento } from '@/types'

const ESTADO_EVENTO_VARIANT: Record<EstadoEvento, BadgeVariant> = {
  planificado: 'blue',
  confirmado: 'green',
  cancelado: 'red',
  realizado: 'gray',
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-800 dark:text-gray-100 mt-0.5">{value}</dd>
    </div>
  )
}



export default function SocioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)

  const { user } = useAuth()
  const admin = isAdmin(user)
  const { data: socio, isLoading } = useSocio(id!)
  const { data: materialesData } = useMaterialesSocio({ socioId: id })
  const { data: eventosData } = useEventos()
  const { data: participaciones } = useParticipacionesSocio(id)
  const updateMutation = useUpdateSocio()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!socio) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-gray-500">
        <p>Socio no encontrado.</p>
        <button onClick={() => navigate('/socios')} className="mt-3 text-sm text-brand-600 hover:underline">
          Volver al listado
        </button>
      </div>
    )
  }

  const edad = differenceInYears(new Date(), parseISO(socio.fecha_nacimiento))
  const materiales = materialesData?.documents ?? []
  const eventoIds = new Set((participaciones ?? []).map(p => p.evento_id))
  const eventosDelSocio = (eventosData?.documents ?? []).filter(e => eventoIds.has(e.$id))

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/socios')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ArrowLeft size={15} />
        Socios
      </button>

      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-bold">
            {socio.nombre[0]}{socio.apellidos[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{socio.nombre} {socio.apellidos}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge label={socio.activo ? 'Activo' : 'Baja'} variant={socio.activo ? 'green' : 'gray'} dot />
              <span className="text-sm text-gray-400 dark:text-gray-500">{edad} años</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Pencil size={14} />
          Editar
        </button>
      </div>

      {/* Datos */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Datos del socio</h3>
        <dl className="grid grid-cols-2 gap-4">
          <InfoRow label="Fecha de nacimiento"
            value={format(parseISO(socio.fecha_nacimiento), 'd MMMM yyyy', { locale: es })} />
          <InfoRow label="Alta en la asociación"
            value={format(parseISO(socio.fecha_alta), 'd MMMM yyyy', { locale: es })} />
          <InfoRow label="Email" value={socio.email} />
          <InfoRow label="Teléfono" value={socio.telefono} />
          {socio.notas && (
            <div className="col-span-2">
              <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Notas</dt>
              <dd className="text-sm text-gray-800 dark:text-gray-100 mt-0.5 whitespace-pre-line">{socio.notas}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Materiales */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <Package size={14} />
            Materiales aportados
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{materiales.length} ítem{materiales.length !== 1 ? 's' : ''}</span>
        </div>
        {materiales.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin materiales registrados</p>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {materiales.map(m => (
              <li key={m.$id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{m.nombre}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{TIPO_MATERIAL_LABELS[m.tipo]}</p>
                </div>
                {m.prestado_asociacion && (
                  <Badge label="Prestado a asociación" variant="blue" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Eventos */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <CalendarDays size={14} />
            Eventos
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{eventosDelSocio.length} evento{eventosDelSocio.length !== 1 ? 's' : ''}</span>
        </div>
        {eventosDelSocio.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin eventos registrados</p>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {eventosDelSocio.slice(0, 10).map(e => (
              <li key={e.$id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{e.titulo}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {format(parseISO(e.fecha_inicio), 'd MMM yyyy', { locale: es })} · {TIPO_JUEGO_LABELS[e.tipo_juego]}
                  </p>
                </div>
                <Badge label={ESTADO_EVENTO_LABELS[e.estado]} variant={ESTADO_EVENTO_VARIANT[e.estado]} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cuenta de acceso — solo admins */}
      {admin && <CuentaAcceso socio={socio} />}

      {/* Modal editar */}
      <Dialog open={editing} onClose={() => setEditing(false)} title="Editar socio" size="lg">
        <SocioForm
          initial={socio}
          isEdit
          onSubmit={data => {
            updateMutation.mutate(
              { id: socio.$id, data },
              { onSuccess: () => setEditing(false) },
            )
          }}
          onCancel={() => setEditing(false)}
          loading={updateMutation.isPending}
        />
      </Dialog>
    </div>
  )
}
