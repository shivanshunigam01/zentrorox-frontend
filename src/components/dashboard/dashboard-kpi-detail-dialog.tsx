import { Link } from 'react-router-dom'
import { Car, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { DashboardKpiKey, DashboardKpiListItem } from '@/lib/api'

const KPI_LINKS: Partial<Record<DashboardKpiKey, string>> = {
  vehiclesIn: '/app/workshop/wip',
  todaysBookings: '/app/workshop/bookings',
  wip: '/app/workshop/wip',
  awaitingApproval: '/app/workshop/approvals',
  partsPending: '/app/parts/stock',
  qcPending: '/app/workshop/qc',
  readyForDelivery: '/app/workshop/billing',
  revenueToday: '/app/workshop/billing',
}

function itemHref(key: DashboardKpiKey, item: DashboardKpiListItem): string | null {
  if (key === 'todaysBookings') return '/app/workshop/bookings'
  if (key === 'partsPending') return '/app/parts/stock'
  if (key === 'revenueToday') return '/app/workshop/billing'
  if (
    key === 'vehiclesIn' ||
    key === 'wip' ||
    key === 'awaitingApproval' ||
    key === 'qcPending' ||
    key === 'readyForDelivery'
  ) {
    return `/app/service-visits/${item.id}/wip`
  }
  return null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  kpiKey: DashboardKpiKey | null
  title: string
  items: DashboardKpiListItem[]
}

export function DashboardKpiDetailDialog({ open, onOpenChange, kpiKey, title, items }: Props) {
  const moduleLink = kpiKey ? KPI_LINKS[kpiKey] : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {items.length} item{items.length === 1 ? '' : 's'}
            {moduleLink ? (
              <>
                {' · '}
                <Link to={moduleLink} className="text-brand-charcoal font-medium hover:text-brand-yellow inline-flex items-center gap-1">
                  Open module <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {items.length === 0 ? (
            <p className="text-sm text-brand-muted py-8 text-center">No items in this bucket right now.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const href = kpiKey ? itemHref(kpiKey, item) : null
                const row = (
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-brand-charcoal truncate flex items-center gap-2">
                        <Car className="h-4 w-4 text-brand-yellow shrink-0" />
                        {item.title}
                      </p>
                      {item.subtitle ? (
                        <p className="text-sm text-brand-muted truncate mt-0.5">{item.subtitle}</p>
                      ) : null}
                      {item.detail ? (
                        <p className="text-xs text-brand-muted mt-1 truncate">{item.detail}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {item.status ? <Badge variant="secondary">{item.status}</Badge> : null}
                      {item.amount != null && item.amount > 0 ? (
                        <span className="text-sm font-semibold text-brand-charcoal">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
                return (
                  <li key={item.id}>
                    {href ? (
                      <Link
                        to={href}
                        onClick={() => onOpenChange(false)}
                        className="block rounded-xl border border-brand-border p-3 hover:bg-brand-yellow/10 hover:border-brand-yellow/40 transition-colors"
                      >
                        {row}
                      </Link>
                    ) : (
                      <div className="rounded-xl border border-brand-border p-3">{row}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
