import { VehicleHeader } from './vehicle-header'
import { WorkflowStepper } from './workflow-stepper'
import type { ServiceVisit } from '@/types'

interface ServiceVisitWorkspaceProps {
  visit: ServiceVisit
  children?: React.ReactNode
  stageTitle?: string
}

export function ServiceVisitWorkspace({ visit, children, stageTitle }: ServiceVisitWorkspaceProps) {
  return (
    <div className="space-y-4">
      <VehicleHeader visit={visit} />
      <div className="rounded-[var(--radius-card)] border border-brand-border bg-white shadow-[var(--shadow-card)] px-4 py-3">
        <WorkflowStepper stages={visit.stages} visitId={visit.id} />
      </div>
      {stageTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-brand-charcoal">{stageTitle}</h3>
        </div>
      )}
      {children}
    </div>
  )
}
