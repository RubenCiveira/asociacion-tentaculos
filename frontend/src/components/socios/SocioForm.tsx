import { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { DatePicker } from '@/components/ui/DatePicker'
import { Toggle } from '@/components/ui/Toggle'
import type { Socio } from '@/types'

type FormData = {
  nombre: string
  apellidos: string
  fecha_nacimiento: string
  email: string
  telefono: string
  notas: string
  activo: boolean
}

interface SocioFormProps {
  initial?: Partial<Socio>
  onSubmit: (data: FormData) => void
  onCancel: () => void
  loading?: boolean
  isEdit?: boolean
}

export function SocioForm({ initial, onSubmit, onCancel, loading, isEdit }: SocioFormProps) {
  const [form, setForm] = useState<FormData>({
    nombre: initial?.nombre ?? '',
    apellidos: initial?.apellidos ?? '',
    fecha_nacimiento: initial?.fecha_nacimiento ? initial.fecha_nacimiento.slice(0, 10) : '',
    email: initial?.email ?? '',
    telefono: initial?.telefono ?? '',
    notas: initial?.notas ?? '',
    activo: initial?.activo ?? true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.apellidos.trim()) e.apellidos = 'Los apellidos son obligatorios'
    if (!form.fecha_nacimiento) e.fecha_nacimiento = 'La fecha de nacimiento es obligatoria'
    else if (new Date(form.fecha_nacimiento) > new Date()) e.fecha_nacimiento = 'No puede ser una fecha futura'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email no válido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre" htmlFor="nombre" required error={errors.nombre}>
          <Input id="nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)}
            error={!!errors.nombre} placeholder="Ej: María" />
        </FormField>
        <FormField label="Apellidos" htmlFor="apellidos" required error={errors.apellidos}>
          <Input id="apellidos" value={form.apellidos} onChange={e => set('apellidos', e.target.value)}
            error={!!errors.apellidos} placeholder="Ej: García López" />
        </FormField>
      </div>

      <FormField label="Fecha de nacimiento" htmlFor="fnac" required error={errors.fecha_nacimiento}>
        <DatePicker id="fnac" value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)}
          error={!!errors.fecha_nacimiento} max={new Date().toISOString().slice(0, 10)} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Email" htmlFor="email" error={errors.email}
          hint="Opcional — solo si el socio lo facilita">
          <Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
            error={!!errors.email} placeholder="socio@email.com" />
        </FormField>
        <FormField label="Teléfono" htmlFor="tel">
          <Input id="tel" type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
            placeholder="600 000 000" />
        </FormField>
      </div>

      <FormField label="Notas" htmlFor="notas">
        <Textarea id="notas" value={form.notas} onChange={e => set('notas', e.target.value)}
          placeholder="Información adicional…" rows={2} />
      </FormField>

      {isEdit && (
        <div className="pt-1">
          <Toggle id="activo" checked={form.activo} onChange={v => set('activo', v)}
            label={form.activo ? 'Socio activo' : 'Socio dado de baja'} />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear socio'}
        </button>
      </div>
    </form>
  )
}
