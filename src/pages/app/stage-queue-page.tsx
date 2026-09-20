import { Car } from 'lucide-react'
import { LiveTablePage } from './live-table-page'
import { serviceVisitsApi } from '@/lib/api'
import { STAGE_UI_PATHS } from '@/lib/stage-paths'

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
        { key: 'status', label: 'Status' },
        { key: 'jobCardNumber', label: 'Job Card' },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await serviceVisitsApi.list(token, { stage, search }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
      getViewLink={(row) => {
        const path = STAGE_UI_PATHS[stage]
        return `/app/service-visits/${row.id}/${path}`
      }}
    />
  )
}
