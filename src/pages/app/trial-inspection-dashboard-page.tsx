import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Search } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ModuleFormDialog } from '@/components/ui/module-form-dialog'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { authStorage } from '@/lib/auth-storage'
import { inspectionsApi } from '@/lib/api'
import { WORKSHOP_INSPECTION_BASE } from '@/lib/workshop-paths'
import { PermissionDeniedCard } from '@/components/workshop/permission-denied-card'

const TABS = [
  { key: '', label: 'All' },
  { key: 'PENDING_ASSIGNMENT', label: 'Awaiting Inspection' },
  { key: 'ASSIGNED', label: 'Inspector Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'AWAITING_REVIEW', label: 'Awaiting Review' },
  { key: 'REWORK_REQUIRED', label: 'Rework Required' },
  { key: 'COMPLETED', label: 'Completed' },
] as const

type QueueRow = {
  id: string
  inspectionReference?: string
  bookingNumber?: string
  serviceVisitNumber?: string
  vehicleRegistration?: string
  customerName?: string
  inspectionStatus?: string
  assignedInspector?: string | null
  primaryComplaint?: string
  pendingDurationMinutes?: number
}

export function TrialInspectionDashboardPage() {
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined
  const [tab, setTab] = useState('')
  const [search, setSearch] = useState('')
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [rows, setRows] = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [assignCaseId, setAssignCaseId] = useState<string | null>(null)
  const [inspectorId, setInspectorId] = useState('')
  const [inspectors, setInspectors] = useState<{ id: string; name: string }[]>([])
  const [assigning, setAssigning] = useState(false)

  const load = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [dash, queue, inspList] = await Promise.all([
        inspectionsApi.dashboard(token, branchId),
        inspectionsApi.queue(token, { status: tab || undefined, search: search || undefined, page, limit }, branchId),
        inspectionsApi.inspectors(token, undefined, branchId),
      ])
      setKpis(dash)
      setRows(queue.items as QueueRow[])
      setTotal(queue.total)
      setInspectors(
        (inspList as Array<{ id?: string; _id?: string; name?: string; fullName?: string; eligible?: boolean }>)
          .filter((u) => u.eligible !== false)
          .map((u) => ({
            id: String(u.id ?? u._id ?? ''),
            name: u.name ?? u.fullName ?? 'Inspector',
          }))
          .filter((u) => u.id),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inspection queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab, page, limit])

  const openCase = (id: string, status?: string) => {
    if (status === 'PENDING_ASSIGNMENT') {
      setAssignCaseId(id)
      return
    }
    navigate(`${WORKSHOP_INSPECTION_BASE}/${id}`)
  }

  const submitAssign = async () => {
    if (!token || !assignCaseId || !inspectorId) return
    setAssigning(true)
    try {
      await inspectionsApi.assign(token, assignCaseId, { inspectorId, priority: 'NORMAL' }, branchId)
      setAssignCaseId(null)
      setInspectorId('')
      await load()
    } finally {
      setAssigning(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6">
      <PageBanner
        title="VOC, Trial & Inspection"
        description="Unified workspace — customer complaints, initial trial, technical inspection, diagnosis and release to estimate"
        icon={ClipboardList}
        gradient="from-slate-700 to-slate-900"
      />

      {error && /insufficient permissions/i.test(error) ? (
        <PermissionDeniedCard
          requiredPermissions={['inspections.view']}
          message="Your role cannot open the inspection queue. Service advisors and inspectors need inspections.view — run database seed or ask an admin to refresh role permissions, then sign in again."
        />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
        {[
          ['awaitingAssignment', 'Awaiting assign'],
          ['assigned', 'Assigned'],
          ['inProgress', 'In progress'],
          ['awaitingReview', 'Awaiting review'],
          ['reworkRequired', 'Rework'],
          ['completed', 'Completed'],
          ['overdue', 'Overdue'],
        ].map(([k, label]) => (
          <Card key={k}><CardContent className="p-3">
            <div className="text-lg font-bold">{kpis[k] ?? 0}</div>
            <div className="text-muted-foreground">{label}</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.key || 'all'} size="sm" variant={tab === t.key ? 'default' : 'secondary'} onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 max-w-md">
        <Input placeholder="Search reg, customer, booking…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="button" onClick={() => { setPage(1); load() }}><Search className="w-4 h-4" /></Button>
      </div>

      <ModuleFormDialog
        open={!!assignCaseId}
        onOpenChange={(open) => { if (!open) { setAssignCaseId(null); setInspectorId('') } }}
        title="Assign inspector"
        description="Inspector can open the case workspace after assignment"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setAssignCaseId(null)}>Cancel</Button>
            <Button type="button" disabled={!inspectorId || assigning} onClick={submitAssign}>
              {assigning ? 'Assigning…' : 'Assign'}
            </Button>
          </>
        }
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Inspector</label>
          <select
            className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm"
            value={inspectorId}
            onChange={(e) => setInspectorId(e.target.value)}
          >
            <option value="">Select inspector</option>
            {inspectors.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </ModuleFormDialog>

      <Card>
        <CardHeader><CardTitle className="text-base">Inspection queue</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2">Ref</th>
                <th className="p-2">Vehicle</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Complaint</th>
                <th className="p-2">Inspector</th>
                <th className="p-2">Status</th>
                <th className="p-2">Pending</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 font-medium">{r.inspectionReference}</td>
                  <td className="p-2">{r.vehicleRegistration}<br /><span className="text-xs text-muted-foreground">{r.bookingNumber}</span></td>
                  <td className="p-2">{r.customerName}</td>
                  <td className="p-2 max-w-[180px] truncate">{r.primaryComplaint ?? '—'}</td>
                  <td className="p-2">{r.assignedInspector ?? '—'}</td>
                  <td className="p-2"><Badge variant="info">{r.inspectionStatus}</Badge></td>
                  <td className="p-2">{r.pendingDurationMinutes ?? 0}m</td>
                  <td className="p-2">
                    <Button size="sm" onClick={() => openCase(r.id, r.inspectionStatus)}>
                      {r.inspectionStatus === 'PENDING_ASSIGNMENT' ? 'Assign' : r.inspectionStatus === 'IN_PROGRESS' ? 'Resume' : 'Open'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 && (
            <p className="text-sm text-muted-foreground p-4">
              No eligible visits in queue.{' '}
              <button type="button" className="font-medium text-brand-charcoal underline" onClick={() => navigate('/app/workshop/receiving-hub')}>
                Open vehicle receiving
              </button>{' '}
              and complete gate-in, inventory, and advisor-confirmed VOC on a visit — then it appears here for inspection.
            </p>
          )}
          {!loading && rows.length > 0 && (
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(n) => { setLimit(n); setPage(1) }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
