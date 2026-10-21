import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, Printer, Save } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { authStorage } from '@/lib/auth-storage'
import { receivingApi, serviceVisitsApi, vocApi } from '@/lib/api'
import { MultiImageUpload } from '@/components/service-visit/multi-image-upload'
import { PrintableReceivingReport, type ReceivingReportData } from '@/components/service-visit/printable-receiving-report'

const FUEL_LEVELS = ['Empty', '1/4', '1/2', '3/4', 'Full']
const MATCH_OPTS = ['MATCH', 'MISMATCH', 'UNREADABLE', 'NOT_CHECKED'] as const
const ITEM_STATUS = ['PRESENT', 'MISSING', 'DAMAGED', 'NOT_APPLICABLE', 'NOT_CHECKED'] as const

type InventoryRow = {
  label: string
  status: string
  quantity?: number
  remarks?: string
  category?: string
}

type ComplaintRow = {
  title?: string
  description: string
  symptoms?: string
  source?: string
  requestedWork?: string
  priority?: string
  customerRemarks?: string
}

export function ServiceVisitReceivingWorkspacePage() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined
  const printRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [phase, setPhase] = useState<{ readyForInspection: boolean; blockers: string[] } | null>(null)

  const [visit, setVisit] = useState<Record<string, unknown> | null>(null)
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null)
  const [pickup, setPickup] = useState<Record<string, unknown> | null>(null)
  const [receiving, setReceiving] = useState<Record<string, unknown>>({})
  const [media, setMedia] = useState<Array<{ url?: string; imageCategory?: string }>>([])
  const [complaints, setComplaints] = useState<ComplaintRow[]>([])
  const [vocConfirmed, setVocConfirmed] = useState(false)

  const [gate, setGate] = useState({
    observedArrivalAt: '',
    odometer: '',
    fuelLevel: '',
    observedEngineNo: '',
    observedChassisNo: '',
    engineMatchStatus: 'NOT_CHECKED',
    chassisMatchStatus: 'NOT_CHECKED',
    keyCount: '',
    vehicleConditionRemarks: '',
    receivingRemarks: '',
    customerAcknowledged: false,
  })
  const [inventory, setInventory] = useState<InventoryRow[]>([])

  const load = useCallback(async () => {
    if (!token || !visitId) return
    setLoading(true)
    setError(null)
    try {
      const ws = await receivingApi.getWorkspace(token, visitId, branchId)
      const v = ws.visit as Record<string, unknown>
      setVisit(v)
      setBooking((ws.booking as Record<string, unknown>) ?? null)
      setPickup((ws.pickup as Record<string, unknown>) ?? null)
      const rec = (ws.receiving as Record<string, unknown>) ?? {}
      setReceiving(rec)
      setMedia((ws.media as Array<{ url?: string; imageCategory?: string }>) ?? [])

      setGate({
        observedArrivalAt: rec.observedArrivalAt
          ? new Date(String(rec.observedArrivalAt)).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        odometer: rec.odometer != null ? String(rec.odometer) : '',
        fuelLevel: String(rec.fuelLevel ?? ''),
        observedEngineNo: String(rec.observedEngineNo ?? ''),
        observedChassisNo: String(rec.observedChassisNo ?? ''),
        engineMatchStatus: String(rec.engineMatchStatus ?? 'NOT_CHECKED'),
        chassisMatchStatus: String(rec.chassisMatchStatus ?? 'NOT_CHECKED'),
        keyCount: rec.keyCount != null ? String(rec.keyCount) : '',
        vehicleConditionRemarks: String(rec.vehicleConditionRemarks ?? ''),
        receivingRemarks: String(rec.receivingRemarks ?? ''),
        customerAcknowledged: Boolean(rec.customerAcknowledged),
      })

      const items = (rec.inventoryItems as InventoryRow[]) ?? []
      setInventory(items)

      const voc = ws.voc as { complaints?: ComplaintRow[]; confirmationStatus?: string } | null
      if (voc?.complaints?.length) {
        setComplaints(voc.complaints.map((c) => ({
          title: c.title,
          description: c.description,
          symptoms: c.symptoms,
          source: c.source,
          requestedWork: (c as { requestedWork?: string }).requestedWork,
          priority: c.priority,
          customerRemarks: (c as { customerRemarks?: string }).customerRemarks,
        })))
      } else {
        setComplaints([{ description: '', source: 'ADVISOR' }])
      }
      setVocConfirmed(voc?.confirmationStatus === 'CONFIRMED')

      const ph = await serviceVisitsApi.phaseEligibility(token, visitId, branchId)
      setPhase({ readyForInspection: ph.readyForInspection, blockers: ph.blockers })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }, [token, visitId, branchId])

  useEffect(() => { load() }, [load])

  const buildDraftPayload = () => ({
    observedArrivalAt: gate.observedArrivalAt ? new Date(gate.observedArrivalAt).toISOString() : undefined,
    odometer: gate.odometer ? Number(gate.odometer) : undefined,
    fuelLevel: gate.fuelLevel || undefined,
    observedEngineNo: gate.observedEngineNo || undefined,
    observedChassisNo: gate.observedChassisNo || undefined,
    engineMatchStatus: gate.engineMatchStatus,
    chassisMatchStatus: gate.chassisMatchStatus,
    keyCount: gate.keyCount ? Number(gate.keyCount) : undefined,
    keyReceived: gate.keyCount ? Number(gate.keyCount) > 0 : undefined,
    vehicleConditionRemarks: gate.vehicleConditionRemarks || undefined,
    receivingRemarks: gate.receivingRemarks || undefined,
    customerAcknowledged: gate.customerAcknowledged,
    inventoryItems: inventory,
  })

  const saveDraft = async () => {
    if (!token || !visitId) return
    setMessage(null)
    try {
      await receivingApi.saveDraft(token, visitId, buildDraftPayload(), branchId)
      setMessage('Draft saved')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const saveVoc = async () => {
    if (!token || !visitId) return
    await vocApi.save(token, visitId, {
      complaints: complaints.filter((c) => c.description.trim()).map((c) => ({
        title: c.title,
        description: c.description,
        symptoms: c.symptoms,
        source: c.source ?? 'ADVISOR',
        requestedWork: c.requestedWork,
        priority: c.priority,
        customerRemarks: c.customerRemarks,
      })),
    }, branchId)
    setMessage('VOC saved')
    await load()
  }

  const confirmVoc = async () => {
    if (!token || !visitId) return
    await saveVoc()
    await vocApi.confirm(token, visitId, branchId)
    setMessage('VOC confirmed by service advisor')
    await load()
  }

  const completeReceiving = async () => {
    if (!token || !visitId) return
    await saveDraft()
    const res = await receivingApi.complete(token, visitId, branchId)
    setMessage(
      (res as { alreadyCompleted?: boolean }).alreadyCompleted
        ? 'Receiving was already completed'
        : `Receiving ${res.receivingStatus}`,
    )
    await load()
  }

  const reportData: ReceivingReportData = {
    visitNumber: String((visit as { visitNumber?: string })?.visitNumber ?? visitId),
    bookingNumber: String((booking as { bookingNumber?: string })?.bookingNumber ?? ''),
    customerName: String((visit as { customerId?: { name?: string } })?.customerId?.name ?? ''),
    registrationNo: String((visit as { vehicleId?: { registrationNo?: string } })?.vehicleId?.registrationNo ?? ''),
    observedArrivalAt: gate.observedArrivalAt,
    odometer: gate.odometer ? Number(gate.odometer) : undefined,
    fuelLevel: gate.fuelLevel,
    engineMatchStatus: gate.engineMatchStatus,
    chassisMatchStatus: gate.chassisMatchStatus,
    inventoryDiscrepancies: inventory
      .filter((i) => i.status === 'MISSING' || i.status === 'DAMAGED')
      .map((i) => `${i.label}: ${i.status}`),
    vehicleConditionRemarks: gate.vehicleConditionRemarks,
    vocSummary: complaints.filter((c) => c.description).map((c) => c.title ? `${c.title} — ${c.description}` : c.description),
    customerAcknowledged: gate.customerAcknowledged,
    receivingStatus: String(receiving.receivingStatus ?? ''),
  }

  const vehicle = (visit as { vehicleId?: Record<string, unknown> })?.vehicleId
  const locked = receiving.receivingStatus === 'COMPLETED' || receiving.receivingStatus === 'EXCEPTION'

  if (!visitId) return null

  return (
    <div className="space-y-6">
      <PageBanner
        title="Service visit receiving"
        description="Booking, pickup history, gate-in, inventory, images and VOC on one visit"
        icon={ClipboardCheck}
        gradient="from-indigo-600 to-blue-700"
      />

      {loading && <p className="text-sm text-muted-foreground">Loading workspace…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      {phase && (
        <div className="flex flex-wrap gap-2 items-center">
          {phase.readyForInspection ? (
            <Badge variant="success">Ready for inspection (Phase 2)</Badge>
          ) : (
            <Badge variant="warning">Phase 1 incomplete</Badge>
          )}
          {phase.blockers.map((b) => <Badge key={b} variant="info">{b}</Badge>)}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">1. Booking details</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Booking: {(booking as { bookingNumber?: string })?.bookingNumber ?? '—'}</p>
          <p>Type: {(booking as { bookingType?: string })?.bookingType ?? '—'}</p>
          <p>Status: {(booking as { status?: string })?.status ?? '—'}</p>
          <p>Complaint: {(booking as { customerComplaint?: string })?.customerComplaint ?? '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">2. Pickup / breakdown history</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {pickup ? (
            <p>Pickup status: {String(pickup.status)} · {String(pickup.pickupAddress ?? '')}</p>
          ) : (
            <p className="text-muted-foreground">No pickup task for this booking.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">3. Gate-In verification</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <Input label="Actual arrival" type="datetime-local" value={gate.observedArrivalAt} disabled={locked}
            onChange={(e) => setGate({ ...gate, observedArrivalAt: e.target.value })} />
          <Input label="Gate-In odometer (km)" type="number" value={gate.odometer} disabled={locked}
            onChange={(e) => setGate({ ...gate, odometer: e.target.value })} />
          <div>
            <label className="text-xs font-medium">Fuel level</label>
            <select className="w-full border rounded-md h-10 px-2" disabled={locked} value={gate.fuelLevel}
              onChange={(e) => setGate({ ...gate, fuelLevel: e.target.value })}>
              <option value="">Select</option>
              {FUEL_LEVELS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <Input label="Number of keys" type="number" value={gate.keyCount} disabled={locked}
            onChange={(e) => setGate({ ...gate, keyCount: e.target.value })} />
          <Input label="Observed engine no." value={gate.observedEngineNo} disabled={locked}
            onChange={(e) => setGate({ ...gate, observedEngineNo: e.target.value })} />
          <Input label="Observed chassis no." value={gate.observedChassisNo} disabled={locked}
            onChange={(e) => setGate({ ...gate, observedChassisNo: e.target.value })} />
          <div>
            <label className="text-xs font-medium">Engine verification</label>
            <select className="w-full border rounded-md h-10 px-2" disabled={locked} value={gate.engineMatchStatus}
              onChange={(e) => setGate({ ...gate, engineMatchStatus: e.target.value })}>
              {MATCH_OPTS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Chassis verification</label>
            <select className="w-full border rounded-md h-10 px-2" disabled={locked} value={gate.chassisMatchStatus}
              onChange={(e) => setGate({ ...gate, chassisMatchStatus: e.target.value })}>
              {MATCH_OPTS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input label="Existing damage / condition" value={gate.vehicleConditionRemarks} disabled={locked}
              onChange={(e) => setGate({ ...gate, vehicleConditionRemarks: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Remarks" value={gate.receivingRemarks} disabled={locked}
              onChange={(e) => setGate({ ...gate, receivingRemarks: e.target.value })} />
          </div>
          {vehicle && (
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Master engine: {String(vehicle.engineNo ?? '—')} · Master chassis: {String(vehicle.chassisNo ?? vehicle.vin ?? '—')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">4. Inventory checklist</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {inventory.length === 0 && (
            <p className="text-sm text-amber-700">No inventory master items. Add INVENTORY_* masters and re-open this visit.</p>
          )}
          {inventory.map((row, idx) => (
            <div key={`${row.label}-${idx}`} className="grid sm:grid-cols-4 gap-2 border rounded-lg p-2 text-sm">
              <span className="font-medium sm:col-span-1">{row.label}</span>
              <select disabled={locked} value={row.status} className="border rounded h-9 px-2"
                onChange={(e) => {
                  const next = [...inventory]
                  next[idx] = { ...row, status: e.target.value }
                  setInventory(next)
                }}>
                {ITEM_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Input placeholder="Qty" type="number" disabled={locked} value={row.quantity ?? ''}
                onChange={(e) => {
                  const next = [...inventory]
                  next[idx] = { ...row, quantity: e.target.value ? Number(e.target.value) : undefined }
                  setInventory(next)
                }} />
              <Input placeholder="Remarks" disabled={locked} value={row.remarks ?? ''}
                onChange={(e) => {
                  const next = [...inventory]
                  next[idx] = { ...row, remarks: e.target.value }
                  setInventory(next)
                }} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">5. Vehicle images</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {token && visitId && (
            <>
              <MultiImageUpload token={token} visitId={visitId} category="GATE_IN" label="Gate-In photos" onUploaded={() => load()} />
              <MultiImageUpload token={token} visitId={visitId} category="DAMAGE" label="Damage photos" onUploaded={() => load()} />
            </>
          )}
          {media.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {media.map((m, i) => (
                <a key={i} href={m.url} target="_blank" rel="noreferrer" className="block">
                  <img src={m.url} alt="" className="h-20 w-full object-cover rounded border" />
                  <span className="text-[10px]">{m.imageCategory}</span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">6. Voice of customer</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {vocConfirmed && <Badge variant="success">Confirmed</Badge>}
          {complaints.map((c, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2">
              <Input label="Title" disabled={vocConfirmed} value={c.title ?? ''}
                onChange={(e) => {
                  const next = [...complaints]
                  next[idx] = { ...c, title: e.target.value }
                  setComplaints(next)
                }} />
              <Input label="Description *" disabled={vocConfirmed} value={c.description}
                onChange={(e) => {
                  const next = [...complaints]
                  next[idx] = { ...c, description: e.target.value }
                  setComplaints(next)
                }} />
              <Input label="Symptoms" disabled={vocConfirmed} value={c.symptoms ?? ''}
                onChange={(e) => {
                  const next = [...complaints]
                  next[idx] = { ...c, symptoms: e.target.value }
                  setComplaints(next)
                }} />
              <Input label="Source" disabled value={c.source ?? 'ADVISOR'} />
              <Input label="Customer requested work" disabled={vocConfirmed} value={c.requestedWork ?? ''}
                onChange={(e) => {
                  const next = [...complaints]
                  next[idx] = { ...c, requestedWork: e.target.value }
                  setComplaints(next)
                }} />
              <Input label="Priority" disabled={vocConfirmed} value={c.priority ?? ''}
                onChange={(e) => {
                  const next = [...complaints]
                  next[idx] = { ...c, priority: e.target.value }
                  setComplaints(next)
                }} />
            </div>
          ))}
          {!vocConfirmed && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setComplaints([...complaints, { description: '', source: 'ADVISOR' }])}>
              Add complaint
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 sticky bottom-4 bg-background/90 p-3 border rounded-xl">
        <Button type="button" onClick={saveDraft} disabled={locked}><Save className="w-4 h-4 mr-1" />Save draft</Button>
        <Button type="button" variant="secondary" onClick={saveVoc} disabled={vocConfirmed}>Save VOC</Button>
        <Button type="button" variant="secondary" onClick={confirmVoc} disabled={vocConfirmed}>
          <CheckCircle2 className="w-4 h-4 mr-1" />Advisor confirm VOC
        </Button>
        <Button type="button" onClick={completeReceiving} disabled={locked}>Complete receiving</Button>
        <Button type="button" variant="ghost" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Print report</Button>
        <Button type="button" variant="ghost" onClick={() => navigate('/app/workshop/receiving-hub')}>Back to hub</Button>
        <label className="flex items-center gap-2 text-sm ml-2">
          <input type="checkbox" checked={gate.customerAcknowledged} disabled={locked}
            onChange={(e) => setGate({ ...gate, customerAcknowledged: e.target.checked })} />
          Customer acknowledgment
        </label>
      </div>

      <PrintableReceivingReport ref={printRef} data={reportData} />
    </div>
  )
}
