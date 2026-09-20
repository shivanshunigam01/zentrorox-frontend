import { Link } from 'react-router-dom'
import { Check, Pause, X, SkipForward, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowStage } from '@/types'

interface WorkflowStepperProps {
  stages: WorkflowStage[]
  visitId: string
  compact?: boolean
}

const statusStyles: Record<string, { ring: string; bg: string; text: string }> = {
  completed: { ring: 'ring-brand-success/30', bg: 'bg-brand-success text-white', text: 'text-brand-success' },
  current: { ring: 'ring-brand-yellow/40', bg: 'bg-brand-yellow text-brand-charcoal shadow-md shadow-brand-yellow/20', text: 'text-brand-charcoal font-semibold' },
  on_hold: { ring: 'ring-brand-warning/30', bg: 'bg-brand-warning text-white', text: 'text-brand-warning' },
  rejected: { ring: 'ring-brand-danger/30', bg: 'bg-brand-danger text-white', text: 'text-brand-danger' },
  skipped: { ring: 'ring-brand-muted/30', bg: 'bg-brand-muted text-white', text: 'text-brand-muted' },
  not_started: { ring: 'ring-brand-border', bg: 'bg-white text-brand-muted border-2 border-brand-border', text: 'text-brand-muted' },
}

function StageIcon({ status }: { status: string }) {
  if (status === 'completed') return <Check className="h-3 w-3" strokeWidth={3} />
  if (status === 'on_hold') return <Pause className="h-3 w-3" />
  if (status === 'rejected') return <X className="h-3 w-3" />
  if (status === 'skipped') return <SkipForward className="h-3 w-3" />
  if (status === 'current') return <Circle className="h-2 w-2 fill-current" />
  return null
}

export function WorkflowStepper({ stages, visitId, compact = false }: WorkflowStepperProps) {
  return (
    <div className="overflow-x-auto pb-1 scrollbar-thin">
      <div className={cn('flex items-center gap-0.5 min-w-max', compact ? 'px-1' : 'px-2 py-1')}>
        {stages.map((stage, index) => {
          const styles = statusStyles[stage.status] ?? statusStyles.not_started
          const isClickable = stage.status !== 'not_started' && stage.path
          const isCurrent = stage.status === 'current'

          const content = (
            <div className={cn('flex flex-col items-center gap-1.5 min-w-[68px]', isCurrent && 'scale-105')}>
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ring-2',
                  styles.bg,
                  styles.ring,
                  isClickable && 'cursor-pointer hover:scale-110',
                  isCurrent && 'h-8 w-8',
                )}
              >
                <StageIcon status={stage.status} />
              </div>
              <span className={cn('text-[9px] font-medium text-center leading-tight max-w-[68px]', styles.text)}>
                {stage.label}
              </span>
            </div>
          )

          return (
            <div key={stage.id} className="flex items-center">
              {isClickable ? (
                <Link to={`/app/service-visits/${visitId}/${stage.path}`}>{content}</Link>
              ) : (
                content
              )}
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-3 mx-0.5 rounded-full transition-colors',
                    stage.status === 'completed' ? 'bg-brand-success' :
                    stage.status === 'current' ? 'bg-gradient-to-r from-brand-yellow to-brand-border' :
                    'bg-brand-border',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
