import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
  error:   'bg-white dark:bg-gray-900 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  info:    'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-500',
  error:   'text-red-500',
  info:    'text-blue-500',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const Icon = ICONS[toast.type]
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm w-full',
        STYLES[toast.type],
      )}
    >
      <Icon size={18} className={cn('flex-shrink-0 mt-0.5', ICON_STYLES[toast.type])} />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Cerrar"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((type: ToastType, message: string) => {
    const id = nextId++
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => remove(id), 4000)
  }, [remove])

  const value: ToastContextValue = {
    success: (msg) => add('success', msg),
    error:   (msg) => add('error', msg),
    info:    (msg) => add('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto animate-fade-in">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
