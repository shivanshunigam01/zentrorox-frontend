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
    <div className={cn('page-banner no-print relative overflow-hidden rounded-2xl bg-gradient-to-r p-6 text-white', gradient, className)}>
      {illustration && (
        <img
          src={illustration}
          alt=""
          className="absolute right-4 top-1/2 -translate-y-1/2 h-28 w-28 opacity-20 animate-float pointer-events-none"
        />
      )}
      {emoji && (
        <span className="absolute right-6 top-6 text-4xl opacity-30 animate-wiggle pointer-events-none">{emoji}</span>
      )}
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-yellow/20 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-brand-yellow" />
            </span>
            {title}
          </h1>
          {description && <p className="text-sm text-white/65 mt-1.5 max-w-lg">{description}</p>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {stats?.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2.5 text-center min-w-[80px] border border-white/10">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[11px] text-white/55">{s.label}</p>
            </div>
          ))}
          {actions}
        </div>
      </div>
    </div>
  )
}
