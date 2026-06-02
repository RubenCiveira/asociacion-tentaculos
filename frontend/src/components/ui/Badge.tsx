import { cn } from '@/lib/utils'

export type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple'

interface BadgeProps {
  label: string
  variant: BadgeVariant
  dot?: boolean
}

const VARIANTS: Record<BadgeVariant, string> = {
  green:  'bg-green-50  dark:bg-green-900/30  text-green-700  dark:text-green-400  border-green-200  dark:border-green-800',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  red:    'bg-red-50    dark:bg-red-900/30    text-red-700    dark:text-red-400    border-red-200    dark:border-red-800',
  blue:   'bg-blue-50   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400   border-blue-200   dark:border-blue-800',
  gray:   'bg-gray-100  dark:bg-gray-800      text-gray-600   dark:text-gray-400   border-gray-200   dark:border-gray-700',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
}

const DOT_VARIANTS: Record<BadgeVariant, string> = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  gray:   'bg-gray-400',
  purple: 'bg-purple-500',
}

export function Badge({ label, variant, dot = false }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
      VARIANTS[variant],
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT_VARIANTS[variant])} />}
      {label}
    </span>
  )
}
