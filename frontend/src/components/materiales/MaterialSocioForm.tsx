import { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { ComboboxBuscable } from '@/components/ui/ComboboxBuscable'
import { useSocios } from '@/hooks/useSocios'
import { TIPO_MATERIAL_LABELS } from '@/types'
import type { MaterialSocio, TipoMaterial } from '@/types'

type FormData = {
  socio_id: string
  nombre: string
  tipo: TipoMaterial
  descripcion: string
  prestado_asociacion: boolean
  notas: string
}

interface Props {
  initial?: Partial<MaterialSocio>
  fixedSocioId?: string
  onSubmit: (data: FormData) => void
  onCancel: () => void
  loading?: boolean
  isEdit?: boolean
}

export function MaterialSocioForm({ initial, fixedSocioId, onSubmit, onCancel, loading, isEdit }: Props) {
  const [form, setForm] = useState<FormData>({
    socio_id: initial?.socio_id ?? fixedSocioId ?? '',
    nombre: initial?.nombre ?? '',
    tipo: initial?.tipo ?? 'juego_mesa',
    descripcion: initial?.descripcion ?? '',
    prestado_asociacion: initial?.prestado_asociacion ?? false,
    notas: initial?.notas ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const { data: sociosData } = useSocios({ soloActivos: true })
  const sociosOptions = (sociosData?.documents ?? []).map(s => ({
    value: s.$id,
    label: `${s.apellidos}, ${s.nombre}`,
  }))

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.socio_id) e.socio_id = 'Selecciona un socio'
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!fixedSocioId && (
        <FormField label="Socio propietario" required error={errors.socio_id}>
          <ComboboxBuscable
            options={sociosOptions}
            value={form.socio_id}
            onChange={v => set('socio_id', v)}
            placeholder="Busca un socio…"
            error={!!errors.socio_id}
            emptyMessage="No se encontró ningún socio"
          />
        </FormField>
      )}

      <FormField label="Nombre del material" htmlFor="nombre" required error={errors.nombre}>
        <Input id="nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)}
          error={!!errors.nombre} placeholder="Ej: Catan, Libro del Jugador D&D…" />
      </FormField>

      <FormField label="Tipo" htmlFor="tipo">
        <Select id="tipo" value={form.tipo} onChange={e => set('tipo', e.target.value as TipoMaterial)}>
          {(Object.entries(TIPO_MATERIAL_LABELS) as [TipoMaterial, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Descripción" htmlFor="desc">
        <Textarea id="desc" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
          placeholder="Edición, estado, contenido…" rows={2} />
      </FormField>

      <div className="pt-1">
        <Toggle
          checked={form.prestado_asociacion}
          onChange={v => set('prestado_asociacion', v)}
          label="Prestado a la asociación"
        />
      </div>

      <FormField label="Notas" htmlFor="notas">
        <Textarea id="notas" value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Añadir material'}
        </button>
      </div>
    </form>
  )
}
