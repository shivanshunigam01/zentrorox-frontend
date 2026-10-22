import { useEffect, useState } from 'react'
import { CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react'
import { appToast, type AppToastItem, type ToastVariant } from '@/lib/app-toast'
import { cn } from '@/lib/utils'

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-green-200 bg-white text-brand-charcoal shadow-[0_12px_40px_rgba(22,163,74,0.15)]',
  error: 'border-red-200 bg-white text-brand-charcoal shadow-[0_12px_40px_rgba(220,38,38,0.12)]',
  info: 'border-blue-200 bg-white text-brand-charcoal shadow-[0_12px_40px_rgba(37,99,235,0.12)]',
  loading: 'border-brand-border bg-white text-brand-charcoal shadow-[0_12px_40px_rgba(0,0,0,0.1)]',
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'loading') {
    return <Loader2 className="h-5 w-5 shrink-0 text-brand-yellow animate-spin" />
  }
  if (variant === 'success') {
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-success" />
  }
  if (variant === 'error') {
    return <XCircle className="h-5 w-5 shrink-0 text-brand-danger" />
  }
  return <Info className="h-5 w-5 shrink-0 text-brand-info" />
}

function ToastCard({ item }: { item: AppToastItem }) {
  return (
    <div
      role="status"
      className={cn(
        'app-toast-enter pointer-events-auto flex w-[min(100vw-2rem,22rem)] items-start gap-3 rounded-xl border px-4 py-3',
        variantStyles[item.variant],
      )}
    >
      <ToastIcon variant={item.variant} />
      <p className="text-sm font-medium leading-snug flex-1 pt-0.5">{item.message}</p>
      {item.variant !== 'loading' && (
        <button
          type="button"
          className="rounded-md p-1 text-brand-muted hover:bg-brand-grey hover:text-brand-charcoal"
          onClick={() => appToast.dismiss(item.id)}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function AppToaster() {
  const [queue, setQueue] = useState<AppToastItem[]>([])

  useEffect(() => appToast.subscribe(setQueue), [])

  if (queue.length === 0) return null

  return (
    <div
      className="fixed top-[4.5rem] right-3 sm:right-6 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {queue.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  )
}
