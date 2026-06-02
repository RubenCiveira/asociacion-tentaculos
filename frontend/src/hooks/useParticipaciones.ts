import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Query, ExecutionMethod } from 'appwrite'
import { databases, functions, DB_ID, COLLECTIONS, FUNCTIONS } from '@/lib/appwrite'
import { useToast } from '@/contexts/ToastContext'
import type { Participacion, EstadoParticipacion } from '@/types'

/** Participaciones inscritas de un evento (excluye retiradas). Para admins/gestoresEventos. */
export function useParticipacionesEvento(eventoId: string) {
  return useQuery({
    queryKey: ['participaciones', 'evento', eventoId],
    queryFn: () =>
      databases.listDocuments<Participacion>(DB_ID, COLLECTIONS.PARTICIPACIONES, [
        Query.equal('evento_id', eventoId),
        Query.notEqual('estado', 'retirado'),
        Query.limit(500),
      ]),
    enabled: !!eventoId,
  })
}

/** Todas las participaciones del usuario actual (para saber en qué eventos está inscrito). */
export function useMisParticipaciones(userId: string | undefined) {
  return useQuery({
    queryKey: ['participaciones', 'mias', userId],
    queryFn: async () => {
      if (!userId) return [] as Participacion[]
      const res = await databases.listDocuments<Participacion>(DB_ID, COLLECTIONS.PARTICIPACIONES, [
        Query.equal('user_id', userId),
        Query.limit(500),
      ])
      return res.documents
    },
    enabled: !!userId,
  })
}

/** Participaciones de un socio (por socio_id). Para la ficha del socio. */
export function useParticipacionesSocio(socioId: string | undefined) {
  return useQuery({
    queryKey: ['participaciones', 'socio', socioId],
    queryFn: async () => {
      if (!socioId) return [] as Participacion[]
      const res = await databases.listDocuments<Participacion>(DB_ID, COLLECTIONS.PARTICIPACIONES, [
        Query.equal('socio_id', socioId),
        Query.notEqual('estado', 'retirado'),
        Query.limit(500),
      ])
      return res.documents
    },
    enabled: !!socioId,
  })
}

/**
 * Mapa evento_id → nº inscritos (estado='inscrito').
 * Una sola query para mostrar conteos en el listado de eventos.
 */
export function useConteosParticipaciones() {
  return useQuery({
    queryKey: ['participaciones', 'conteos'],
    queryFn: async () => {
      const res = await databases.listDocuments<Participacion>(DB_ID, COLLECTIONS.PARTICIPACIONES, [
        Query.equal('estado', 'inscrito'),
        Query.limit(500),
      ])
      const conteos = new Map<string, number>()
      for (const p of res.documents) {
        conteos.set(p.evento_id, (conteos.get(p.evento_id) ?? 0) + 1)
      }
      return conteos
    },
  })
}

async function callFunction(accion: 'inscribirse' | 'retirarse', eventoId: string) {
  if (!FUNCTIONS.INSCRIPCION_EVENTO) {
    throw new Error('VITE_FUNCTION_INSCRIPCION_EVENTO_ID no configurada en .env.local')
  }
  const execution = await functions.createExecution(
    FUNCTIONS.INSCRIPCION_EVENTO,
    JSON.stringify({ accion, evento_id: eventoId }),
    false,
    '/',
    ExecutionMethod.POST,
    { 'Content-Type': 'application/json' },
  )
  // Appwrite siempre resuelve con 200 aunque la función devuelva un error interno.
  // Hay que comprobar el responseStatusCode y lanzar manualmente si no es 2xx.
  if (execution.responseStatusCode < 200 || execution.responseStatusCode >= 300) {
    let message = 'Error en la función'
    try {
      const body = JSON.parse(execution.responseBody) as { error?: string }
      if (body.error) message = body.error
    } catch { /* noop */ }
    throw new Error(message)
  }
  return execution
}

/** Inscribe al usuario actual en un evento vía Function. */
export function useInscribirse() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (eventoId: string) => callFunction('inscribirse', eventoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participaciones'] })
      toast.success('Te has apuntado al evento')
    },
    onError: (err: unknown) => {
      toast.error(parseError(err) ?? 'Error al inscribirse en el evento')
    },
  })
}

/** Retira al usuario actual de un evento vía Function. */
export function useRetirarse() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (eventoId: string) => callFunction('retirarse', eventoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participaciones'] })
      toast.success('Te has retirado del evento')
    },
    onError: (err: unknown) => {
      toast.error(parseError(err) ?? 'Error al retirarse del evento')
    },
  })
}

/** Permite a admin/gestorEventos cambiar el estado de una participación. */
export function useUpdateParticipacion(eventoId: string) {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({
      participacionId,
      estado,
      motivo_rechazo,
    }: {
      participacionId: string
      estado: EstadoParticipacion
      motivo_rechazo?: string
    }) =>
      databases.updateDocument<Participacion>(DB_ID, COLLECTIONS.PARTICIPACIONES, participacionId, {
        estado,
        ...(motivo_rechazo !== undefined ? { motivo_rechazo } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participaciones', 'evento', eventoId] })
      qc.invalidateQueries({ queryKey: ['participaciones', 'conteos'] })
      toast.success('Participación actualizada')
    },
    onError: () => toast.error('Error al actualizar la participación'),
  })
}

function parseError(err: unknown): string | null {
  if (err instanceof Error) return err.message
  try {
    const body = (err as { response?: { responseBody?: string } })?.response?.responseBody
    if (body) return (JSON.parse(body) as { error?: string })?.error ?? null
  } catch { /* noop */ }
  return null
}
