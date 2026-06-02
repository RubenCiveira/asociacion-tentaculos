import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ID, Query } from 'appwrite'
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { useToast } from '@/contexts/ToastContext'
import type { Socio } from '@/types'

export function useSocios({ soloActivos }: { soloActivos?: boolean } = {}) {
  return useQuery({
    queryKey: ['socios', { soloActivos }],
    queryFn: async () => {
      const q = [Query.orderAsc('apellidos'), Query.limit(500)]
      if (soloActivos !== undefined) q.push(Query.equal('activo', soloActivos))
      return databases.listDocuments<Socio>(DB_ID, COLLECTIONS.SOCIOS, q)
    },
  })
}

export function useSocio(id: string) {
  return useQuery({
    queryKey: ['socios', id],
    queryFn: () => databases.getDocument<Socio>(DB_ID, COLLECTIONS.SOCIOS, id),
    enabled: !!id,
  })
}

type SocioPayload = Omit<Socio, keyof import('appwrite').Models.Document>

export function useCreateSocio() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (data: SocioPayload) =>
      databases.createDocument<Socio>(DB_ID, COLLECTIONS.SOCIOS, ID.unique(), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['socios'] })
      toast.success('Socio creado correctamente')
    },
    onError: () => toast.error('Error al crear el socio'),
  })
}

export function useUpdateSocio() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SocioPayload> }) =>
      databases.updateDocument<Socio>(DB_ID, COLLECTIONS.SOCIOS, id, data),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ['socios'] })
      qc.setQueryData(['socios', doc.$id], doc)
      toast.success('Socio actualizado')
    },
    onError: () => toast.error('Error al actualizar el socio'),
  })
}

/** Devuelve el socio vinculado al userId del usuario logueado, o null. */
export function useMiSocio(userId: string | undefined) {
  return useQuery({
    queryKey: ['mi-socio', userId],
    queryFn: async () => {
      if (!userId) return null
      const res = await databases.listDocuments<Socio>(
        DB_ID, COLLECTIONS.SOCIOS,
        [Query.equal('user_id', userId), Query.limit(1)],
      )
      return res.documents[0] ?? null
    },
    enabled: !!userId,
  })
}

export function useDeleteSocio() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) =>
      databases.deleteDocument(DB_ID, COLLECTIONS.SOCIOS, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['socios'] })
      toast.success('Socio eliminado')
    },
    onError: () => toast.error('Error al eliminar el socio'),
  })
}
