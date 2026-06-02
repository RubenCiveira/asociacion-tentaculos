import { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { ComboboxBuscable } from '@/components/ui/ComboboxBuscable'
import { useEventos } from '@/hooks/useEventos'
import { RED_SOCIAL_LABELS, ESTADO_PUBLICACION_LABELS } from '@/types'
import type { Publicacion, RedSocial, EstadoPublicacion } from '@/types'

const CHAR_LIMITS: Partial<Record<RedSocial, number>> = {
  twitter: 280,
  instagram: 2200,
}

type FormData = {
  titulo: string
  contenido: string
  estado: EstadoPublicacion
  redes: RedSocial[]
  fecha_publicacion: string
  evento_id: string
  notas: string
}

interface Props {
  initial?: Partial<Publicacion>
  onSubmit: (data: FormData) => void
  onCancel: () => void
  loading?: boolean
  isEdit?: boolean
}

export function PublicacionForm({ initial, onSubmit, onCancel, loading, isEdit }: Props) {
  const [form, setForm] = useState<FormData>({
    titulo: initial?.titulo ?? '',
    contenido: initial?.contenido ?? '',
    estado: initial?.estado ?? 'borrador',
    redes: initial?.redes ?? [],
    fecha_publicacion: initial?.fecha_publicacion ? initial.fecha_publicacion.slice(0, 10) : '',
    evento_id: initial?.evento_id ?? '',
    notas: initial?.notas ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const { data: eventosData } = useEventos()
  const eventosOptions = (eventosData?.documents ?? []).map(e => ({
    value: e.$id, label: e.titulo,
  }))

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function toggleRed(red: RedSocial) {
    setForm(f => ({
      ...f,
      redes: f.redes.includes(red) ? f.redes.filter(r => r !== red) : [...f.redes, red],
    }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.titulo.trim()) e.titulo = 'El título es obligatorio'
    if (!form.contenido.trim()) e.contenido = 'El contenido es obligatorio'
    if (form.redes.length === 0) e.redes = 'Selecciona al menos una red social'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (validate()) onSubmit(form)
  }

  const charCount = form.contenido.length
  const activeLimit = form.redes.reduce<number | null>((min, red) => {
    const limit = CHAR_LIMITS[red]
    if (!limit) return min
    return min === null ? limit : Math.min(min, limit)
  }, null)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Título (referencia interna)" htmlFor="titulo" required error={errors.titulo}>
        <Input id="titulo" value={form.titulo} onChange={e => set('titulo', e.target.value)}
          error={!!errors.titulo} placeholder="Ej: Anuncio partida junio, Foto reunión mayo…" />
      </FormField>

      <FormField label="Contenido" htmlFor="contenido" required error={errors.contenido}>
        <Textarea id="contenido" value={form.contenido} onChange={e => set('contenido', e.target.value)}
          error={!!errors.contenido} rows={6}
          placeholder="Escribe aquí el texto que irá en las redes sociales…" />
        <div className="flex justify-between mt-1 text-xs text-gray-400 dark:text-gray-500">
          <span>{charCount} caracteres</span>
          {activeLimit && (
            <span className={charCount > activeLimit ? 'text-red-500 font-medium' : ''}>
              Límite {activeLimit} (Twitter/X) — {activeLimit - charCount > 0 ? `${activeLimit - charCount} restantes` : `${charCount - activeLimit} excedidos`}
            </span>
          )}
        </div>
      </FormField>

      {/* Redes sociales */}
      <FormField label="Redes sociales destino" required error={errors.redes}>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(RED_SOCIAL_LABELS) as [RedSocial, string][]).map(([red, label]) => (
            <label key={red}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                form.redes.includes(red)
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
              <input type="checkbox" className="sr-only"
                checked={form.redes.includes(red)} onChange={() => toggleRed(red)} />
              {label}
            </label>
          ))}
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Estado" htmlFor="estado">
          <Select id="estado" value={form.estado} onChange={e => set('estado', e.target.value as EstadoPublicacion)}>
            {(Object.entries(ESTADO_PUBLICACION_LABELS) as [EstadoPublicacion, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Fecha de publicación" htmlFor="fecha" hint="Prevista o real">
          <DatePicker id="fecha" value={form.fecha_publicacion}
            onChange={e => set('fecha_publicacion', e.target.value)} />
        </FormField>
      </div>

      <FormField label="Evento relacionado" hint="Opcional">
        <ComboboxBuscable options={eventosOptions} value={form.evento_id}
          onChange={v => set('evento_id', v)} placeholder="Vincula a un evento…" />
      </FormField>

      <FormField label="Notas internas" htmlFor="notas">
        <Textarea id="notas" value={form.notas} onChange={e => set('notas', e.target.value)}
          placeholder="Instrucciones para el equipo, hashtags, menciones…" rows={2} />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear publicación'}
        </button>
      </div>
    </form>
  )
}
