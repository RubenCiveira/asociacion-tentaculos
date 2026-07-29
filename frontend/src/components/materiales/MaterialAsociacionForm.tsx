import { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { ComboboxBuscable } from '@/components/ui/ComboboxBuscable'
import { JuegoBggSearch, type JuegoBggSeleccion } from '@/components/bgg/JuegoBggSearch'
import { useSocios } from '@/hooks/useSocios'
import { TIPO_MATERIAL_LABELS, ESTADO_MATERIAL_LABELS } from '@/types'
import type { MaterialAsociacion, TipoMaterial, EstadoMaterial } from '@/types'

type FormData = {
  nombre: string
  tipo: TipoMaterial
  descripcion: string
  estado: EstadoMaterial
  ubicacion: string
  donado_por: string
  fecha_adquisicion: string
  notas: string
  bgg_id: number | null
  bgg_nombre: string | null
  bgg_thumbnail: string | null
}

interface Props {
  initial?: Partial<MaterialAsociacion>
  onSubmit: (data: FormData) => void
  onCancel: () => void
  loading?: boolean
  isEdit?: boolean
}

export function MaterialAsociacionForm({ initial, onSubmit, onCancel, loading, isEdit }: Props) {
  const [form, setForm] = useState<FormData>({
    nombre: initial?.nombre ?? '',
    tipo: initial?.tipo ?? 'juego_mesa',
    descripcion: initial?.descripcion ?? '',
    estado: initial?.estado ?? 'bueno',
    ubicacion: initial?.ubicacion ?? '',
    donado_por: initial?.donado_por ?? '',
    fecha_adquisicion: initial?.fecha_adquisicion ? initial.fecha_adquisicion.slice(0, 10) : '',
    notas: initial?.notas ?? '',
    bgg_id: initial?.bgg_id ?? null,
    bgg_nombre: initial?.bgg_nombre ?? null,
    bgg_thumbnail: initial?.bgg_thumbnail ?? null,
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
      <FormField label="Nombre del material" htmlFor="nombre" required error={errors.nombre}>
        <Input id="nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)}
          error={!!errors.nombre} placeholder="Ej: Warhammer 40k, Dungeon Master's Guide…" />
      </FormField>

      <FormField label="Juego (BGG)" hint="Opcional: vincula con BoardGameGeek">
        <JuegoBggSearch
          value={form.bgg_id && form.bgg_nombre
            ? { bgg_id: form.bgg_id, bgg_nombre: form.bgg_nombre, bgg_thumbnail: form.bgg_thumbnail }
            : null}
          onChange={sel => setForm(f => ({
            ...f,
            bgg_id: sel?.bgg_id ?? null,
            bgg_nombre: sel?.bgg_nombre ?? null,
            bgg_thumbnail: sel?.bgg_thumbnail ?? null,
          }))}
          onSeleccion={(sel: JuegoBggSeleccion) => {
            setForm(f => (f.nombre.trim() ? f : { ...f, nombre: sel.bgg_nombre }))
          }}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tipo" htmlFor="tipo">
          <Select id="tipo" value={form.tipo} onChange={e => set('tipo', e.target.value as TipoMaterial)}>
            {(Object.entries(TIPO_MATERIAL_LABELS) as [TipoMaterial, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Estado" htmlFor="estado">
          <Select id="estado" value={form.estado} onChange={e => set('estado', e.target.value as EstadoMaterial)}>
            {(Object.entries(ESTADO_MATERIAL_LABELS) as [EstadoMaterial, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Descripción" htmlFor="desc">
        <Textarea id="desc" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
          placeholder="Edición, contenido, estado de conservación…" rows={2} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Ubicación actual" htmlFor="ubi">
          <Input id="ubi" value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)}
            placeholder="Ej: Armario local, Casa de Juan…" />
        </FormField>
        <FormField label="Fecha de adquisición" htmlFor="fadq">
          <DatePicker id="fadq" value={form.fecha_adquisicion}
            onChange={e => set('fecha_adquisicion', e.target.value)} />
        </FormField>
      </div>

      <FormField label="Donado / aportado por" hint="Opcional">
        <ComboboxBuscable
          options={sociosOptions}
          value={form.donado_por}
          onChange={v => set('donado_por', v)}
          placeholder="Selecciona un socio…"
          emptyMessage="No se encontró ningún socio"
        />
      </FormField>

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
