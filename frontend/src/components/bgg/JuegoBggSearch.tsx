import { useEffect, useRef, useState } from 'react'
import { Search, X, ExternalLink, Loader2, Dices } from 'lucide-react'
import { useBuscarJuegosBgg } from '@/hooks/useBgg'
import { bggUrl } from '@/types'
import { cn } from '@/lib/utils'

export interface JuegoBggSeleccion {
  bgg_id: number
  bgg_nombre: string
  bgg_thumbnail: string | null
}

interface Props {
  value: JuegoBggSeleccion | null
  onChange: (value: JuegoBggSeleccion | null) => void
  /** Se llama al seleccionar un juego, por si el formulario quiere autocompletar el nombre. */
  onSeleccion?: (juego: JuegoBggSeleccion) => void
  disabled?: boolean
}

export function JuegoBggSearch({ value, onChange, onSeleccion, disabled }: Props) {
  const [texto, setTexto] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: resultados, isFetching, isError } = useBuscarJuegosBgg(query)

  // Debounce de la búsqueda (BGG es lento y con rate limit)
  useEffect(() => {
    const t = setTimeout(() => setQuery(texto), 450)
    return () => clearTimeout(t)
  }, [texto])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
        {value.bgg_thumbnail ? (
          <img src={value.bgg_thumbnail} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
        ) : (
          <Dices size={20} className="text-gray-400 flex-shrink-0" />
        )}
        <span className="text-sm text-gray-900 dark:text-gray-100 truncate flex-1">{value.bgg_nombre}</span>
        <a
          href={bggUrl(value.bgg_id)} target="_blank" rel="noreferrer"
          className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 p-0.5"
          title="Ver en BoardGameGeek"
        >
          <ExternalLink size={14} />
        </a>
        {!disabled && (
          <button
            type="button" onClick={() => onChange(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
            aria-label="Quitar juego"
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  }

  const mostrarResultados = open && query.trim().length >= 3

  return (
    <div ref={containerRef} className="relative">
      <div className={cn(
        'flex items-center gap-2 rounded-lg border px-3.5 py-2.5',
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600',
        'focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-transparent',
      )}>
        {isFetching
          ? <Loader2 size={15} className="text-gray-400 animate-spin flex-shrink-0" />
          : <Search size={15} className="text-gray-400 flex-shrink-0" />}
        <input
          value={texto}
          disabled={disabled}
          onChange={e => { setTexto(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Busca en BoardGameGeek…"
          className="text-sm outline-none flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:cursor-not-allowed"
        />
      </div>

      {mostrarResultados && (
        <div className="absolute z-20 w-full mt-1 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
          <ul className="max-h-60 overflow-y-auto py-1">
            {isError ? (
              <li className="px-3 py-2 text-sm text-red-500">Error al consultar BGG, inténtalo de nuevo</li>
            ) : isFetching && !resultados ? (
              <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">Buscando en BGG…</li>
            ) : (resultados ?? []).length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">Sin resultados en BGG</li>
            ) : (
              resultados!.map(r => (
                <li key={r.bgg_id}>
                  <button
                    type="button"
                    onClick={() => {
                      const sel: JuegoBggSeleccion = {
                        bgg_id: r.bgg_id,
                        bgg_nombre: r.nombre,
                        bgg_thumbnail: r.thumbnail,
                      }
                      onChange(sel)
                      onSeleccion?.(sel)
                      setOpen(false)
                      setTexto('')
                    }}
                    className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {r.thumbnail ? (
                      <img src={r.thumbnail} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                      <Dices size={18} className="text-gray-400 flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{r.nombre}</span>
                    {r.anio && <span className="text-xs text-gray-400 flex-shrink-0">{r.anio}</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400 dark:text-gray-500">
            Powered by BoardGameGeek
          </div>
        </div>
      )}
    </div>
  )
}
