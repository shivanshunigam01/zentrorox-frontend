import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { authStorage } from '@/lib/auth-storage'
import { billingApi } from '@/lib/api'
import { BillingDeliveryWorkspace } from '@/pages/app/billing-delivery-workspace'
import { RazorpayPaymentsPanel } from '@/pages/app/razorpay-payments-panel'

const TABS = [
  'READY_FOR_INVOICE',
  'DRAFT_INVOICES',
  'ISSUED_INVOICES',
  'PAYMENT_PENDING',
  'CREDIT_CLEARANCE',
  'READY_FOR_GATE_PASS',
  'GATE_PASS_ISSUED',
  'PENDING_DELIVERY',
  'DELIVERED',
  'FEEDBACK_PENDING',
] as const

export function BillingDeliveryPage() {
  const { visitId } = useParams<{ visitId?: string }>()
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const [tab, setTab] = useState<(typeof TABS)[number]>('READY_FOR_INVOICE')
  const [page, setPage] = useState(1)
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [queue, setQueue] = useState({ items: [] as unknown[], total: 0, limit: 20 })
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null)
  const [showPayments, setShowPayments] = useState(false)
  const loadWorkspace = useCallback(() => {
    if (!token || !visitId) return
    billingApi.visitWorkspace(token, visitId, branchId).then(setWorkspace).catch(() => setWorkspace({ visitId }))
  }, [token, visitId, branchId])

  const loadDashboard = useCallback(async () => {
    if (!token) return
    setKpis(await billingApi.dashboard(token, branchId) as Record<string, number>)
  }, [token, branchId])

  const loadQueue = useCallback(async () => {
    if (!token) return
    const data = await billingApi.queue(token, { tab, page, limit: 20 }, branchId)
    setQueue(data as { items: unknown[]; total: number; limit: number })
  }, [token, branchId, tab, page])

  useEffect(() => { loadDashboard() }, [loadDashboard])
  useEffect(() => { if (!visitId) loadQueue() }, [visitId, loadQueue])

  useEffect(() => {
    if (!token || !visitId) {
      setWorkspace(null)
      return
    }
    loadWorkspace()
  }, [token, visitId, branchId, loadWorkspace])

  const openVisit = (id: string) => navigate(`/app/workshop/billing-delivery/${id}`)

  if (visitId && workspace) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate('/app/workshop/billing-delivery')}>← Billing queue</Button>
        <h1 className="text-2xl font-semibold">Billing & delivery workspace</h1>
        <BillingDeliveryWorkspace visitId={visitId} token={token!} branchId={branchId} workspace={workspace} onRefresh={loadWorkspace} />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-semibold">Billing & delivery</h1>
          <p className="text-sm text-muted-foreground">Invoice, payments, gate pass, handover & feedback</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['QC passed / ready', kpis.vehiclesQcPassed],
          ['Outstanding', kpis.outstandingReceivables],
          ['Issued today', kpis.invoicesIssued],
          ['Delivered today', kpis.vehiclesDeliveredToday],
          ['Razorpay links', kpis.razorpayLinksActive],
        ].map(([label, val]) => (
          <Card key={String(label)}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{val ?? 0}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm" variant={showPayments ? 'default' : 'outline'} onClick={() => setShowPayments((v) => !v)}>
          {showPayments ? 'Hide' : 'Show'} Razorpay monitor
        </Button>
        {TABS.map((t) => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => { setTab(t); setPage(1) }}>
            {t.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>

      {showPayments && token && <RazorpayPaymentsPanel token={token} branchId={branchId} />}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.items.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No rows for this tab.</td></tr>
              ) : (
                queue.items.map((row) => {
                  const r = row as Record<string, string>
                  const id = r.serviceVisitId ?? r._id
                  return (
                    <tr key={id} className="border-b">
                      <td className="p-3">{r.visitNumber ?? r.invoiceNumber ?? id}</td>
                      <td className="p-3">{r.billingStatus ?? r.status ?? r.paymentStatus}</td>
                      <td className="p-3">
                        {r.serviceVisitId ? (
                          <Button size="sm" onClick={() => openVisit(r.serviceVisitId)}>Open</Button>
                        ) : (
                          <Button size="sm" onClick={() => navigate(`/app/workshop/billing-delivery/${r.serviceVisitId}`)}>View</Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <PaginationBar page={page} totalPages={Math.max(1, Math.ceil(queue.total / queue.limit))} total={queue.total} limit={queue.limit} onPageChange={setPage} />
    </div>
  )
}
