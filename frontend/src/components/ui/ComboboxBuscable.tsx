import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { ChevronDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxBuscableProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  emptyMessage?: string
}

export function ComboboxBuscable({
  options,
  value,
  onChange,
  placeholder = 'Selecciona…',
  disabled,
  error,
  emptyMessage = 'Sin resultados',
}: ComboboxBuscableProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.value === value)

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    if (!open) setQuery('')
    else setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'Enter' && filtered.length === 1) {
      onChange(filtered[0].value)
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm bg-white text-left',
          'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          error ? 'border-red-300' : 'border-gray-200',
        )}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={e => { e.stopPropagation(); onChange('') }}
              onKeyDown={e => e.key === 'Enter' && onChange('')}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
              aria-label="Limpiar"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </button>

      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Buscar…"
              className="text-sm outline-none flex-1 text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">{emptyMessage}</li>
            ) : (
              filtered.map(opt => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                      opt.value === value && 'bg-brand-50 text-brand-700 font-medium',
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
