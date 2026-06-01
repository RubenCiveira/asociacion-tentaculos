import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ID, Query } from 'appwrite'
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { useToast } from '@/contexts/ToastContext'
import type { Evento, EstadoEvento, TipoJuego } from '@/types'

export function useEventos({ estado, tipoJuego }: { estado?: EstadoEvento; tipoJuego?: TipoJuego } = {}) {
  return useQuery({
    queryKey: ['eventos', { estado, tipoJuego }],
    queryFn: async () => {
      const q = [Query.orderDesc('fecha_inicio'), Query.limit(500)]
      if (estado) q.push(Query.equal('estado', estado))
      if (tipoJuego) q.push(Query.equal('tipo_juego', tipoJuego))
      return databases.listDocuments<Evento>(DB_ID, COLLECTIONS.EVENTOS, q)
    },
  })
}

export function useEvento(id: string) {
  return useQuery({
    queryKey: ['eventos', id],
    queryFn: () => databases.getDocument<Evento>(DB_ID, COLLECTIONS.EVENTOS, id),
    enabled: !!id,
  })
}

type Payload = Omit<Evento, keyof import('appwrite').Models.Document>

export function useCreateEvento() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (data: Payload) =>
      databases.createDocument<Evento>(DB_ID, COLLECTIONS.EVENTOS, ID.unique(), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      toast.success('Evento creado correctamente')
    },
    onError: () => toast.error('Error al crear el evento'),
  })
}

export function useUpdateEvento() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payload> }) =>
      databases.updateDocument<Evento>(DB_ID, COLLECTIONS.EVENTOS, id, data),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      qc.setQueryData(['eventos', doc.$id], doc)
      toast.success('Evento actualizado')
    },
    onError: () => toast.error('Error al actualizar el evento'),
  })
}

export function useDeleteEvento() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) =>
      databases.deleteDocument(DB_ID, COLLECTIONS.EVENTOS, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      toast.success('Evento eliminado')
    },
    onError: () => toast.error('Error al eliminar el evento'),
  })
}
