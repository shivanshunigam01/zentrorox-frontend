import { Car } from 'lucide-react'
import { LiveTablePage } from './live-table-page'
import { Badge } from '@/components/ui/badge'
import { serviceVisitsApi } from '@/lib/api'
import { STAGE_UI_PATHS } from '@/lib/stage-paths'

function formatStageLabel(stage?: string) {
  if (!stage) return '—'
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface StageQueuePageProps {
  stage: keyof typeof STAGE_UI_PATHS
  title: string
  description: string
}

export function StageQueuePage({ stage, title, description }: StageQueuePageProps) {
  return (
    <LiveTablePage
      title={title}
      description={description}
      icon={Car}
      gradient="from-brand-charcoal to-slate-800"
      emoji="🚗"
      columns={[
        { key: 'visitNumber', label: 'Visit #' },
        { key: 'registrationNumber', label: 'Registration' },
        { key: 'customerName', label: 'Customer' },
        { key: 'make', label: 'Make/Model', render: (_, row) => `${row.make ?? ''} ${row.model ?? ''}`.trim() },
        {
          key: 'queueStageStatus',
          label: 'Phase Status',
          render: (value) => {
            const status = String(value ?? '').toUpperCase()
            if (status === 'CURRENT') return <Badge variant="warning">At Stage</Badge>
            if (status === 'COMPLETED') return <Badge variant="success">Completed</Badge>
            return <Badge>{formatStageLabel(status) || '—'}</Badge>
          },
        },
        {
          key: 'currentStage',
          label: 'Current Stage',
          render: (value) => <Badge variant="info">{formatStageLabel(String(value ?? ''))}</Badge>,
        },
        { key: 'status', label: 'Visit Status' },
        { key: 'jobCardNumber', label: 'Job Card' },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await serviceVisitsApi.list(token, { stage, search, limit: 100 }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
      getViewLink={(row) => {
        const queueStatus = String(row.queueStageStatus ?? '').toUpperCase()
        const currentStage = String(row.currentStage ?? '')
        const currentPath = STAGE_UI_PATHS[currentStage as keyof typeof STAGE_UI_PATHS]
        const stagePath = STAGE_UI_PATHS[stage]
        const path = queueStatus === 'COMPLETED' && currentPath ? currentPath : stagePath
        return `/app/service-visits/${row.id}/${path}`
      }}
      refreshOnFocus
    />
  )
}
