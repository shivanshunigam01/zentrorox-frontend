import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { ModuleFormDialog } from '@/components/ui/module-form-dialog'
import { authStorage } from '@/lib/auth-storage'
import { appToast } from '@/lib/app-toast'
import { jobCardsApi } from '@/lib/api'

const TABS = [
  { key: 'AWAITING_ASSIGNMENT', label: 'Awaiting assignment' },
  { key: 'ASSIGNMENT_IN_PROGRESS', label: 'Assignment in progress' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'READY_TO_START', label: 'Ready to start' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'ON_HOLD', label: 'On hold' },
  { key: 'COMPLETED', label: 'Completed work' },
] as const

type QueueRow = {
  serviceVisitId: string
  bookingNumber?: string
  visitNumber?: string
  jobCardId?: string
  jobCardNumber?: string
  jobCardStatus?: string
  registration?: string
  customerName?: string
  approvedEstimateValue?: number
  financialAuthorizationStatus?: string
  advanceReceived?: number
  approvedWorkItemCount?: number
}

export function JobCardManagementPage() {
  const { jobCardId } = useParams()
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const [tab, setTab] = useState('AWAITING_ASSIGNMENT')
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [rows, setRows] = useState<QueueRow[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null)
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')

  const loadQueue = async () => {
    if (!token) return
    const [dash, q] = await Promise.all([
      jobCardsApi.dashboard(token, branchId),
      jobCardsApi.queue(token, { tab, search: search || undefined, page, limit }, branchId),
    ])
    setKpis(dash)
    setRows(q.items as QueueRow[])
    setTotal(q.total)
  }

  const loadWorkspace = async (id: string) => {
    if (!token) return
    const [w, t] = await Promise.all([
      jobCardsApi.workspace(token, id, branchId),
      jobCardsApi.teams(token, branchId),
    ])
    setWorkspace(w)
    setTeams((t as Array<{ id: string; name: string }>) ?? [])
  }

  useEffect(() => { loadQueue() }, [tab, page, limit])
  useEffect(() => {
    if (jobCardId) loadWorkspace(jobCardId)
    else setWorkspace(null)
  }, [jobCardId])

  const createFromVisit = async (visitId: string) => {
    if (!token) return
    const { jobCard } = await jobCardsApi.createFromVisit(token, visitId, branchId, crypto.randomUUID()) as {
      jobCard?: { _id?: string }
      duplicate?: boolean
    }
    const id = jobCard?._id?.toString()
    appToast.success('Job card created')
    await loadQueue()
    if (id) navigate(`/app/workshop/job-cards/${id}`)
  }

  const saveAssignment = async () => {
    if (!token || !jobCardId || !selectedTeam) return
    const workItems = (workspace?.workItems as Array<{ _id: string; status: string }>) ?? []
    const ids = workItems.filter((w) => w.status === 'PENDING' || w.status === 'ASSIGNED').map((w) => w._id)
    if (!ids.length) {
      appToast.info('No work items to assign')
      return
    }
    await jobCardsApi.createAssignment(token, jobCardId, { teamId: selectedTeam, workItemIds: ids }, branchId)
    setAssignOpen(false)
    appToast.success('Assignment saved (draft)')
    await loadWorkspace(jobCardId)
  }

  if (jobCardId && workspace) {
    const jc = workspace.jobCard as Record<string, unknown>
    const assignments = (workspace.assignments as unknown[]) ?? []
    const workItems = (workspace.workItems as Array<Record<string, unknown>>) ?? []

    return (
      <div className="space-y-6 pb-20">
        <PageBanner title={`Job Card ${String(jc.jobCardNumber)}`} description="Teams, locations, delivery and release" icon={Wrench} gradient="from-brand-charcoal to-slate-800" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/app/workshop/job-cards')}>Back to queue</Button>
          <Button onClick={() => setAssignOpen(true)}>Assign team</Button>
          <Button variant="outline" onClick={() => jobCardsApi.deliveryPlan(token!, jobCardId, { workshopPlannedStart: new Date().toISOString() }, branchId).then(() => appToast.success('Delivery plan updated'))}>
            Recalculate delivery
          </Button>
          <Button variant="ghost" onClick={() => jobCardsApi.openPdf(token!, jobCardId, branchId).catch((e) => appToast.error(e instanceof Error ? e.message : 'PDF failed'))}>Print PDF</Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Approved work items</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              {workItems.map((w) => (
                <div key={String(w._id)} className="flex justify-between border-b py-1">
                  <span>{String(w.description)}</span>
                  <Badge variant="info">{String(w.status)}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Team cards</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              {assignments.length === 0 && <p className="text-muted-foreground">No assignments yet.</p>}
              {(assignments as Array<Record<string, unknown>>).map((a) => (
                <div key={String(a._id)} className="border rounded p-2">
                  <div className="font-medium">Team assignment</div>
                  <Badge>{String(a.status)}</Badge>
                  <Button size="sm" className="mt-2" onClick={() => jobCardsApi.releaseAssignment(token!, jobCardId, String(a._id), branchId).then(() => loadWorkspace(jobCardId))}>
                    Release work
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <ModuleFormDialog open={assignOpen} onOpenChange={setAssignOpen} title="Assign team to work items" footer={
          <><Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button><Button onClick={saveAssignment}>Save assignment</Button></>
        }>
          <select className="h-10 w-full border rounded-lg px-3 text-sm" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="">Select team</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </ModuleFormDialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageBanner title="Job Card Management" description="Authorized visits, multi-team assignment, bays and delivery planning" icon={Wrench} gradient="from-brand-charcoal to-slate-800" emoji="🔧" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
        {[
          ['readyForAssignment', 'Awaiting'],
          ['inProgress', 'In progress'],
          ['workCompleted', 'Work completed'],
          ['total', 'Total cards'],
        ].map(([k, label]) => (
          <Card key={k}><CardContent className="p-3"><div className="text-lg font-bold">{kpis[k] ?? 0}</div><div className="text-muted-foreground">{label}</div></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? 'default' : 'secondary'} onClick={() => { setTab(t.key); setPage(1) }}>{t.label}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="flex gap-2 max-w-md" onSubmit={(e) => { e.preventDefault(); setPage(1); loadQueue() }}>
            <Input placeholder="Search reg, visit, job card…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-brand-grey/50 text-left text-muted-foreground">
                <th className="p-3">Visit</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Approved value</th>
                <th className="p-3">Finance</th>
                <th className="p-3">Items</th>
                <th className="p-3">Job card</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.serviceVisitId} className="border-b hover:bg-brand-grey/30">
                  <td className="p-3">{r.visitNumber}<br /><span className="text-xs text-muted-foreground">{r.bookingNumber}</span></td>
                  <td className="p-3">{r.registration}</td>
                  <td className="p-3">{r.customerName}</td>
                  <td className="p-3">₹{Number(r.approvedEstimateValue ?? 0).toLocaleString('en-IN')}</td>
                  <td className="p-3"><Badge variant="info">{r.financialAuthorizationStatus}</Badge></td>
                  <td className="p-3">{r.approvedWorkItemCount}</td>
                  <td className="p-3">{r.jobCardNumber ?? '—'}</td>
                  <td className="p-3 text-right space-x-1">
                    {r.jobCardId ? (
                      <Button size="sm" onClick={() => navigate(`/app/workshop/job-cards/${r.jobCardId}`)}>Open</Button>
                    ) : (
                      <Button size="sm" onClick={() => createFromVisit(r.serviceVisitId)}>Create</Button>
                    )}
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
