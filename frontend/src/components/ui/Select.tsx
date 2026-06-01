import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-lg border px-3.5 py-2.5 pr-9 text-sm bg-white text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          error ? 'border-red-300 bg-red-50' : 'border-gray-200',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  ),
)
Select.displayName = 'Select'
