import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ID, Query } from 'appwrite'
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { useToast } from '@/contexts/ToastContext'
import type { MaterialAsociacion, EstadoMaterial } from '@/types'

export function useMaterialesAsociacion({ estado }: { estado?: EstadoMaterial } = {}) {
  return useQuery({
    queryKey: ['materiales_asociacion', { estado }],
    queryFn: async () => {
      const q = [Query.orderAsc('nombre'), Query.limit(500)]
      if (estado) q.push(Query.equal('estado', estado))
      return databases.listDocuments<MaterialAsociacion>(DB_ID, COLLECTIONS.MATERIALES_ASOCIACION, q)
    },
  })
}

type Payload = Omit<MaterialAsociacion, keyof import('appwrite').Models.Document>

export function useCreateMaterialAsociacion() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (data: Payload) =>
      databases.createDocument<MaterialAsociacion>(DB_ID, COLLECTIONS.MATERIALES_ASOCIACION, ID.unique(), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materiales_asociacion'] })
      toast.success('Material creado correctamente')
    },
    onError: () => toast.error('Error al crear el material'),
  })
}

export function useUpdateMaterialAsociacion() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payload> }) =>
      databases.updateDocument<MaterialAsociacion>(DB_ID, COLLECTIONS.MATERIALES_ASOCIACION, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materiales_asociacion'] })
      toast.success('Material actualizado')
    },
    onError: () => toast.error('Error al actualizar el material'),
  })
}

export function useDeleteMaterialAsociacion() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) =>
      databases.deleteDocument(DB_ID, COLLECTIONS.MATERIALES_ASOCIACION, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materiales_asociacion'] })
      toast.success('Material eliminado')
    },
    onError: () => toast.error('Error al eliminar el material'),
  })
}
