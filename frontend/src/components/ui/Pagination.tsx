import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-gray-500">
      <span>
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            page === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-500',
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 font-medium text-gray-700">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            page === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-500',
          )}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
