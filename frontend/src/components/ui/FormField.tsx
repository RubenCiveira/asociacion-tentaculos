import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  hint?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, htmlFor, error, required, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
