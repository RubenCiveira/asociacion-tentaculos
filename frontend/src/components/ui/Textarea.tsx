import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={3}
      className={cn(
        'w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white text-gray-900 placeholder:text-gray-400 resize-y',
        'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
        'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
        error ? 'border-red-300 bg-red-50' : 'border-gray-200',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
