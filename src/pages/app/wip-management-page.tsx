import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Wrench, Package, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { authStorage } from '@/lib/auth-storage'
import { wipApi, partsApi } from '@/lib/api'

const TABS = [
  'READY_TO_START',
  'IN_PROGRESS',
  'PARTIALLY_COMPLETED',
  'ON_HOLD',
  'AWAITING_PARTS',
  'ADDITIONAL_APPROVAL_PENDING',
  'COMPLETED',
  'READY_FOR_QC',
] as const

type Tab = (typeof TABS)[number]

export function WipManagementPage() {
  const { jobCardId } = useParams<{ jobCardId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'IN_PROGRESS')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [queue, setQueue] = useState<{ items: unknown[]; total: number; limit: number }>({ items: [], total: 0, limit: 20 })
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [parts, setParts] = useState<Array<{ id: string; partNumber: string; description: string }>>([])
  const [warehouseId, setWarehouseId] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!token) return
    const d = await wipApi.dashboard(token, branchId)
    setKpis(d as Record<string, number>)
  }, [token, branchId])

  const loadQueue = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await wipApi.queue(token, { tab, search: search || undefined, page, limit: 20 }, branchId)
      setQueue(data as { items: unknown[]; total: number; limit: number })
    } finally {
      setLoading(false)
    }
  }, [token, branchId, tab, search, page])

  const loadWorkspace = useCallback(async (id: string) => {
    if (!token) return
    setLoading(true)
    try {
      const data = await wipApi.workspace(token, id, branchId)
      setWorkspace(data as Record<string, unknown>)
    } finally {
      setLoading(false)
    }
  }, [token, branchId])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (!jobCardId) loadQueue()
  }, [jobCardId, loadQueue])

  useEffect(() => {
    if (jobCardId) loadWorkspace(jobCardId)
    else setWorkspace(null)
  }, [jobCardId, loadWorkspace])

  useEffect(() => {
    if (!token || !jobCardId) return
    partsApi.list(token, { limit: 100 }).then((r) => {
      const items = (r as { items: Array<{ id: string; partNumber: string; description: string }> }).items ?? []
      setParts(items)
    })
    partsApi.warehouses(token).then((w) => {
      const first = (w as Array<{ id: string }>)[0]
      if (first) setWarehouseId(first.id)
    }).catch(() => undefined)
  }, [token, jobCardId])

  const workItems = (workspace?.workshop as { workItems?: Array<Record<string, unknown>> })?.workItems ?? []
  const jc = workspace?.jobCard as { jobCardNumber?: string; _id?: string } | undefined
  const vehicle = workspace?.vehicle as { registrationNo?: string; make?: string; model?: string } | undefined
  const customer = workspace?.customer as { name?: string; mobile?: string } | undefined

  const updateItem = async (itemId: string, patch: Record<string, unknown>) => {
    if (!token || !jobCardId) return
    await wipApi.updateWorkItem(token, jobCardId, itemId, patch, branchId)
    await loadWorkspace(jobCardId)
    setMessage('Work item updated')
  }

  const completeItem = async (itemId: string) => {
    if (!token || !jobCardId) return
    const desc = window.prompt('Describe work performed (required)')?.trim()
    if (!desc) return
    await wipApi.completeWorkItem(token, jobCardId, itemId, { workDoneDescription: desc }, branchId)
    await loadWorkspace(jobCardId)
    setMessage('Marked complete — pending supervisor verification')
  }

  const requestPart = async (workItemId: string, partId: string) => {
    if (!token || !jobCardId || !warehouseId) return
    await wipApi.createRequisition(token, {
      jobCardId,
      warehouseId,
      workItemId,
      lines: [{ partId, quantityRequested: 1, workItemId }],
    }, branchId)
    setMessage('Parts requisition created (draft). Submit from parts desk.')
    await loadWorkspace(jobCardId)
  }

  const raiseAdditional = async (workItemId?: string) => {
    if (!token || !jobCardId) return
    const fault = window.prompt('Describe the additional fault discovered')?.trim()
    if (!fault) return
    await wipApi.createAdditionalWork(token, { jobCardId, sourceWorkItemId: workItemId, faultDescription: fault }, branchId)
    setMessage('Additional work request created')
    await loadWorkspace(jobCardId)
  }

  if (jobCardId && workspace) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button variant="ghost" onClick={() => navigate('/app/workshop/wip')}>← WIP queue</Button>
            <h1 className="text-2xl font-semibold">{jc?.jobCardNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {vehicle?.registrationNo} · {customer?.name} · {customer?.mobile}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => wipApi.start(token!, jobCardId, branchId).then(() => loadWorkspace(jobCardId))}>
              Start WIP
            </Button>
            <Button variant="outline" onClick={() => raiseAdditional()}>Additional work</Button>
            <Button onClick={() => wipApi.submitCompletion(token!, jobCardId, branchId).then(() => loadWorkspace(jobCardId))}>
              Submit job completion
            </Button>
            <Button variant="secondary" onClick={() => wipApi.verifyCompletion(token!, jobCardId, branchId).then(() => loadWorkspace(jobCardId))}>
              Release to QC
            </Button>
          </div>
        </div>
        {message && <p className="text-sm text-green-700">{message}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Approved work checklist</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {workItems.map((w) => {
                const id = String(w._id)
                const done = w.workCompleted || w.executionStatus === 'VERIFIED'
                return (
                  <div key={id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(done)}
                        readOnly
                        className="mt-1"
                        aria-label="Work completed"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{String(w.description)}</p>
                        <p className="text-xs text-muted-foreground">Status: {String(w.executionStatus)} · {String(w.completionPercent ?? 0)}%</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateItem(id, { executionStatus: 'IN_PROGRESS' })}>Start</Button>
                          <Button size="sm" variant="outline" onClick={() => updateItem(id, { executionStatus: 'PAUSED', technicianRemarks: 'Paused' })}>Pause</Button>
                          <Button size="sm" onClick={() => completeItem(id)}>Complete</Button>
                          <Button size="sm" variant="ghost" onClick={() => wipApi.verifyWorkItem(token!, jobCardId, id, { accept: true }, branchId).then(() => loadWorkspace(jobCardId))}>
                            Verify
                          </Button>
                          {parts[0] && (
                            <Button size="sm" variant="ghost" onClick={() => requestPart(id, parts[0].id)}>
                              <Package className="mr-1 h-3 w-3" /> Request part
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => raiseAdditional(id)}>Extra work</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Parts & financial</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Parts readiness: {((workspace.partsReadiness as unknown[]) ?? []).length} lines</p>
              <p>
                Authorized value: ₹{String((workspace.financialOverview as { revisedAuthorized?: number })?.revisedAuthorized ?? 0)}
              </p>
              <p>
                Advance received: ₹{String((workspace.financialOverview as { advanceReceived?: number })?.advanceReceived ?? 0)}
              </p>
              <Link to={`/app/workshop/job-cards/${jobCardId}`} className="text-brand-yellow underline">Open job card assignment</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Wrench className="h-8 w-8 text-brand-yellow" />
        <div>
          <h1 className="text-2xl font-semibold">Work in Progress</h1>
          <p className="text-sm text-muted-foreground">Released job cards — execution, parts, additional work</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {[
          ['Active', kpis.activeJobCards],
          ['In repair', kpis.vehiclesUnderRepair],
          ['Awaiting parts', kpis.vehiclesAwaitingParts],
          ['Extra approval', kpis.additionalWorkApprovalPending],
          ['Ready QC', kpis.jobsReadyForQc],
        ].map(([label, val]) => (
          <Card key={String(label)}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{val ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => { setTab(t); setPage(1) }}>
            {t.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>

      <input
        className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
        placeholder="Search registration, job card, customer…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && loadQueue()}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3">Job card</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Team / location</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Delivery</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : queue.items.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No job cards in this tab. Release work from Job Cards first.</td></tr>
              ) : (
                queue.items.map((row) => {
                  const r = row as Record<string, unknown>
                  return (
                    <tr key={String(r.jobCardId)} className="border-b">
                      <td className="p-3 font-medium">{String(r.jobCardNumber)} <span className="text-xs text-muted-foreground">R{String(r.jobCardRevision ?? 1)}</span></td>
                      <td className="p-3">{String(r.registration)}<br /><span className="text-xs">{String(r.vehicleMakeModel)}</span></td>
                      <td className="p-3">{String(r.customerName)}</td>
                      <td className="p-3 text-xs">{String(r.assignedTeam ?? '—')}<br />{String(r.location ?? '—')}</td>
                      <td className="p-3">{String(r.completionPercent)}%</td>
                      <td className="p-3 text-xs">{r.plannedDelivery ? new Date(String(r.plannedDelivery)).toLocaleString() : '—'}</td>
                      <td className="p-3">
                        <Button size="sm" onClick={() => navigate(`/app/workshop/wip/${r.jobCardId}`)}>Open</Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <PaginationBar
        page={page}
        totalPages={Math.max(1, Math.ceil(queue.total / queue.limit))}
        total={queue.total}
        limit={queue.limit}
        onPageChange={setPage}
      />

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5" /> Bay board and technician board are consolidated here. Deep links redirect to WIP.
      </p>
    </div>
  )
}
