import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StickyActionBarProps = {
  children: ReactNode
  className?: string
  /** Extra classes for the inner flex row */
  innerClassName?: string
}

/**
 * Opaque fixed footer for workspace save/action buttons.
 * Pair with `pb-32` (or `workspace-page-pad`) on the page root so content clears the bar while scrolling.
 */
export function StickyActionBar({ children, className, innerClassName }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:left-64',
        'border-t border-brand-border bg-white',
        'shadow-[0_-16px_48px_rgba(23,23,23,0.14)]',
        'before:absolute before:inset-0 before:-top-px before:bg-white before:-z-10',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6 sm:py-3.5',
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Bottom padding for pages that use StickyActionBar */
export const WORKSPACE_ACTION_BAR_PAD = 'pb-32 sm:pb-36'
