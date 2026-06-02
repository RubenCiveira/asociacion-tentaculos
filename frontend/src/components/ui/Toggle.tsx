import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  disabled?: boolean
  id?: string
}

export function Toggle({ checked, onChange, label, disabled, id }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
        />
        <div className={cn(
          'w-10 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700',
        )} />
        <div className={cn(
          'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
          checked && 'translate-x-4',
        )} />
      </div>
      {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  )
}
