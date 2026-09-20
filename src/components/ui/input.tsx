import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-brand-text">
            {label}
            {props.required && <span className="text-brand-danger ml-0.5">*</span>}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm transition-colors',
            'placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-brand-danger focus:ring-brand-danger',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-brand-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-brand-muted">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
