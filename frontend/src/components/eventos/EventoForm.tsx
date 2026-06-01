import { useState, useMemo } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { ComboboxBuscable } from '@/components/ui/ComboboxBuscable'
import { useLugares } from '@/hooks/useLugares'
import { useSocios } from '@/hooks/useSocios'
import { TIPO_JUEGO_LABELS, ESTADO_EVENTO_LABELS } from '@/types'
import type { Evento, TipoJuego, EstadoEvento } from '@/types'
import { Search, X } from 'lucide-react'

type FormData = {
  titulo: string
  tipo_juego: TipoJuego
  fecha_inicio: string
  fecha_fin: string
  lugar_id: string
  descripcion: string
  max_jugadores: string
  asistentes: string[]
  estado: EstadoEvento
  notas: string
}

interface Props {
  initial?: Partial<Evento>
  onSubmit: (data: Omit<FormData, 'max_jugadores'> & { max_jugadores?: number }) => void
  onCancel: () => void
  loading?: boolean
  isEdit?: boolean
}

export function EventoForm({ initial, onSubmit, onCancel, loading, isEdit }: Props) {
  const [form, setForm] = useState<FormData>({
    titulo: initial?.titulo ?? '',
    tipo_juego: initial?.tipo_juego ?? 'eurogame',
    fecha_inicio: initial?.fecha_inicio ? initial.fecha_inicio.slice(0, 16) : '',
    fecha_fin: initial?.fecha_fin ? initial.fecha_fin.slice(0, 16) : '',
    lugar_id: initial?.lugar_id ?? '',
    descripcion: initial?.descripcion ?? '',
    max_jugadores: initial?.max_jugadores?.toString() ?? '',
    asistentes: initial?.asistentes ?? [],
    estado: initial?.estado ?? 'planificado',
    notas: initial?.notas ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [socioSearch, setSocioSearch] = useState('')

  const { data: lugaresData } = useLugares({ soloActivos: true })
  const { data: sociosData } = useSocios({ soloActivos: true })

  const lugaresOptions = (lugaresData?.documents ?? []).map(l => ({
    value: l.$id, label: l.nombre,
  }))

  const sociosFiltrados = useMemo(() => {
    const q = socioSearch.toLowerCase()
    return (sociosData?.documents ?? []).filter(s =>
      !q || s.nombre.toLowerCase().includes(q) || s.apellidos.toLowerCase().includes(q),
    )
  }, [sociosData, socioSearch])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function toggleAsistente(id: string) {
    setForm(f => ({
      ...f,
      asistentes: f.asistentes.includes(id)
        ? f.asistentes.filter(a => a !== id)
        : [...f.asistentes, id],
    }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.titulo.trim()) e.titulo = 'El título es obligatorio'
    if (!form.fecha_inicio) e.fecha_inicio = 'La fecha de inicio es obligatoria'
    if (form.max_jugadores && isNaN(Number(form.max_jugadores))) e.max_jugadores = 'Debe ser un número'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    const { max_jugadores, ...rest } = form
    onSubmit({ ...rest, max_jugadores: max_jugadores ? Number(max_jugadores) : undefined })
  }

  const socioMap = useMemo(() => {
    const m = new Map<string, string>()
    sociosData?.documents.forEach(s => m.set(s.$id, `${s.nombre} ${s.apellidos}`))
    return m
  }, [sociosData])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Título" htmlFor="titulo" required error={errors.titulo}>
        <Input id="titulo" value={form.titulo} onChange={e => set('titulo', e.target.value)}
          error={!!errors.titulo} placeholder="Ej: Partida de Catan, Campaña D&D…" />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tipo de juego" htmlFor="tipo">
          <Select id="tipo" value={form.tipo_juego} onChange={e => set('tipo_juego', e.target.value as TipoJuego)}>
            {(Object.entries(TIPO_JUEGO_LABELS) as [TipoJuego, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Estado" htmlFor="estado">
          <Select id="estado" value={form.estado} onChange={e => set('estado', e.target.value as EstadoEvento)}>
            {(Object.entries(ESTADO_EVENTO_LABELS) as [EstadoEvento, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Fecha y hora de inicio" htmlFor="fi" required error={errors.fecha_inicio}>
          <DatePicker id="fi" withTime value={form.fecha_inicio}
            onChange={e => set('fecha_inicio', e.target.value)} error={!!errors.fecha_inicio} />
        </FormField>
        <FormField label="Fecha y hora de fin" htmlFor="ff">
          <DatePicker id="ff" withTime value={form.fecha_fin}
            onChange={e => set('fecha_fin', e.target.value)} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Lugar">
          <ComboboxBuscable options={lugaresOptions} value={form.lugar_id}
            onChange={v => set('lugar_id', v)} placeholder="Selecciona lugar…" />
        </FormField>
        <FormField label="Máx. jugadores" htmlFor="max" error={errors.max_jugadores}>
          <Input id="max" type="number" min="1" value={form.max_jugadores}
            onChange={e => set('max_jugadores', e.target.value)}
            error={!!errors.max_jugadores} placeholder="Sin límite" />
        </FormField>
      </div>

      <FormField label="Descripción" htmlFor="desc">
        <Textarea id="desc" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
          placeholder="Información sobre la partida, escenario, requisitos…" rows={2} />
      </FormField>

      {/* Asistentes */}
      <FormField label={`Asistentes (${form.asistentes.length} seleccionados)`}>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <input value={socioSearch} onChange={e => setSocioSearch(e.target.value)}
              placeholder="Buscar socios…"
              className="text-sm outline-none flex-1 text-gray-900 placeholder:text-gray-400" />
            {socioSearch && (
              <button type="button" onClick={() => setSocioSearch('')}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
            {sociosFiltrados.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
            ) : sociosFiltrados.map(s => (
              <label key={s.$id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" className="rounded"
                  checked={form.asistentes.includes(s.$id)}
                  onChange={() => toggleAsistente(s.$id)} />
                <span className="text-sm text-gray-800">{s.apellidos}, {s.nombre}</span>
              </label>
            ))}
          </div>
        </div>
        {form.asistentes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.asistentes.map(id => (
              <span key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs">
                {socioMap.get(id) ?? id}
                <button type="button" onClick={() => toggleAsistente(id)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </FormField>

      <FormField label="Notas" htmlFor="notas">
        <Textarea id="notas" value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear evento'}
        </button>
      </div>
    </form>
  )
}
