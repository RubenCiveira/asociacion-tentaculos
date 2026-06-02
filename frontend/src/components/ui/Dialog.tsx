import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: DialogSize
  children: ReactNode
}

const sizeClass: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Dialog({ open, onClose, title, size = 'md', children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        className={cn(
          'relative w-full rounded-2xl shadow-xl flex flex-col max-h-[90vh]',
          'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700',
          sizeClass[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
