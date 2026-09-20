import { useMasterDropdown } from '@/hooks/use-master-data'
import type { MasterCategory } from '@/lib/master-categories'
import { cn } from '@/lib/utils'

interface MasterSelectProps {
  category: MasterCategory
  value?: string
  onChange: (value: string) => void
  parentCode?: string
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export function MasterSelect({
  category,
  value,
  onChange,
  parentCode,
  placeholder = 'Select...',
  label,
  required,
  className,
  disabled,
}: MasterSelectProps) {
  const { options, loading } = useMasterDropdown(category, parentCode)

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-brand-text">
          {label}
          {required && <span className="text-brand-danger ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading || (category === 'VEHICLE_MODEL' && !parentCode)}
        className="flex h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow disabled:opacity-50"
      >
        <option value="">
          {loading ? 'Loading...' : category === 'VEHICLE_MODEL' && !parentCode ? 'Select make first' : placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
