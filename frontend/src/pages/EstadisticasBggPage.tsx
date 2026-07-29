import { useMemo, useState } from 'react'
import { Dices, RefreshCw, Link2, Unlink, ExternalLink, Trophy, Users, BarChart3 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import {
  useBggPerfil, useBggPerfiles, useBggPartidas,
  useVincularBgg, useSincronizarBgg, useCambiarPrivacidadBgg, useDesvincularBgg,
} from '@/hooks/useBgg'
import { bggUrl } from '@/types'
import type { BggPartida } from '@/types'

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 ${className}`}>
      {children}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Dices; label: string; value: string | number }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{value}</p>
      </div>
    </Card>
  )
}

export default function EstadisticasBggPage() {
  const { user } = useAuth()
  const [username, setUsername] = useState('')
  const [confirmDesvincular, setConfirmDesvincular] = useState(false)

  const { data: perfil, isLoading: loadingPerfil } = useBggPerfil()
  const { data: perfiles } = useBggPerfiles()
  const { data: partidas, isLoading: loadingPartidas } = useBggPartidas()

  const vincular = useVincularBgg()
  const sincronizar = useSincronizarBgg()
  const privacidad = useCambiarPrivacidadBgg()
  const desvincular = useDesvincularBgg()

  const misPartidas = useMemo(
    () => (partidas ?? []).filter(p => p.user_id === user?.$id),
    [partidas, user],
  )

  // Estadísticas de la asociación: solo partidas de quienes publican
  const publicadores = useMemo(
    () => new Set((perfiles?.documents ?? []).filter(p => p.publicar_stats).map(p => p.user_id)),
    [perfiles],
  )
  const partidasPublicas = useMemo(
    () => (partidas ?? []).filter(p => publicadores.has(p.user_id)),
    [partidas, publicadores],
  )

  const topJuegos = useMemo(() => {
    const acc = new Map<number, { nombre: string; partidas: number; veces: number }>()
    for (const p of partidasPublicas) {
      const cur = acc.get(p.bgg_game_id) ?? { nombre: p.juego_nombre, partidas: 0, veces: 0 }
      cur.partidas += 1
      cur.veces += p.cantidad ?? 1
      acc.set(p.bgg_game_id, cur)
    }
    return [...acc.entries()]
      .map(([bgg_game_id, v]) => ({ bgg_game_id, ...v }))
      .sort((a, b) => b.veces - a.veces)
      .slice(0, 10)
  }, [partidasPublicas])

  function handleVincular(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    vincular.mutate(username.trim(), {
      onSuccess: () => {
        setUsername('')
        sincronizar.mutate()
      },
    })
  }

  if (loadingPerfil) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Estadísticas de juego</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Partidas registradas en BoardGameGeek por los socios
        </p>
      </div>

      {/* Mi cuenta BGG */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Dices size={16} className="text-brand-600 dark:text-brand-400" />
          Mi cuenta de BoardGameGeek
        </h3>

        {!perfil ? (
          <form onSubmit={handleVincular} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario en boardgamegeek.com"
              />
            </div>
            <button type="submit" disabled={vincular.isPending || !username.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              <Link2 size={15} />
              {vincular.isPending ? 'Vinculando…' : 'Vincular cuenta'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <a href={`https://boardgamegeek.com/user/${encodeURIComponent(perfil.bgg_username)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 font-medium text-brand-600 dark:text-brand-400 hover:underline">
                {perfil.bgg_username}
                <ExternalLink size={12} />
              </a>
              <span className="text-gray-500 dark:text-gray-400">
                {perfil.partidas_count ?? 0} partidas
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {perfil.fecha_ultima_sync
                  ? `Última sincronización: ${formatFecha(perfil.fecha_ultima_sync)}`
                  : 'Sin sincronizar todavía'}
              </span>
            </div>

            <Toggle
              checked={perfil.publicar_stats}
              disabled={privacidad.isPending}
              onChange={v => privacidad.mutate(v)}
              label="Publicar mis estadísticas para el resto de socios"
            />

            <div className="flex flex-wrap gap-3 pt-1">
              <button onClick={() => sincronizar.mutate()} disabled={sincronizar.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                <RefreshCw size={14} className={sincronizar.isPending ? 'animate-spin' : ''} />
                {sincronizar.isPending ? 'Sincronizando…' : 'Sincronizar partidas'}
              </button>
              <button onClick={() => setConfirmDesvincular(true)} disabled={desvincular.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-60">
                <Unlink size={14} />
                Desvincular
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Estadísticas de la asociación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={BarChart3} label="Partidas publicadas" value={partidasPublicas.length} />
        <StatCard icon={Users} label="Socios que publican" value={publicadores.size} />
        <StatCard icon={Trophy} label="Juego más jugado" value={topJuegos[0]?.nombre ?? '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Juegos más jugados en la asociación
          </h3>
          <Table
            columns={[
              {
                key: 'juego', header: 'Juego',
                render: (j: typeof topJuegos[number]) => (
                  <a href={bggUrl(j.bgg_game_id)} target="_blank" rel="noreferrer"
                    className="text-gray-900 dark:text-gray-100 hover:text-brand-600 dark:hover:text-brand-400">
                    {j.nombre}
                  </a>
                ),
              },
              { key: 'veces', header: 'Veces jugado', className: 'w-28 text-center', render: j => <span className="block text-center">{j.veces}</span> },
            ]}
            rows={topJuegos}
            rowKey={j => String(j.bgg_game_id)}
            loading={loadingPartidas}
            emptyState="Todavía no hay partidas publicadas"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Últimas partidas publicadas
          </h3>
          <Table
            columns={[
              { key: 'juego', header: 'Juego', render: (p: BggPartida) => p.juego_nombre },
              {
                key: 'socio', header: 'Socio',
                render: (p: BggPartida) => p.nombre_display ?? <Badge label="Socio" variant="gray" />,
              },
              { key: 'fecha', header: 'Fecha', className: 'w-32 whitespace-nowrap', render: (p: BggPartida) => formatFecha(p.fecha) },
            ]}
            rows={partidasPublicas.slice(0, 10)}
            rowKey={p => p.$id}
            loading={loadingPartidas}
            emptyState="Todavía no hay partidas publicadas"
          />
        </div>
      </div>

      {/* Mis partidas */}
      {perfil && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Mis partidas {misPartidas.length > 0 && `(${misPartidas.length})`}
          </h3>
          <Table
            columns={[
              {
                key: 'juego', header: 'Juego',
                render: (p: BggPartida) => (
                  <a href={bggUrl(p.bgg_game_id)} target="_blank" rel="noreferrer"
                    className="text-gray-900 dark:text-gray-100 hover:text-brand-600 dark:hover:text-brand-400">
                    {p.juego_nombre}
                  </a>
                ),
              },
              { key: 'fecha', header: 'Fecha', className: 'w-32 whitespace-nowrap', render: (p: BggPartida) => formatFecha(p.fecha) },
              { key: 'cantidad', header: 'Veces', className: 'w-20 text-center', render: (p: BggPartida) => <span className="block text-center">{p.cantidad ?? 1}</span> },
              { key: 'duracion', header: 'Duración', className: 'w-24 whitespace-nowrap', render: (p: BggPartida) => p.duracion_min ? `${p.duracion_min} min` : '—' },
            ]}
            rows={misPartidas}
            rowKey={p => p.$id}
            loading={loadingPartidas}
            emptyState='Sin partidas. Pulsa "Sincronizar partidas" para importarlas de BGG.'
          />
        </div>
      )}

      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        Datos de juegos y partidas obtenidos de{' '}
        <a href="https://boardgamegeek.com" target="_blank" rel="noreferrer" className="underline hover:text-brand-600">
          BoardGameGeek
        </a>.
      </p>

      <ConfirmDialog
        open={confirmDesvincular}
        onClose={() => setConfirmDesvincular(false)}
        onConfirm={() => desvincular.mutate(undefined, { onSuccess: () => setConfirmDesvincular(false) })}
        title="Desvincular cuenta de BGG"
        message="Se eliminará tu perfil de BGG y todas tus partidas sincronizadas de la asociación. Podrás volver a vincularla cuando quieras."
        confirmLabel="Desvincular"
        danger
        loading={desvincular.isPending}
      />
    </div>
  )
}
