import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, Loader2 } from 'lucide-react'
import { customersApi, type CustomerItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

interface CustomerSelectProps {
  value: string
  onChange: (customerId: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
  /** When true, loads (or reloads) customers — e.g. tie to dialog open. */
  active?: boolean
  label?: string
}

export function CustomerSelect({
  value,
  onChange,
  required,
  disabled,
  className,
  active = true,
  label = 'Customer',
}: CustomerSelectProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    const token = authStorage.getToken()
    if (!token) {
      setError('Please sign in again')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    customersApi
      .list(token, { limit: 100 })
      .then((res) => {
        if (!cancelled) setCustomers(res.items ?? [])
      })
      .catch((e) => {
        if (!cancelled) {
          setCustomers([])
          setError(e instanceof Error ? e.message : 'Could not load customers')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [active])

  const selectDisabled = disabled || loading || !!error

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-brand-text">
        {label}
        {required && <span className="text-brand-danger ml-0.5">*</span>}
      </label>

      {error && (
        <p className="text-xs text-brand-danger rounded-lg border border-red-200 bg-red-50 px-3 py-2">{error}</p>
      )}

      {!loading && !error && customers.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          No customers in your workshop yet.{' '}
          <Link to="/app/crm/customers" className="font-semibold text-indigo-700 underline">
            Add a customer
          </Link>{' '}
          in CRM, then return here.
        </div>
      )}

      {(loading || customers.length > 0) && (
        <Select.Root
          value={value || undefined}
          onValueChange={onChange}
          required={required}
          disabled={selectDisabled}
        >
          <Select.Trigger
            className={cn(
              'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-brand-border bg-white px-3 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-brand-yellow disabled:cursor-not-allowed disabled:opacity-50',
              !value && 'text-brand-muted',
            )}
            aria-label={label}
          >
            <Select.Value placeholder={loading ? 'Loading customers…' : 'Select customer'} />
            <Select.Icon className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin opacity-60" /> : <ChevronDown className="h-4 w-4 opacity-60" />}
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className="z-[200] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-brand-border bg-white shadow-xl"
              position="popper"
              sideOffset={6}
            >
              <Select.Viewport className="p-1">
                {customers.map((c) => (
                  <Select.Item
                    key={c.id}
                    value={c.id}
                    className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 pr-8 text-sm outline-none data-[highlighted]:bg-brand-yellow/25 data-[state=checked]:font-medium"
                  >
                    <Select.ItemText>
                      {c.name} — {c.mobile}
                      {c.code ? ` (${c.code})` : ''}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      )}

      {!loading && customers.length > 0 && (
        <p className="text-xs text-brand-muted">{customers.length} customer(s) available</p>
      )}
    </div>
  )
}
