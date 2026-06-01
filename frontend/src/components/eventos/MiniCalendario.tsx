import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Evento, TipoJuego } from '@/types'

const TIPO_COLOR: Record<TipoJuego, string> = {
  rol:      'bg-purple-500',
  wargame:  'bg-red-500',
  eurogame: 'bg-blue-500',
  party:    'bg-yellow-500',
  otro:     'bg-gray-400',
}

interface Props {
  eventos: Evento[]
  selectedDate: Date | null
  onSelectDate: (d: Date) => void
}

export function MiniCalendario({ eventos, selectedDate, onSelectDate }: Props) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })
    const result: Date[][] = []
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7))
    return result
  }, [cursor])

  const eventsByDate = useMemo(() => {
    const m = new Map<string, Evento[]>()
    eventos.forEach(e => {
      const key = e.fecha_inicio.slice(0, 10)
      const arr = m.get(key) ?? []
      arr.push(e)
      m.set(key, arr)
    })
    return m
  }, [eventos])

  function prev() { setCursor(d => startOfMonth(new Date(d.getFullYear(), d.getMonth() - 1, 1))) }
  function next() { setCursor(d => startOfMonth(new Date(d.getFullYear(), d.getMonth() + 1, 1))) }

  const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 rounded hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-700 capitalize">
          {format(cursor, 'MMMM yyyy', { locale: es })}
        </span>
        <button onClick={next} className="p-1 rounded hover:bg-gray-100 text-gray-500">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map(day => {
            const key = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate.get(key) ?? []
            const inMonth = isSameMonth(day, cursor)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const today = isToday(day)

            return (
              <button
                key={key}
                onClick={() => onSelectDate(day)}
                className={cn(
                  'flex flex-col items-center py-1 rounded-lg transition-colors',
                  inMonth ? 'text-gray-700' : 'text-gray-300',
                  isSelected && 'bg-brand-600 text-white',
                  !isSelected && today && 'font-bold text-brand-600',
                  !isSelected && inMonth && 'hover:bg-gray-100',
                )}
              >
                <span className="text-xs leading-5">{format(day, 'd')}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-1 h-1 rounded-full',
                          isSelected ? 'bg-white' : TIPO_COLOR[e.tipo_juego],
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
