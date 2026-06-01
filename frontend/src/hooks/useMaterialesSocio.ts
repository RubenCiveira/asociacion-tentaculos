import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ID, Query } from 'appwrite'
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { useToast } from '@/contexts/ToastContext'
import type { MaterialSocio } from '@/types'

export function useMaterialesSocio({ socioId }: { socioId?: string } = {}) {
  return useQuery({
    queryKey: ['materiales_socio', { socioId }],
    queryFn: async () => {
      const q = [Query.orderAsc('nombre'), Query.limit(500)]
      if (socioId) q.push(Query.equal('socio_id', socioId))
      return databases.listDocuments<MaterialSocio>(DB_ID, COLLECTIONS.MATERIALES_SOCIO, q)
    },
  })
}

export function useMaterialSocio(id: string) {
  return useQuery({
    queryKey: ['materiales_socio', id],
    queryFn: () => databases.getDocument<MaterialSocio>(DB_ID, COLLECTIONS.MATERIALES_SOCIO, id),
    enabled: !!id,
  })
}

type Payload = Omit<MaterialSocio, keyof import('appwrite').Models.Document>

export function useCreateMaterialSocio() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (data: Payload) =>
      databases.createDocument<MaterialSocio>(DB_ID, COLLECTIONS.MATERIALES_SOCIO, ID.unique(), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materiales_socio'] })
      toast.success('Material creado correctamente')
    },
    onError: () => toast.error('Error al crear el material'),
  })
}

export function useUpdateMaterialSocio() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payload> }) =>
      databases.updateDocument<MaterialSocio>(DB_ID, COLLECTIONS.MATERIALES_SOCIO, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materiales_socio'] })
      toast.success('Material actualizado')
    },
    onError: () => toast.error('Error al actualizar el material'),
  })
}

export function useDeleteMaterialSocio() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) =>
      databases.deleteDocument(DB_ID, COLLECTIONS.MATERIALES_SOCIO, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materiales_socio'] })
      toast.success('Material eliminado')
    },
    onError: () => toast.error('Error al eliminar el material'),
  })
}
