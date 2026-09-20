import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  image?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  image,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      {image ? (
        <div className="relative mb-6">
          <div className="absolute -inset-3 bg-brand-yellow/10 rounded-full blur-xl animate-pulse-soft" />
          <img
            src={image}
            alt=""
            className="relative h-32 w-32 object-contain drop-shadow-lg animate-float"
          />
        </div>
      ) : Icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-yellow/15 ring-4 ring-brand-yellow/10">
          <Icon className="h-8 w-8 text-brand-charcoal" />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-brand-charcoal">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-brand-muted leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
