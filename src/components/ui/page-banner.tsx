import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageBannerProps {
  title: string
  description?: string
  icon: LucideIcon
  gradient?: string
  illustration?: string
  emoji?: string
  stats?: { label: string; value: string | number }[]
  actions?: React.ReactNode
  className?: string
}

export function PageBanner({
  title,
  description,
  icon: Icon,
  gradient = 'from-brand-charcoal to-brand-charcoal-light',
  illustration,
  emoji,
  stats,
  actions,
  className,
}: PageBannerProps) {
  return (
    <div className={cn('page-banner no-print relative overflow-hidden rounded-2xl bg-gradient-to-r p-4 sm:p-6 text-white', gradient, className)}>
      {illustration && (
        <img
          src={illustration}
          alt=""
          className="absolute right-4 top-1/2 -translate-y-1/2 h-20 w-20 sm:h-28 sm:w-28 opacity-20 animate-float pointer-events-none hidden sm:block"
        />
      )}
      {emoji && (
        <span className="absolute right-4 sm:right-6 top-4 sm:top-6 text-3xl sm:text-4xl opacity-30 animate-wiggle pointer-events-none hidden sm:block">{emoji}</span>
      )}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
            <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow/20 backdrop-blur-sm">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-brand-yellow" />
            </span>
            <span className="truncate">{title}</span>
          </h1>
          {description && <p className="text-sm text-white/65 mt-1.5 max-w-lg">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {stats?.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 text-center min-w-[72px] sm:min-w-[80px] border border-white/10 flex-1 sm:flex-none">
              <p className="text-lg sm:text-xl font-bold">{s.value}</p>
              <p className="text-[10px] sm:text-[11px] text-white/55">{s.label}</p>
            </div>
          ))}
          {actions && <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
