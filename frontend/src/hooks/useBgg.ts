import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Query } from 'appwrite'
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  buscarJuegosBgg, vincularBgg, sincronizarBgg, cambiarPrivacidadBgg, desvincularBgg,
} from '@/lib/bgg'
import type { BggPerfil, BggPartida } from '@/types'

/** Búsqueda de juegos en BGG (el debounce lo hace el componente que la usa). */
export function useBuscarJuegosBgg(q: string) {
  return useQuery({
    queryKey: ['bgg_busqueda', q],
    queryFn: () => buscarJuegosBgg(q),
    enabled: q.trim().length >= 3,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  })
}

/** Perfil BGG del usuario actual (null si no está vinculado). */
export function useBggPerfil() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['bgg_perfil', user?.$id],
    queryFn: async () => {
      const r = await databases.listDocuments<BggPerfil>(DB_ID, COLLECTIONS.BGG_PERFILES, [
        Query.equal('user_id', user!.$id),
        Query.limit(1),
      ])
      return r.documents[0] ?? null
    },
    enabled: !!user,
  })
}

/** Perfiles BGG visibles (los que publican, más el propio por permisos de fila). */
export function useBggPerfiles() {
  return useQuery({
    queryKey: ['bgg_perfiles'],
    queryFn: () =>
      databases.listDocuments<BggPerfil>(DB_ID, COLLECTIONS.BGG_PERFILES, [Query.limit(200)]),
  })
}

/**
 * Partidas visibles para el usuario actual: las suyas siempre y las de
 * los socios que han decidido publicarlas (row security de Appwrite).
 */
export function useBggPartidas({ userId }: { userId?: string } = {}) {
  return useQuery({
    queryKey: ['bgg_partidas', { userId }],
    queryFn: async () => {
      const docs: BggPartida[] = []
      let cursor: string | null = null
      for (;;) {
        const q = [Query.orderDesc('fecha'), Query.limit(500)]
        if (userId) q.push(Query.equal('user_id', userId))
        if (cursor) q.push(Query.cursorAfter(cursor))
        const r = await databases.listDocuments<BggPartida>(DB_ID, COLLECTIONS.BGG_PARTIDAS, q)
        docs.push(...r.documents)
        if (r.documents.length < 500 || docs.length >= 5000) return docs
        cursor = r.documents[r.documents.length - 1].$id
      }
    },
  })
}

function useInvalidarBgg() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['bgg_perfil'] })
    qc.invalidateQueries({ queryKey: ['bgg_perfiles'] })
    qc.invalidateQueries({ queryKey: ['bgg_partidas'] })
  }
}

export function useVincularBgg() {
  const invalidar = useInvalidarBgg()
  const toast = useToast()
  return useMutation({
    mutationFn: (bggUsername: string) => vincularBgg(bggUsername),
    onSuccess: () => {
      invalidar()
      toast.success('Cuenta de BGG vinculada')
    },
    onError: (e: Error) => toast.error(e.message || 'Error al vincular la cuenta'),
  })
}

export function useSincronizarBgg() {
  const invalidar = useInvalidarBgg()
  const toast = useToast()
  return useMutation({
    mutationFn: () => sincronizarBgg(),
    onSuccess: r => {
      invalidar()
      toast.success(`Partidas sincronizadas (${r.creadas} nuevas, ${r.actualizadas} actualizadas)`)
    },
    onError: (e: Error) => toast.error(e.message || 'Error al sincronizar'),
  })
}

export function useCambiarPrivacidadBgg() {
  const invalidar = useInvalidarBgg()
  const toast = useToast()
  return useMutation({
    mutationFn: (publicar: boolean) => cambiarPrivacidadBgg(publicar),
    onSuccess: (_r, publicar) => {
      invalidar()
      toast.success(publicar
        ? 'Tus estadísticas ahora son visibles para los socios'
        : 'Tus estadísticas ahora son privadas')
    },
    onError: (e: Error) => toast.error(e.message || 'Error al cambiar la privacidad'),
  })
}

export function useDesvincularBgg() {
  const invalidar = useInvalidarBgg()
  const toast = useToast()
  return useMutation({
    mutationFn: () => desvincularBgg(),
    onSuccess: () => {
      invalidar()
      toast.success('Cuenta de BGG desvinculada')
    },
    onError: (e: Error) => toast.error(e.message || 'Error al desvincular'),
  })
}
