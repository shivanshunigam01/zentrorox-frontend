import { cn } from '@/lib/utils'

interface StickerBadgeProps {
  emoji: string
  label: string
  className?: string
  delay?: number
}

export function StickerBadge({ emoji, label, className, delay = 0 }: StickerBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-charcoal shadow-lg backdrop-blur-sm animate-float',
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-base leading-none">{emoji}</span>
      {label}
    </div>
  )
}
