import { useNavigate } from 'react-router-dom'
import { format, parseISO, isFuture } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users, Package, Archive, CalendarDays, Megaphone, MapPin, AlertTriangle } from 'lucide-react'
import { useSocios } from '@/hooks/useSocios'
import { useMaterialesAsociacion } from '@/hooks/useMaterialesAsociacion'
import { useEventos } from '@/hooks/useEventos'
import { usePublicaciones } from '@/hooks/usePublicaciones'
import { TIPO_JUEGO_LABELS, ESTADO_EVENTO_LABELS } from '@/types'
import { Badge } from '@/components/ui/Badge'
import type { EstadoEvento } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'

const ESTADO_VARIANT: Record<EstadoEvento, BadgeVariant> = {
  planificado: 'blue',
  confirmado: 'green',
  cancelado: 'red',
  realizado: 'gray',
}

function StatCard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: typeof Users
  label: string
  value: string | number
  sub?: string
  color: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 text-left w-full hover:border-brand-200 hover:shadow-sm transition-all"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </button>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: sociosData } = useSocios({ soloActivos: true })
  const { data: materialesData } = useMaterialesAsociacion()
  const { data: eventosData } = useEventos()
  const { data: publicacionesData } = usePublicaciones()

  const sociosActivos = sociosData?.total ?? 0

  const materialesTotal = materialesData?.total ?? 0
  const materialesProblema = (materialesData?.documents ?? []).filter(
    m => m.estado === 'deteriorado' || m.estado === 'perdido',
  ).length

  const ahora = new Date()
  const proximosEventos = (eventosData?.documents ?? [])
    .filter(e => isFuture(parseISO(e.fecha_inicio)) && e.estado !== 'cancelado')
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
  const proximoEvento = proximosEventos[0]

  const publicacionesListas = (publicacionesData?.documents ?? []).filter(
    p => p.estado === 'listo',
  ).length

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Panel de gestión</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(ahora, "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={Users} label="Socios activos" value={sociosActivos}
          color="bg-brand-50 text-brand-600"
          onClick={() => navigate('/socios')}
        />
        <StatCard
          icon={Archive} label="Materiales de la asociación" value={materialesTotal}
          sub={materialesProblema > 0 ? `${materialesProblema} con incidencias` : 'Todo en orden'}
          color={materialesProblema > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}
          onClick={() => navigate('/materiales/asociacion')}
        />
        <StatCard
          icon={CalendarDays} label="Próximos eventos" value={proximosEventos.length}
          color="bg-purple-50 text-purple-600"
          onClick={() => navigate('/eventos')}
        />
        <StatCard
          icon={Megaphone} label="Publicaciones listas" value={publicacionesListas}
          sub={publicacionesListas > 0 ? 'Pendientes de publicar' : 'Sin contenido pendiente'}
          color={publicacionesListas > 0 ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'}
          onClick={() => navigate('/publicaciones')}
        />
      </div>

      {/* Próximo evento */}
      {proximoEvento && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <CalendarDays size={14} />
            Próximo evento
          </h3>
          <div
            onClick={() => navigate(`/eventos/${proximoEvento.$id}`)}
            className="cursor-pointer hover:bg-gray-50 rounded-lg p-3 -mx-3 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-800">{proximoEvento.titulo}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  {format(parseISO(proximoEvento.fecha_inicio), "EEEE d MMM 'a las' HH:mm", { locale: es })}
                </p>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <Users size={13} />
                  {proximoEvento.asistentes.length} asistentes confirmados
                  {proximoEvento.max_jugadores ? ` de ${proximoEvento.max_jugadores}` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge label={ESTADO_EVENTO_LABELS[proximoEvento.estado]}
                  variant={ESTADO_VARIANT[proximoEvento.estado]} dot />
                <Badge label={TIPO_JUEGO_LABELS[proximoEvento.tipo_juego]} variant="purple" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertas */}
      {materialesProblema > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">
              {materialesProblema} material{materialesProblema > 1 ? 'es' : ''} con incidencias
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Hay materiales marcados como deteriorados o perdidos en el inventario de la asociación.
            </p>
            <button
              onClick={() => navigate('/materiales/asociacion')}
              className="text-xs text-red-700 font-medium underline mt-1"
            >
              Revisar inventario →
            </button>
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Accesos rápidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Socios', to: '/socios', color: 'text-brand-600' },
            { icon: Package, label: 'Mat. socios', to: '/materiales/socios', color: 'text-indigo-600' },
            { icon: Archive, label: 'Mat. asociación', to: '/materiales/asociacion', color: 'text-emerald-600' },
            { icon: MapPin, label: 'Lugares', to: '/lugares', color: 'text-orange-600' },
            { icon: CalendarDays, label: 'Eventos', to: '/eventos', color: 'text-purple-600' },
            { icon: Megaphone, label: 'Publicaciones', to: '/publicaciones', color: 'text-pink-600' },
          ].map(({ icon: Icon, label, to, color }) => (
            <button key={to} onClick={() => navigate(to)}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-brand-200 hover:shadow-sm transition-all text-left">
              <Icon size={18} className={color} />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
