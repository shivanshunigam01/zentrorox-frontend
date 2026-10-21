import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckSquare, Search } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ModuleFormDialog } from '@/components/ui/module-form-dialog'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { MasterSelect } from '@/components/ui/master-select'
import { authStorage } from '@/lib/auth-storage'
import { approvalsApi, paymentsApi } from '@/lib/api'

const TABS = [
  { key: 'PENDING_CUSTOMER_APPROVAL', label: 'Pending approval' },
  { key: 'FULLY_APPROVED', label: 'Fully approved' },
  { key: 'PARTIALLY_APPROVED', label: 'Partial' },
  { key: 'REVISION_REQUESTED', label: 'Revision' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ADVANCE_RECEIVED', label: 'Advance received' },
  { key: 'CREDIT_AUTHORIZATION_PENDING', label: 'Credit pending' },
  { key: 'AUTHORIZED_FOR_JOB_CARD', label: 'Job card ready' },
] as const

type QueueRow = {
  estimateId: string
  estimateNumber?: string
  estimateStatus?: string
  serviceVisitId: string
  serviceVisitNumber?: string
  vehicleRegistration?: string
  customerName?: string
  estimateTotal?: number
}

export function ApprovalManagementPage() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const [tab, setTab] = useState('PENDING_CUSTOMER_APPROVAL')
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [rows, setRows] = useState<QueueRow[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [regSearch, setRegSearch] = useState('')
  const [searchHits, setSearchHits] = useState<Array<{ vehicle: { registrationNo: string }; visits: Array<{ serviceVisitId: string; visitNumber?: string; estimateIssued?: boolean }> }>>([])
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceMode, setAdvanceMode] = useState('CASH')
  const [approvalSource, setApprovalSource] = useState('IN_PERSON')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [decision, setDecision] = useState<'FULLY_APPROVED' | 'REJECTED'>('FULLY_APPROVED')

  const loadQueue = async () => {
    if (!token) return
    const [dash, q] = await Promise.all([
      approvalsApi.dashboard(token, branchId),
      approvalsApi.queue(token, { tab, page, limit }, branchId),
    ])
    setKpis(dash)
    setRows(q.items as QueueRow[])
    setTotal(q.total)
  }

  const loadWorkspace = async (id: string) => {
    if (!token) return
    const w = await approvalsApi.workspace(token, id, branchId)
    setWorkspace(w)
  }

  useEffect(() => { loadQueue() }, [tab, page, limit])
  useEffect(() => {
    if (visitId) loadWorkspace(visitId)
    else setWorkspace(null)
  }, [visitId])

  const runVehicleSearch = async () => {
    if (!token || regSearch.length < 2) return
    const res = await approvalsApi.searchVehicle(token, regSearch, branchId)
    setSearchHits((res.vehicles ?? []) as typeof searchHits)
  }

  const submitDecision = async () => {
    if (!token || !visitId) return
    const key = crypto.randomUUID()
    await approvalsApi.recordDecision(token, visitId, {
      decision,
      approvalSource,
      customerVerificationMethod: 'STAFF_RECORDED',
      termsAccepted: true,
      idempotencyKey: key,
    }, branchId)
    setMessage('Approval recorded')
    setConfirmOpen(false)
    await loadWorkspace(visitId)
    await loadQueue()
  }

  const submitAdvance = async () => {
    if (!token || !visitId) return
    const amount = Number(advanceAmount)
    if (!amount || amount <= 0) {
      setMessage('Enter a positive advance amount')
      return
    }
    await paymentsApi.createAdvance(token, {
      serviceVisitId: visitId,
      receivedAmount: amount,
      paymentMode: advanceMode,
      idempotencyKey: crypto.randomUUID(),
    }, branchId)
    setAdvanceOpen(false)
    setAdvanceAmount('')
    setMessage('Advance recorded — verify if required for non-cash')
    await loadWorkspace(visitId)
  }

  const auth = workspace?.financialAuthorization as Record<string, unknown> | undefined
  const estimate = workspace?.estimate as Record<string, unknown> | undefined
  const rev = estimate?.revision as { items?: Array<Record<string, unknown>>; totals?: Record<string, number> } | undefined

  if (visitId && workspace) {
    return (
      <div className="space-y-6 pb-20">
        <PageBanner
          title="Approval & payment"
          description={`Visit ${String((workspace.visit as { visitNumber?: string })?.visitNumber ?? visitId)}`}
          icon={CheckSquare}
          gradient="from-green-600 to-emerald-800"
        />
        {message && <p className="text-sm text-green-700">{message}</p>}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/app/workshop/approvals')}>Back to queue</Button>
          <Button onClick={() => { setDecision('FULLY_APPROVED'); setConfirmOpen(true) }}>Approve</Button>
          <Button variant="secondary" onClick={() => { setDecision('REJECTED'); setConfirmOpen(true) }}>Reject</Button>
          <Button variant="outline" onClick={() => setAdvanceOpen(true)}>Add advance</Button>
          <Button
            variant="outline"
            disabled={!auth?.jobCardAuthorized}
            onClick={() => approvalsApi.authorizeJobCard(token!, visitId, branchId).then(() => setMessage('Job card authorization confirmed'))}
          >
            Authorize job card
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Customer & vehicle</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>{String((workspace.customer as { name?: string })?.name)} · {(workspace.customer as { mobile?: string })?.mobile}</p>
              <p>{String((workspace.vehicle as { registrationNo?: string })?.registrationNo)} — {(workspace.vehicle as { make?: string })?.make} {(workspace.vehicle as { model?: string })?.model}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Financial authorization</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <Badge variant="info">{String(auth?.financialAuthStatus ?? '—')}</Badge>
              <p>Payment: {String(auth?.paymentState ?? '—')}</p>
              <p>Confirmed advance: ₹{Number(auth?.confirmedAdvanceTotal ?? 0).toLocaleString('en-IN')}</p>
              <p>Remaining (planned): ₹{Number(auth?.remainingPlannedAmount ?? 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">Planned balance is not posted accounts receivable until invoicing.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Issued estimate (frozen snapshot)</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto text-sm">
            <p className="mb-2 font-medium">{String(estimate?.estimateNumber)} Rev {String(estimate?.currentRevisionNumber)} · {String(estimate?.status)}</p>
            <table className="w-full">
              <thead><tr className="border-b text-muted-foreground"><th className="p-2 text-left">Item</th><th className="p-2 text-right">Amount</th></tr></thead>
              <tbody>
                {(rev?.items ?? []).map((line) => (
                  <tr key={String(line.lineId)} className="border-b">
                    <td className="p-2">{String(line.description)}</td>
                    <td className="p-2 text-right">₹{Number(line.finalAmount ?? 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 font-semibold text-right">Grand total: ₹{Number(rev?.totals?.finalAmount ?? 0).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <ModuleFormDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Confirm approval" size="md"
          footer={<><Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button><Button onClick={submitDecision}>Confirm & record</Button></>}>
          <p className="text-sm">Record <strong>{decision.replace(/_/g, ' ')}</strong> for revision {String(estimate?.currentRevisionNumber)}.</p>
          <MasterSelect category="APPROVAL_SOURCE" label="Approval source" value={approvalSource} onChange={setApprovalSource} className="mt-3" />
        </ModuleFormDialog>

        <ModuleFormDialog open={advanceOpen} onOpenChange={setAdvanceOpen} title="Record advance" size="md"
          footer={<><Button variant="outline" onClick={() => setAdvanceOpen(false)}>Cancel</Button><Button onClick={submitAdvance}>Save</Button></>}>
          <div className="space-y-3">
            <Input label="Amount (₹)" type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Payment mode</label>
              <select className="h-10 w-full rounded-lg border px-3 text-sm" value={advanceMode} onChange={(e) => setAdvanceMode(e.target.value)}>
                {['CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </ModuleFormDialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageBanner title="Approval & payment" description="Customer decision, advance collection, credit and job card authorization" icon={CheckSquare} gradient="from-green-600 to-emerald-800" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
        {[
          ['pendingEstimateApprovals', 'Pending'],
          ['approvedEstimates', 'Approved'],
          ['advanceCollected', 'Advance collected'],
          ['authorizedForJobCard', 'Job card ready'],
        ].map(([k, label]) => (
          <Card key={k}><CardContent className="p-3"><div className="text-lg font-bold">{kpis[k] ?? 0}</div><div className="text-muted-foreground">{label}</div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-2">
          <Input placeholder="Registration / booking / mobile…" value={regSearch} onChange={(e) => setRegSearch(e.target.value)} className="max-w-xs" />
          <Button type="button" onClick={runVehicleSearch}><Search className="h-4 w-4" /></Button>
        </CardContent>
      </Card>

      {searchHits.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Select visit</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {searchHits.map((hit, i) => (
              <div key={i}>
                <p className="font-medium">{hit.vehicle.registrationNo}</p>
                {hit.visits.map((v) => (
                  <div key={v.serviceVisitId} className="flex justify-between items-center border rounded p-2 mt-1">
                    <span>{v.visitNumber} {v.estimateIssued ? '· estimate issued' : ''}</span>
                    <Button size="sm" onClick={() => navigate(`/app/workshop/approvals/${v.serviceVisitId}`)}>Open</Button>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? 'default' : 'secondary'} onClick={() => { setTab(t.key); setPage(1) }}>{t.label}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-brand-grey/50 text-left text-muted-foreground">
                <th className="p-3">Estimate</th>
                <th className="p-3">Visit</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.estimateId} className="border-b hover:bg-brand-grey/30">
                  <td className="p-3 font-medium">{r.estimateNumber}</td>
                  <td className="p-3">{r.serviceVisitNumber}</td>
                  <td className="p-3">{r.vehicleRegistration}</td>
                  <td className="p-3">{r.customerName}</td>
                  <td className="p-3">₹{Number(r.estimateTotal ?? 0).toLocaleString('en-IN')}</td>
                  <td className="p-3"><Badge variant="info">{r.estimateStatus}</Badge></td>
                  <td className="p-3 text-right">
                    <Button size="sm" onClick={() => navigate(`/app/workshop/approvals/${r.serviceVisitId}`)}>Open</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationBar page={page} totalPages={Math.max(1, Math.ceil(total / limit))} total={total} limit={limit} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1) }} />
        </CardContent>
      </Card>
    </div>
  )
}
