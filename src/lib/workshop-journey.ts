/** Ordered front-office → delivery path for workshop UX guidance */

export type WorkshopJourneyStepId =
  | 'booking'
  | 'receiving'
  | 'inspection'
  | 'estimate'
  | 'approval'
  | 'job_card'
  | 'wip'
  | 'qc'
  | 'billing'

export interface WorkshopJourneyStep {
  id: WorkshopJourneyStepId
  order: number
  title: string
  path: string
  actionLabel: string
  summary: string
  /** At least one required to open the module */
  permissions: string[]
  prerequisites: string
}

export const WORKSHOP_JOURNEY: WorkshopJourneyStep[] = [
  {
    id: 'booking',
    order: 1,
    title: 'Booking & pickup',
    path: '/app/workshop/bookings',
    actionLabel: 'Open bookings',
    summary: 'Create or confirm a service booking and schedule pickup if needed.',
    permissions: ['bookings.view'],
    prerequisites: 'Start here for a new customer visit.',
  },
  {
    id: 'receiving',
    order: 2,
    title: 'Vehicle receiving',
    path: '/app/workshop/receiving-hub',
    actionLabel: 'Open receiving hub',
    summary: 'Gate-in, inventory check, photos, and capture VOC on the service visit.',
    permissions: ['service_visits.view'],
    prerequisites: 'After booking — complete gate-in and VOC before inspection.',
  },
  {
    id: 'inspection',
    order: 3,
    title: 'VOC, trial & inspection',
    path: '/app/workshop/inspection',
    actionLabel: 'Open inspection queue',
    summary: 'Assign inspector, trial run, checklist, findings, submit and supervisor review.',
    permissions: ['inspections.view'],
    prerequisites: 'Requires receiving + confirmed VOC on the visit.',
  },
  {
    id: 'estimate',
    order: 4,
    title: 'Estimate',
    path: '/app/workshop/estimates',
    actionLabel: 'Open estimates',
    summary: 'Build labour and parts estimate from inspection output and issue to customer.',
    permissions: ['estimates.view'],
    prerequisites: 'After inspection is approved.',
  },
  {
    id: 'approval',
    order: 5,
    title: 'Customer approval',
    path: '/app/workshop/approvals',
    actionLabel: 'Open approvals',
    summary: 'Record customer approval (and advance if policy requires).',
    permissions: ['approvals.view'],
    prerequisites: 'After estimate is issued.',
  },
  {
    id: 'job_card',
    order: 6,
    title: 'Job card',
    path: '/app/workshop/job-cards',
    actionLabel: 'Open job cards',
    summary: 'Create job card from approved estimate and release to workshop floor.',
    permissions: ['job_cards.view'],
    prerequisites: 'After approval and authorization.',
  },
  {
    id: 'wip',
    order: 7,
    title: 'Work in progress',
    path: '/app/workshop/wip',
    actionLabel: 'Open WIP',
    summary: 'Technicians update progress, parts consumption, and release to QC.',
    permissions: ['wip.view'],
    prerequisites: 'After job card is released to floor.',
  },
  {
    id: 'qc',
    order: 8,
    title: 'Final QC',
    path: '/app/workshop/qc',
    actionLabel: 'Open QC',
    summary: 'Quality check, road test if needed, release to billing.',
    permissions: ['qc.view'],
    prerequisites: 'After WIP is completed.',
  },
  {
    id: 'billing',
    order: 9,
    title: 'Billing & delivery',
    path: '/app/workshop/billing-delivery',
    actionLabel: 'Open billing',
    summary: 'Invoice, Razorpay / payment, gate pass and vehicle delivery.',
    permissions: ['billing.view'],
    prerequisites: 'After QC release to invoice.',
  },
]

export function getWorkshopJourneyStep(id: WorkshopJourneyStepId): WorkshopJourneyStep | undefined {
  return WORKSHOP_JOURNEY.find((s) => s.id === id)
}

export function getWorkshopJourneyStepForPath(pathname: string): WorkshopJourneyStep | undefined {
  if (pathname.includes('/service-visits/') && pathname.includes('/receiving')) {
    return getWorkshopJourneyStep('receiving')
  }
  if (pathname.includes('/workshop/inspection')) {
    return getWorkshopJourneyStep('inspection')
  }
  if (pathname.includes('/workshop/bookings') || pathname.includes('/pickup')) {
    return getWorkshopJourneyStep('booking')
  }
  if (pathname.includes('/workshop/receiving')) {
    return getWorkshopJourneyStep('receiving')
  }
  if (pathname.includes('/workshop/estimates')) {
    return getWorkshopJourneyStep('estimate')
  }
  if (pathname.includes('/workshop/approvals')) {
    return getWorkshopJourneyStep('approval')
  }
  if (pathname.includes('/workshop/job-cards')) {
    return getWorkshopJourneyStep('job_card')
  }
  if (pathname.includes('/workshop/wip')) {
    return getWorkshopJourneyStep('wip')
  }
  if (pathname.includes('/workshop/qc')) {
    return getWorkshopJourneyStep('qc')
  }
  if (pathname.includes('/workshop/billing-delivery') || pathname.includes('/billing/')) {
    return getWorkshopJourneyStep('billing')
  }
  return undefined
}
