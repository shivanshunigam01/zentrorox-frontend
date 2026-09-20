import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { BRAND, LOGO_SIZES } from '@/lib/brand'

interface LogoProps {
  className?: string
  variant?: 'default' | 'light' | 'compact' | 'full'
  showTagline?: boolean
  to?: string
  size?: keyof typeof LOGO_SIZES
}

export function Logo({
  className,
  variant = 'default',
  showTagline = false,
  to = '/',
  size,
}: LogoProps) {
  const heightClass = size
    ? LOGO_SIZES[size]
    : variant === 'full'
      ? LOGO_SIZES.xl
      : variant === 'compact'
        ? LOGO_SIZES.sm
        : LOGO_SIZES.md

  const content = (
    <div className={cn('flex flex-col', className)}>
      <img
        src={BRAND.logo}
        alt={BRAND.logoAlt}
        className={cn(
          'w-auto object-contain object-left',
          heightClass,
          variant === 'full' && 'max-w-[280px]',
          variant !== 'full' && 'max-w-[200px]',
        )}
      />
      {showTagline && variant !== 'full' && (
        <p className={cn(
          'text-[10px] leading-tight mt-1 font-medium tracking-wide',
          variant === 'light' ? 'text-white/70' : 'text-brand-muted',
        )}>
          {BRAND.pillars}
        </p>
      )}
    </div>
  )

  return to ? (
    <Link to={to} className="inline-flex group">{content}</Link>
  ) : (
    <div className="inline-flex">{content}</div>
  )
}
