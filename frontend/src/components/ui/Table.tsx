import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyState?: ReactNode
  loading?: boolean
}

export function Table<T>({ columns, rows, rowKey, onRowClick, emptyState, loading }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center">
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                {emptyState ?? 'Sin resultados'}
              </td>
            </tr>
          ) : (
            rows.map(row => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
                )}
              >
                {columns.map(col => (
                  <td key={col.key} className={cn('px-4 py-3', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
