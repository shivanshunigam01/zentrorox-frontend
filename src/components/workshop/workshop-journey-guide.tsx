import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { authStorage } from '@/lib/auth-storage'
import { hasAnyPermission } from '@/lib/permissions'
import {
  WORKSHOP_JOURNEY,
  type WorkshopJourneyStep,
  type WorkshopJourneyStepId,
} from '@/lib/workshop-journey'

type Props = {
  stepId: WorkshopJourneyStepId
  className?: string
}

function visibleSteps(user: ReturnType<typeof authStorage.getUser>): WorkshopJourneyStep[] {
  return WORKSHOP_JOURNEY.filter((s) => hasAnyPermission(user, s.permissions))
}

export function WorkshopJourneyGuide({ stepId, className }: Props) {
  const user = authStorage.getUser()
  const steps = visibleSteps(user)
  const current = steps.find((s) => s.id === stepId) ?? WORKSHOP_JOURNEY.find((s) => s.id === stepId)
  if (!current) return null

  const idx = steps.findIndex((s) => s.id === stepId)
  const prev = idx > 0 ? steps[idx - 1] : null
  const next = idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : null

  return (
    <div className={cn('rounded-xl border border-brand-border/80 bg-white shadow-sm overflow-hidden', className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-border/60 bg-brand-grey/40 px-3 py-2 text-xs font-medium text-brand-muted">
        <MapPin className="h-3.5 w-3.5 text-brand-charcoal" />
        <span>Workshop journey</span>
        <span className="text-brand-border">|</span>
        <span className="text-brand-charcoal">Step {current.order} of {WORKSHOP_JOURNEY.length}</span>
      </div>

      <div className="hidden sm:flex gap-0 overflow-x-auto border-b border-brand-border/40 px-2 py-2">
        {WORKSHOP_JOURNEY.map((s) => {
          const allowed = hasAnyPermission(user, s.permissions)
          const active = s.id === stepId
          return (
            <Link
              key={s.id}
              to={allowed ? s.path : '#'}
              onClick={(e) => { if (!allowed) e.preventDefault() }}
              className={cn(
                'flex items-center gap-1.5 shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors',
                active && 'bg-brand-yellow/25 text-brand-charcoal',
                !active && allowed && 'text-brand-muted hover:bg-brand-grey/80 hover:text-brand-charcoal',
                !allowed && 'text-brand-muted/40 cursor-not-allowed',
              )}
              title={allowed ? s.title : `Requires: ${s.permissions.join(', ')}`}
            >
              <Circle className={cn('h-2 w-2', active ? 'fill-brand-yellow text-brand-yellow' : 'fill-transparent')} />
              {s.order}. {s.title}
            </Link>
          )
        })}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">You are here</p>
          <h2 className="text-lg font-semibold text-brand-charcoal">{current.title}</h2>
          <p className="text-sm text-brand-muted mt-1">{current.summary}</p>
          <p className="text-xs text-brand-muted mt-2">
            <span className="font-medium text-brand-text">Before this:</span> {current.prerequisites}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-1">
          {prev ? (
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <Link to={prev.path}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous: {prev.title}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" className="justify-center sm:justify-end" asChild>
            <Link to={current.path}>
              {current.actionLabel}
            </Link>
          </Button>
          {next ? (
            <Button variant="secondary" size="sm" className="justify-end" asChild>
              <Link to={next.path}>
                Next: {next.title}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  )
}
