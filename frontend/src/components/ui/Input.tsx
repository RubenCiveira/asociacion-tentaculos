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
        'w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white text-gray-900 placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
        'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
        error ? 'border-red-300 bg-red-50' : 'border-gray-200',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
