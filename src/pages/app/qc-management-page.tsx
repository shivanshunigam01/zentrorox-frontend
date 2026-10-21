import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { authStorage } from '@/lib/auth-storage'
import { qcApi } from '@/lib/api'
import { WORKSHOP_QC_BASE } from '@/lib/workshop-paths'

const TABS = [
  'AWAITING_QC',
  'INSPECTOR_ASSIGNED',
  'QC_IN_PROGRESS',
  'ROAD_TEST_PENDING',
  'QC_FAILED',
  'REWORK_IN_PROGRESS',
  'REINSPECTION_PENDING',
  'QC_PASSED',
  'RELEASED_FOR_INVOICE',
] as const

const QC_TAB_LABELS: Record<(typeof TABS)[number], string> = {
  AWAITING_QC: 'Awaiting QC',
  INSPECTOR_ASSIGNED: 'Inspector Assigned',
  QC_IN_PROGRESS: 'In Progress',
  ROAD_TEST_PENDING: 'Road Test Pending',
  QC_FAILED: 'Failed',
  REWORK_IN_PROGRESS: 'Rework Pending',
  REINSPECTION_PENDING: 'Reinspection',
  QC_PASSED: 'Passed',
  RELEASED_FOR_INVOICE: 'Invoice Ready',
}

export function QcManagementPage() {
  const { qcCaseId } = useParams<{ qcCaseId?: string }>()
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const [tab, setTab] = useState<(typeof TABS)[number]>('AWAITING_QC')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [queue, setQueue] = useState({ items: [] as unknown[], total: 0, limit: 20 })
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null)
  const [inspectors, setInspectors] = useState<Array<{ id: string; name: string }>>([])
  const [inspectorId, setInspectorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!token) return
    setKpis(await qcApi.dashboard(token, branchId) as Record<string, number>)
  }, [token, branchId])

  const loadQueue = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await qcApi.queue(token, { tab, search: search || undefined, page, limit: 20 }, branchId)
      setQueue(data as { items: unknown[]; total: number; limit: number })
    } finally {
      setLoading(false)
    }
  }, [token, branchId, tab, search, page])

  const loadWorkspace = useCallback(async (id: string) => {
    if (!token) return
    setLoading(true)
    try {
      setWorkspace(await qcApi.workspace(token, id, branchId) as Record<string, unknown>)
    } finally {
      setLoading(false)
    }
  }, [token, branchId])

  useEffect(() => { loadDashboard() }, [loadDashboard])
  useEffect(() => { if (!qcCaseId) loadQueue() }, [qcCaseId, loadQueue])
  useEffect(() => {
    if (qcCaseId) loadWorkspace(qcCaseId)
    else setWorkspace(null)
  }, [qcCaseId, loadWorkspace])

  useEffect(() => {
    if (!token) return
    qcApi.inspectors(token, branchId).then((list) => {
      const mapped = (list as Array<{ id?: string; _id?: string; name?: string }>).map((u) => ({
        id: String(u.id ?? u._id ?? ''),
        name: u.name ?? 'Inspector',
      })).filter((u) => u.id)
      setInspectors(mapped)
      if (!inspectorId && mapped[0]) setInspectorId(mapped[0].id)
    })
  }, [token, branchId])

  const qcCase = workspace?.qcCase as { qcReference?: string; status?: string; _id?: string } | undefined
  const attempt = workspace?.currentAttempt as {
    workChecks?: Array<{ _id?: string; workDescription?: string; result?: string }>
    quantityLines?: unknown[]
    vocChecks?: Array<{ vocComplaintId?: string; originalDescription?: string; resolutionStatus?: string }>
    roadTest?: { disposition?: string; startOdometer?: number; endOdometer?: number; exceptionReason?: string }
  } | undefined
  const vehicle = workspace?.vehicle as { registrationNo?: string } | undefined

  const setCheckResult = async (checkId: string, result: string) => {
    if (!token || !qcCaseId || !attempt?.workChecks) return
    const workChecks = attempt.workChecks.map((c) =>
      c._id === checkId ? { ...c, result } : c,
    )
    await qcApi.updateChecklist(token, qcCaseId, { workChecks }, branchId)
    await loadWorkspace(qcCaseId)
  }

  const assignInspector = async () => {
    if (!token || !qcCaseId || !inspectorId) return
    await qcApi.assign(token, qcCaseId, { inspectorId }, branchId)
    setMessage('Inspector assigned')
    await loadWorkspace(qcCaseId)
  }

  if (qcCaseId && workspace) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <Button variant="ghost" onClick={() => navigate(WORKSHOP_QC_BASE)}>← QC queue</Button>
            <h1 className="text-2xl font-semibold">{qcCase?.qcReference}</h1>
            <p className="text-sm text-muted-foreground">{vehicle?.registrationNo} · {qcCase?.status}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
              value={inspectorId}
              onChange={(e) => setInspectorId(e.target.value)}
            >
              <option value="">Select inspector</option>
              {inspectors.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <Button variant="outline" onClick={assignInspector} disabled={!inspectorId}>Assign inspector</Button>
            <Button variant="outline" onClick={() => qcApi.start(token!, qcCaseId, branchId).then(() => loadWorkspace(qcCaseId))}>Start QC</Button>
            <Button onClick={() => qcApi.pass(token!, qcCaseId, {}, branchId).then(() => { setMessage('QC passed — invoice ready'); loadWorkspace(qcCaseId) })}>Pass QC</Button>
            <Button variant="destructive" onClick={() => qcApi.fail(token!, qcCaseId, { createRework: true }, branchId).then(() => loadWorkspace(qcCaseId))}>Fail / Rework</Button>
            <Button variant="ghost" onClick={() => token && qcApi.openPdf(token, qcCaseId, branchId).catch((e) => setMessage(e instanceof Error ? e.message : 'PDF failed'))}>PDF</Button>
          </div>
        </div>
        {message && <p className="text-sm text-green-700">{message}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Work quality checklist</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(attempt?.workChecks ?? []).map((c) => (
                <div key={c._id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2">
                  <span>{c.workDescription}</span>
                  <select
                    className="rounded border px-2 py-1"
                    value={c.result ?? 'NOT_TESTED'}
                    onChange={(e) => c._id && setCheckResult(c._id, e.target.value)}
                  >
                    {['NOT_TESTED', 'PASS', 'FAIL', 'ATTENTION', 'NOT_APPLICABLE'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quantity & VOC</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Parts lines: {(attempt?.quantityLines ?? workspace?.quantityPreview as unknown[])?.length ?? 0}</p>
              <Button size="sm" variant="outline" onClick={() => qcApi.updateQuantity(token!, qcCaseId, { quantityLines: workspace?.quantityPreview }, branchId).then(() => loadWorkspace(qcCaseId))}>
                Refresh quantity from ledger
              </Button>
              {(attempt?.vocChecks ?? []).map((v, i) => (
                <div key={i} className="border-t pt-2">
                  <p className="font-medium">{v.originalDescription}</p>
                  <select
                    className="mt-1 rounded border px-2 py-1"
                    defaultValue={v.resolutionStatus}
                    onChange={(e) => {
                      const vocChecks = (attempt?.vocChecks ?? []).map((x, j) =>
                        j === i ? { ...x, resolutionStatus: e.target.value } : x,
                      )
                      qcApi.updateVoc(token!, qcCaseId, { vocChecks }, branchId).then(() => loadWorkspace(qcCaseId))
                    }}
                  >
                    {['RESOLVED', 'NOT_RESOLVED', 'INTERMITTENT', 'NOT_REPRODUCED', 'FURTHER_VERIFICATION_REQUIRED', 'NOT_APPLICABLE'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Road test (unified)</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-sm">
              <select
                className="rounded border px-2 py-1"
                value={attempt?.roadTest?.disposition ?? 'PENDING'}
                onChange={(e) => qcApi.updateRoadTest(token!, qcCaseId, {
                  disposition: e.target.value,
                  exceptionReason: e.target.value === 'NOT_REQUIRED' ? 'Policy: static verification sufficient' : undefined,
                }, branchId).then(() => loadWorkspace(qcCaseId))}
              >
                {['PENDING', 'REQUIRED', 'COMPLETED', 'NOT_REQUIRED', 'NOT_SAFE', 'NOT_POSSIBLE'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Start odometer"
                className="rounded border px-2 py-1 w-32"
                onBlur={(e) => qcApi.updateRoadTest(token!, qcCaseId, { startOdometer: Number(e.target.value) }, branchId)}
              />
              <input
                type="number"
                placeholder="End odometer"
                className="rounded border px-2 py-1 w-32"
                onBlur={(e) => qcApi.updateRoadTest(token!, qcCaseId, { endOdometer: Number(e.target.value), disposition: 'COMPLETED' }, branchId).then(() => loadWorkspace(qcCaseId))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-2xl font-semibold">Final QC & Road Test</h1>
          <p className="text-sm text-muted-foreground">Unified quality, quantity verification and road test</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Awaiting', kpis.totalAwaitingQc],
          ['In progress', kpis.qcInProgress],
          ['Passed today', kpis.passedToday],
          ['Invoice ready', kpis.invoiceReadyVehicles],
        ].map(([label, val]) => (
          <Card key={String(label)}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{val ?? 0}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => { setTab(t); setPage(1) }}>
            {QC_TAB_LABELS[t]}
          </Button>
        ))}
      </div>

      <input
        className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
        placeholder="Search registration, QC ref, customer…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && loadQueue()}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3">QC ref</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Job card</th>
                <th className="p-3">Inspector</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center">Loading…</td></tr>
              ) : queue.items.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No vehicles. Complete WIP and release to QC first.</td></tr>
              ) : (
                queue.items.map((row) => {
                  const r = row as Record<string, string>
                  return (
                    <tr key={r.qcCaseId} className="border-b">
                      <td className="p-3 font-medium">{r.qcReference}</td>
                      <td className="p-3">{r.registration}<br /><span className="text-xs">{r.vehicleMakeModel}</span></td>
                      <td className="p-3">{r.jobCardNumber}</td>
                      <td className="p-3">{r.qcInspector ?? '—'}</td>
                      <td className="p-3">{r.qcStatus}</td>
                      <td className="p-3"><Button size="sm" onClick={() => navigate(`${WORKSHOP_QC_BASE}/${r.qcCaseId}`)}>Open</Button></td>
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
