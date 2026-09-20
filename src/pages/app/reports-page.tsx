import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { PrintableReport } from '@/components/documents/printable-report'
import { dashboardApi } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { formatCurrency } from '@/lib/utils'

export function ReportsPage() {
  const [sections, setSections] = useState<Array<{ title: string; rows: Array<{ metric: string; value: string | number }> }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authStorage.getToken()
    const branchId = authStorage.getBranchId() ?? undefined
    if (!token) return
    dashboardApi.get(token, branchId).then((dash) => {
      const kpiRows = Object.entries(dash.kpis).map(([metric, value]) => ({
        metric: metric.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        value: typeof value === 'number' && /revenue|outstanding/i.test(metric)
          ? formatCurrency(value)
          : value,
      }))

      const workshopRows = [
        { metric: 'Bookings Today', value: dash.kpis.todaysBookings ?? 0 },
        { metric: 'Vehicles In Workshop', value: dash.kpis.vehiclesIn ?? 0 },
        { metric: 'WIP Count', value: dash.kpis.wip ?? 0 },
        { metric: 'Awaiting Approval', value: dash.kpis.awaitingApproval ?? 0 },
        { metric: 'QC Pending', value: dash.kpis.qcPending ?? 0 },
        { metric: 'Ready for Delivery', value: dash.kpis.readyForDelivery ?? 0 },
        { metric: 'Delivered Today', value: dash.kpis.deliveredToday ?? 0 },
      ]

      const financeRows = [
        { metric: 'Revenue Today', value: formatCurrency(dash.kpis.revenueToday ?? 0) },
        { metric: 'MTD Revenue', value: formatCurrency(dash.kpis.mtdRevenue ?? 0) },
        { metric: 'Outstanding Amount', value: formatCurrency(dash.kpis.outstanding ?? 0) },
        { metric: 'Parts Pending', value: dash.kpis.partsPending ?? 0 },
      ]

      setSections([
        { title: 'Workshop Operations', rows: workshopRows },
        { title: 'Finance & Inventory', rows: financeRows },
        { title: 'Full KPI Snapshot', rows: kpiRows },
      ])
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageBanner
        title="Report Centre"
        description="Production-ready workshop reports — print or save as PDF"
        icon={BarChart3}
        gradient="from-brand-charcoal to-slate-800"
        emoji="📊"
      />

      {loading ? (
        <p className="text-center text-sm text-brand-muted py-12">Loading reports...</p>
      ) : (
        <PrintableReport
          title="Workshop Control Tower Report"
          sections={sections}
          periodLabel={`Daily Snapshot — ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`}
        />
      )}
    </div>
  )
}
