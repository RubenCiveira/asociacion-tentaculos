import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border px-3.5 py-2.5 text-sm',
        'bg-white dark:bg-gray-800',
        'text-gray-900 dark:text-gray-100',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
        'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
        'disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed',
        error
          ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
          : 'border-gray-200 dark:border-gray-600',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
