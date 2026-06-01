import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ID, Query } from 'appwrite'
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { useToast } from '@/contexts/ToastContext'
import type { Lugar } from '@/types'

export function useLugares({ soloActivos }: { soloActivos?: boolean } = {}) {
  return useQuery({
    queryKey: ['lugares', { soloActivos }],
    queryFn: async () => {
      const q = [Query.orderAsc('nombre'), Query.limit(200)]
      if (soloActivos !== undefined) q.push(Query.equal('activo', soloActivos))
      return databases.listDocuments<Lugar>(DB_ID, COLLECTIONS.LUGARES, q)
    },
  })
}

type Payload = Omit<Lugar, keyof import('appwrite').Models.Document>

export function useCreateLugar() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (data: Payload) =>
      databases.createDocument<Lugar>(DB_ID, COLLECTIONS.LUGARES, ID.unique(), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lugares'] })
      toast.success('Lugar creado correctamente')
    },
    onError: () => toast.error('Error al crear el lugar'),
  })
}

export function useUpdateLugar() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payload> }) =>
      databases.updateDocument<Lugar>(DB_ID, COLLECTIONS.LUGARES, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lugares'] })
      toast.success('Lugar actualizado')
    },
    onError: () => toast.error('Error al actualizar el lugar'),
  })
}

export function useDeleteLugar() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) =>
      databases.deleteDocument(DB_ID, COLLECTIONS.LUGARES, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lugares'] })
      toast.success('Lugar eliminado')
    },
    onError: () => toast.error('Error al eliminar el lugar'),
  })
}
