import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Save, Play, Send, CheckCircle2 } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { authStorage } from '@/lib/auth-storage'
import { inspectionsApi } from '@/lib/api'
import { WORKSHOP_INSPECTION_BASE } from '@/lib/workshop-paths'
import { PermissionDeniedCard } from '@/components/workshop/permission-denied-card'
import { MultiImageUpload } from '@/components/service-visit/multi-image-upload'
import { ClipboardList } from 'lucide-react'
import { StickyActionBar, WORKSPACE_ACTION_BAR_PAD } from '@/components/ui/sticky-action-bar'
import { appToast } from '@/lib/app-toast'

const TRIAL_DISPOSITIONS = ['ROAD_TEST', 'STATIC_TEST', 'WORKSHOP_TEST', 'NOT_SAFE', 'NOT_REQUIRED', 'NOT_POSSIBLE']
const CHECKLIST_RESULTS = ['PASS', 'FAIL', 'ATTENTION', 'NOT_TESTED', 'NOT_APPLICABLE']

export function TrialInspectionWorkspacePage() {
  const { caseId } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [inspectors, setInspectors] = useState<Array<{ id: string; name: string; activeAssignments?: number }>>([])
  const [inspectorId, setInspectorId] = useState('')
  const [trial, setTrial] = useState<Record<string, unknown>>({})
  const [responses, setResponses] = useState<Array<Record<string, unknown>>>([])
  const [finding, setFinding] = useState({ vehicleSystem: '', observedFailure: '', severity: 'MEDIUM', diagnosisConfidence: 'SUSPECTED' })
  const [report, setReport] = useState({ inspectionSummary: '', vehicleSafeToOperate: 'UNDETERMINED' })
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token || !caseId) return
    try {
      const d = await inspectionsApi.get(token, caseId, branchId)
      setDetail(d)
      setTrial((d.trial as Record<string, unknown>) ?? {})
      setResponses((d.checklistResponses as Array<Record<string, unknown>>) ?? [])
      const vehicle = d.vehicleId as { vehicleCategory?: string } | undefined
      const insp = await inspectionsApi.inspectors(token, vehicle?.vehicleCategory, branchId)
      setInspectors(insp as Array<{ id: string; name: string; activeAssignments?: number }>)
      setInspectorId(String((d.inspectorId as { _id?: string })?._id ?? d.inspectorId ?? ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed')
    }
  }, [token, caseId, branchId])

  useEffect(() => { load() }, [load])

  if (!caseId) return null

  const receiving = detail?.receiving as Record<string, unknown> | undefined
  const voc = detail?.voc as { complaints?: Array<Record<string, unknown>> } | undefined
  const snapshot = (detail?.checklistSnapshot as Array<Record<string, unknown>>) ?? []
  const status = String(detail?.status ?? '')
  const locked = ['AWAITING_REVIEW', 'COMPLETED'].includes(status)

  const assign = async () => {
    if (!inspectorId) return
    await inspectionsApi.assign(token!, caseId, { inspectorId, priority: 'NORMAL' }, branchId)
    appToast.success('Inspector assigned')
    await load()
  }

  const start = async () => {
    await inspectionsApi.start(token!, caseId, branchId)
    appToast.success('Inspection started')
    await load()
  }

  const saveTrial = async () => {
    await appToast.run('Saving trial…', () => inspectionsApi.saveTrial(token!, caseId, trial, branchId), { success: 'Trial saved' })
  }

  const saveChecklist = async () => {
    await appToast.run('Saving checklist…', () => inspectionsApi.saveChecklist(token!, caseId, responses, branchId), { success: 'Checklist saved' })
  }

  const addFinding = async () => {
    await appToast.run('Adding finding…', async () => {
      await inspectionsApi.addFinding(token!, caseId, finding, branchId)
      await load()
    }, { success: 'Finding added' })
  }

  const submit = async () => {
    await appToast.run('Submitting…', async () => {
      await inspectionsApi.submit(token!, caseId, report, branchId)
      await load()
    }, { success: 'Submitted for review' })
  }

  const approve = async () => {
    await appToast.run('Approving…', async () => {
      await inspectionsApi.review(token!, caseId, { decision: 'APPROVED', comments: 'Approved' }, branchId)
      await load()
    }, { success: 'Approved — visit advanced to estimate' })
  }

  const rework = async () => {
    await appToast.run('Sending back…', async () => {
      await inspectionsApi.review(token!, caseId, { decision: 'REWORK', reworkInstructions: 'Please correct findings' }, branchId)
      await load()
    }, { success: 'Returned for rework' })
  }

  return (
    <div className={`space-y-6 ${WORKSPACE_ACTION_BAR_PAD}`}>
      <PageBanner
        title={`Inspection ${String(detail?.inspectionNumber ?? caseId)}`}
        description="Unified trial, checklist, technical findings and diagnosis"
        icon={ClipboardList}
        gradient="from-slate-600 to-slate-800"
      />
      {error && /insufficient permissions/i.test(error) ? (
        <PermissionDeniedCard requiredPermissions={['inspections.view', 'inspections.edit']} />
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{status}</Badge>
        {(search.get('mode') === 'assign' || status === 'PENDING_ASSIGNMENT') && <Badge variant="warning">Assign inspector</Badge>}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Vehicle & booking (read-only)</CardTitle></CardHeader>
        <CardContent className="text-sm grid sm:grid-cols-2 gap-2">
          <p>Customer: {(detail?.customerId as { name?: string })?.name}</p>
          <p>Vehicle: {(detail?.vehicleId as { registrationNo?: string })?.registrationNo}</p>
          <p>Gate-In odometer: {receiving?.odometer != null ? String(receiving.odometer) : '—'}</p>
          <p>Fuel: {receiving?.fuelLevel != null ? String(receiving.fuelLevel) : '—'}</p>
          <p>Condition: {receiving?.vehicleConditionRemarks != null ? String(receiving.vehicleConditionRemarks) : '—'}</p>
        </CardContent>
      </Card>

      {(status === 'PENDING_ASSIGNMENT' || search.get('mode') === 'assign') && (
        <Card>
          <CardHeader><CardTitle className="text-base">Assign inspector</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2 items-end">
            <select className="border rounded h-10 px-2 min-w-[200px]" value={inspectorId} onChange={(e) => setInspectorId(e.target.value)}>
              <option value="">Select inspector</option>
              {inspectors.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.activeAssignments ?? 0} open)</option>
              ))}
            </select>
            <Button onClick={assign}>Assign</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">VOC</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(voc?.complaints ?? []).map((c, idx) => (
            <div key={idx} className="border rounded p-2">
              <strong>{String(c.title ?? `Complaint ${idx + 1}`)}</strong>
              <p>{String(c.description)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle className="text-base">Trial</CardTitle>
          <Button size="sm" variant="secondary" disabled={locked} onClick={saveTrial}><Save className="w-4 h-4 mr-1" />Save</Button>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Disposition</label>
            <select className="w-full border rounded h-10" disabled={locked} value={String(trial.disposition ?? '')}
              onChange={(e) => setTrial({ ...trial, disposition: e.target.value })}>
              <option value="">Select</option>
              {TRIAL_DISPOSITIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <Input label="Skip / safety reason" disabled={locked} value={String(trial.skipReason ?? trial.remarks ?? '')}
            onChange={(e) => setTrial({ ...trial, skipReason: e.target.value })} />
          <Input label="Start odometer" type="number" disabled={locked} value={String(trial.startOdometer ?? '')}
            onChange={(e) => setTrial({ ...trial, startOdometer: Number(e.target.value) })} />
          <Input label="End odometer" type="number" disabled={locked} value={String(trial.endOdometer ?? '')}
            onChange={(e) => setTrial({ ...trial, endOdometer: Number(e.target.value) })} />
          <div className="sm:col-span-2">
            <Input label="Observed symptoms" disabled={locked} value={String(trial.observedSymptoms ?? '')}
              onChange={(e) => setTrial({ ...trial, observedSymptoms: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle className="text-base">Inspection checklist</CardTitle>
          <Button size="sm" variant="secondary" disabled={locked} onClick={saveChecklist}>Save checklist</Button>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {snapshot.map((item, idx) => {
            const sid = String(item._id ?? idx)
            const resp = responses.find((r) => String(r.snapshotItemId) === sid) ?? { snapshotItemId: sid, result: 'NOT_TESTED' }
            return (
              <div key={sid} className="grid sm:grid-cols-3 gap-2 border rounded p-2 text-sm">
                <span>{String(item.label)}</span>
                <select disabled={locked} value={String(resp.result)} onChange={(e) => {
                  const next = [...responses]
                  const i = next.findIndex((r) => String(r.snapshotItemId) === sid)
                  const row = { ...resp, snapshotItemId: sid, result: e.target.value }
                  if (i >= 0) next[i] = row
                  else next.push(row)
                  setResponses(next)
                }}>
                  {CHECKLIST_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <Input placeholder="Remarks" disabled={locked} value={String(resp.remarks ?? '')} onChange={(e) => {
                  const next = [...responses]
                  const i = next.findIndex((r) => String(r.snapshotItemId) === sid)
                  const row = { ...resp, snapshotItemId: sid, remarks: e.target.value }
                  if (i >= 0) next[i] = row
                  else next.push(row)
                  setResponses(next)
                }} />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Technical findings & diagnosis</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-2">
          <Input label="System" disabled={locked} value={finding.vehicleSystem} onChange={(e) => setFinding({ ...finding, vehicleSystem: e.target.value })} />
          <Input label="Observed failure" disabled={locked} value={finding.observedFailure} onChange={(e) => setFinding({ ...finding, observedFailure: e.target.value })} />
          <Button disabled={locked} onClick={addFinding}>Add finding</Button>
          <div className="sm:col-span-2 text-xs text-muted-foreground">
            Existing: {((detail?.findings as unknown[]) ?? []).length} finding(s)
          </div>
        </CardContent>
      </Card>

      {token && (
        <MultiImageUpload token={token} visitId={String((detail?.serviceVisitId as { _id?: string })?._id ?? detail?.serviceVisitId ?? '')} category="INSPECTION" label="Inspection photos" />
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Inspector report</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input label="Summary" disabled={locked} value={report.inspectionSummary} onChange={(e) => setReport({ ...report, inspectionSummary: e.target.value })} />
          <div>
            <label className="text-xs">Safe to operate?</label>
            <select className="border rounded h-10 w-full" disabled={locked} value={report.vehicleSafeToOperate}
              onChange={(e) => setReport({ ...report, vehicleSafeToOperate: e.target.value })}>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
              <option value="UNDETERMINED">UNDETERMINED</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <StickyActionBar>
        <Button onClick={start} disabled={!inspectorId && status === 'PENDING_ASSIGNMENT'}><Play className="w-4 h-4 mr-1" />Start</Button>
        <Button variant="secondary" disabled={locked} onClick={submit}><Send className="w-4 h-4 mr-1" />Submit for review</Button>
        {status === 'AWAITING_REVIEW' && (
          <>
            <Button onClick={approve}><CheckCircle2 className="w-4 h-4 mr-1" />Approve</Button>
            <Button variant="secondary" onClick={rework}>Return rework</Button>
          </>
        )}
        <Button variant="ghost" onClick={() => navigate(WORKSHOP_INSPECTION_BASE)}>Back to queue</Button>
      </StickyActionBar>
    </div>
  )
}
