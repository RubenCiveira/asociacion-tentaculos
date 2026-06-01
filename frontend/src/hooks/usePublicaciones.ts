import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ID, Query } from 'appwrite'
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { useToast } from '@/contexts/ToastContext'
import type { Publicacion, EstadoPublicacion } from '@/types'

export function usePublicaciones({ estado }: { estado?: EstadoPublicacion } = {}) {
  return useQuery({
    queryKey: ['publicaciones', { estado }],
    queryFn: async () => {
      const q = [Query.orderDesc('$createdAt'), Query.limit(500)]
      if (estado) q.push(Query.equal('estado', estado))
      return databases.listDocuments<Publicacion>(DB_ID, COLLECTIONS.PUBLICACIONES, q)
    },
  })
}

export function usePublicacion(id: string) {
  return useQuery({
    queryKey: ['publicaciones', id],
    queryFn: () => databases.getDocument<Publicacion>(DB_ID, COLLECTIONS.PUBLICACIONES, id),
    enabled: !!id,
  })
}

type Payload = Omit<Publicacion, keyof import('appwrite').Models.Document>

export function useCreatePublicacion() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (data: Payload) =>
      databases.createDocument<Publicacion>(DB_ID, COLLECTIONS.PUBLICACIONES, ID.unique(), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicaciones'] })
      toast.success('Publicación creada')
    },
    onError: () => toast.error('Error al crear la publicación'),
  })
}

export function useUpdatePublicacion() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payload> }) =>
      databases.updateDocument<Publicacion>(DB_ID, COLLECTIONS.PUBLICACIONES, id, data),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ['publicaciones'] })
      qc.setQueryData(['publicaciones', doc.$id], doc)
      toast.success('Publicación actualizada')
    },
    onError: () => toast.error('Error al actualizar la publicación'),
  })
}

export function useDeletePublicacion() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) =>
      databases.deleteDocument(DB_ID, COLLECTIONS.PUBLICACIONES, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicaciones'] })
      toast.success('Publicación eliminada')
    },
    onError: () => toast.error('Error al eliminar la publicación'),
  })
}
