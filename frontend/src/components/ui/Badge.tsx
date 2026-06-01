import { cn } from '@/lib/utils'

export type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple'

interface BadgeProps {
  label: string
  variant: BadgeVariant
  dot?: boolean
}

const VARIANTS: Record<BadgeVariant, string> = {
  green:  'bg-green-50  text-green-700  border-green-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  red:    'bg-red-50    text-red-700    border-red-200',
  blue:   'bg-blue-50   text-blue-700   border-blue-200',
  gray:   'bg-gray-100  text-gray-600   border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
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
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        VARIANTS[variant],
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT_VARIANTS[variant])} />}
      {label}
    </span>
  )
}
