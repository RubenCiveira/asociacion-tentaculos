import { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { TIPO_LUGAR_LABELS } from '@/types'
import type { Lugar, TipoLugar } from '@/types'

type FormData = {
  nombre: string
  direccion: string
  tipo: TipoLugar
  capacidad: string
  activo: boolean
  notas: string
}

interface Props {
  initial?: Partial<Lugar>
  onSubmit: (data: Omit<FormData, 'capacidad'> & { capacidad?: number }) => void
  onCancel: () => void
  loading?: boolean
  isEdit?: boolean
}

export function LugarForm({ initial, onSubmit, onCancel, loading, isEdit }: Props) {
  const [form, setForm] = useState<FormData>({
    nombre: initial?.nombre ?? '',
    direccion: initial?.direccion ?? '',
    tipo: initial?.tipo ?? 'bar',
    capacidad: initial?.capacidad?.toString() ?? '',
    activo: initial?.activo ?? true,
    notas: initial?.notas ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (form.capacidad && isNaN(Number(form.capacidad))) e.capacidad = 'Debe ser un número'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    const { capacidad, ...rest } = form
    onSubmit({ ...rest, capacidad: capacidad ? Number(capacidad) : undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre del lugar" htmlFor="nombre" required error={errors.nombre}>
        <Input id="nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)}
          error={!!errors.nombre} placeholder="Ej: Bar El Dragón, Biblioteca Municipal…" />
      </FormField>

      <FormField label="Tipo" htmlFor="tipo">
        <Select id="tipo" value={form.tipo} onChange={e => set('tipo', e.target.value as TipoLugar)}>
          {(Object.entries(TIPO_LUGAR_LABELS) as [TipoLugar, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Dirección" htmlFor="dir">
        <Input id="dir" value={form.direccion} onChange={e => set('direccion', e.target.value)}
          placeholder="Calle, número, ciudad…" />
      </FormField>

      <FormField label="Capacidad máxima" htmlFor="cap" error={errors.capacidad}
        hint="Número máximo de jugadores (opcional)">
        <Input id="cap" type="number" min="1" value={form.capacidad}
          onChange={e => set('capacidad', e.target.value)}
          error={!!errors.capacidad} placeholder="Ej: 20" />
      </FormField>

      <FormField label="Notas" htmlFor="notas">
        <Textarea id="notas" value={form.notas} onChange={e => set('notas', e.target.value)}
          placeholder="Horario, contacto, instrucciones de acceso…" rows={2} />
      </FormField>

      {isEdit && (
        <div className="pt-1">
          <Toggle id="activo" checked={form.activo} onChange={v => set('activo', v)}
            label={form.activo ? 'Lugar activo' : 'Lugar inactivo'} />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear lugar'}
        </button>
      </div>
    </form>
  )
}
