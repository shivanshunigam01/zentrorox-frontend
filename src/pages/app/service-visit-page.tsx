import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Play, Pause, RotateCcw, CheckCircle2, User, MapPin, Wrench,
  Package, Camera, AlertCircle, ChevronRight,
} from 'lucide-react'
import { ServiceVisitWorkspace } from '@/components/service-visit/service-visit-workspace'
import { ArrivalGateForm } from '@/components/service-visit/arrival-gate-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StickerBadge } from '@/components/ui/sticker-badge'
import { serviceVisitsApi, jobCardsApi, type ServiceVisitDetail, type JobCardItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { GIFS, IMAGES, STICKERS } from '@/lib/assets'
import { PrintableInvoice } from '@/components/documents/printable-invoice'
import type { ServiceVisit, WorkflowStage } from '@/types'

const stageContent: Record<string, { title: string; description: string; emoji: string }> = {
  wip: {
    title: 'Work In Progress',
    description: 'Track technician assignments, work logs, parts consumption and hold reasons.',
    emoji: '🔧',
  },
  booking: { title: 'Booking', description: 'Service booking details, preferred slot and customer complaint.', emoji: '📅' },
  'gate-in': { title: 'Gate-In / Arrival', description: 'Record vehicle arrival, odometer, fuel level and parking.', emoji: '🚧' },
  receiving: { title: 'Vehicle Receiving', description: 'Document vehicle condition, accessories, keys and belongings.', emoji: '📋' },
  voc: { title: 'Voice of Customer', description: 'Capture structured complaint lines and customer voice.', emoji: '💬' },
  inspection: { title: 'Inspection', description: 'Configurable checkpoints with severity and photo evidence.', emoji: '🔍' },
  diagnosis: { title: 'Diagnosis', description: 'Road trial, DTC codes, root cause and recommended action.', emoji: '🩺' },
  estimate: { title: 'Estimate', description: 'Line items for parts, labour, consumables with versioning.', emoji: '💰' },
  approval: { title: 'Customer Approval', description: 'Line-level approval with OTP/signature evidence.', emoji: '✅' },
  'job-card': { title: 'Job Card', description: 'Approved work order with promise date, bay and technician assignment.', emoji: '📋' },
  qc: { title: 'Quality Check', description: 'Configurable QC checklist with pass/fail and photo evidence.', emoji: '🛡️' },
  invoice: { title: 'Invoice', description: 'Final billing derived from completed job card.', emoji: '🧾' },
  delivery: { title: 'Delivery', description: 'Vehicle handover with keys, documents and customer signature.', emoji: '🎉' },
}


function mapVisit(detail: ServiceVisitDetail): ServiceVisit {
  return {
    id: detail.id,
    visitNumber: detail.visitNumber,
    registrationNumber: detail.registrationNumber,
    customerName: detail.customerName,
    customerMobile: detail.customerMobile,
    make: detail.make ?? '—',
    model: detail.model ?? '—',
    variant: detail.variant ?? '—',
    vin: detail.vin ?? '—',
    engineNumber: detail.engineNo ?? '—',
    odometer: detail.odometer ?? 0,
    fuel: detail.fuel ?? '—',
    jobCardNumber: detail.jobCardNumber,
    advisor: typeof detail.advisor === 'string' ? detail.advisor : '—',
    status: detail.status,
    promiseTime: detail.promiseTime,
    outstanding: detail.outstanding,
    currentStage: detail.currentStage,
    stages: detail.stages as WorkflowStage[],
  }
}

function getNextStagePath(visit: ServiceVisitDetail): string | null {
  const currentIndex = visit.stages.findIndex((s) => s.status === 'current')
  if (currentIndex === -1 || currentIndex >= visit.stages.length - 1) return null
  return visit.stages[currentIndex + 1]?.path ?? null
}

export function ServiceVisitPage() {
  const { visitId, stage } = useParams()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<ServiceVisitDetail | null>(null)
  const [jobCard, setJobCard] = useState<JobCardItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState(false)

  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const loadVisit = async () => {
    if (!token || !visitId) return
    setLoading(true)
    try {
      const [data, jc] = await Promise.all([
        serviceVisitsApi.get(token, visitId, branchId),
        jobCardsApi.byVisit(token, visitId, branchId),
      ])
      setVisit(data)
      setJobCard(jc)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load service visit')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVisit()
  }, [visitId])

  const handleAdvanceStage = async () => {
    if (!token || !visitId || !visit) return
    const currentIdx = visit.stages.findIndex((s) => s.status === 'current')
    if (currentIdx === -1 || currentIdx >= visit.stages.length - 1) return

    const nextStage = visit.stages[currentIdx + 1]
    const stageKey = nextStage.id.toUpperCase()
    setAdvancing(true)
    try {
      const updated = await serviceVisitsApi.advanceStage(token, visitId, stageKey, branchId)
      setVisit(updated)
      if (nextStage.path) navigate(`/app/service-visits/${visitId}/${nextStage.path}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to advance stage')
    } finally {
      setAdvancing(false)
    }
  }

  if (loading) {
    return <p className="text-center py-12 text-sm text-brand-muted">Loading service visit...</p>
  }

  if (error || !visit) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-6 py-8 text-center">
        <p className="text-sm text-brand-danger">{error ?? 'Service visit not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app/workshop/wip')}>
          Back to WIP
        </Button>
      </div>
    )
  }

  const mappedVisit = mapVisit(visit)
  const content = stageContent[stage || 'wip'] || {
    title: stage?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Service Visit',
    description: 'This stage workspace will connect to the backend API.',
    emoji: '📋',
  }
  const nextPath = getNextStagePath(visit)

  return (
    <ServiceVisitWorkspace visit={mappedVisit} stageTitle={content.title}>
      <Card className="overflow-hidden border-brand-border/60">
        <CardContent className="p-0">
          {stage === 'wip' ? (
            <div>
              <div className="relative h-32 overflow-hidden bg-brand-charcoal">
                <img src={IMAGES.mechanicWorking} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal/90 to-transparent" />
                <div className="relative p-5 flex items-center justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{content.emoji}</span>
                      <Badge variant="default">In Progress</Badge>
                    </div>
                    <p className="text-white/70 text-sm max-w-md">{content.description}</p>
                  </div>
                  <div className="hidden sm:block h-20 w-20 rounded-xl overflow-hidden border-2 border-brand-yellow/40 shadow-xl animate-wiggle">
                    <img src={GIFS.mechanicWorking} alt="" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  {jobCard?.bay && <StickerBadge emoji={STICKERS.wrench} label={`${jobCard.bay} Active`} />}
                  {jobCard?.jobCardNumber && <StickerBadge emoji={STICKERS.parts} label={jobCard.jobCardNumber} delay={150} />}
                  <StickerBadge emoji="⏱️" label={visit.currentStage.replace(/_/g, ' ')} delay={300} />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Advisor', value: jobCard?.advisor ?? visit.advisor ?? '—', icon: User, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Bay', value: jobCard?.bay ?? '—', icon: MapPin, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Job Status', value: jobCard?.status ?? visit.status, icon: Wrench, color: 'bg-green-50 text-green-600', badge: true },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-brand-border p-4 hover:shadow-sm transition-shadow">
                      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${item.color} mb-2`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-brand-muted">{item.label}</p>
                      {item.badge ? (
                        <Badge variant="default" className="mt-1">{item.value}</Badge>
                      ) : (
                        <p className="text-sm font-semibold mt-0.5 text-brand-charcoal">{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-brand-grey p-5">
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-4">Technician Controls</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button size="lg" className="h-16 flex-col gap-1 rounded-xl shadow-md">
                      <Play className="h-6 w-6" />
                      <span className="text-xs font-bold">START</span>
                    </Button>
                    <Button size="lg" variant="outline" className="h-16 flex-col gap-1 rounded-xl border-amber-300 hover:bg-amber-50">
                      <Pause className="h-6 w-6 text-amber-600" />
                      <span className="text-xs font-bold text-amber-700">PAUSE</span>
                    </Button>
                    <Button size="lg" variant="secondary" className="h-16 flex-col gap-1 rounded-xl">
                      <RotateCcw className="h-6 w-6" />
                      <span className="text-xs font-bold">RESUME</span>
                    </Button>
                    <Button size="lg" variant="dark" className="h-16 flex-col gap-1 rounded-xl shadow-md">
                      <CheckCircle2 className="h-6 w-6" />
                      <span className="text-xs font-bold">COMPLETE</span>
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-brand-border p-5">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-brand-yellow" />
                    Job Card Summary
                  </h4>
                  {jobCard ? (
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <p><span className="text-brand-muted">Job Card:</span> {jobCard.jobCardNumber}</p>
                      <p><span className="text-brand-muted">Type:</span> {jobCard.jobType ?? '—'}</p>
                      <p><span className="text-brand-muted">Approved Value:</span> ₹{jobCard.approvedValue.toLocaleString()}</p>
                      <p><span className="text-brand-muted">Current Value:</span> ₹{jobCard.currentValue.toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-brand-muted">No job card created yet for this visit.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm"><Package className="h-4 w-4" /> Request Parts</Button>
                  <Button variant="outline" size="sm"><Camera className="h-4 w-4" /> Add Photos</Button>
                  <Button variant="outline" size="sm"><AlertCircle className="h-4 w-4" /> Report Hold</Button>
                </div>
              </div>
            </div>
          ) : stage === 'invoice' ? (
            <div className="p-6">
              <PrintableInvoice visit={visit} jobCard={jobCard} />
              {nextPath && (
                <div className="flex justify-center mt-6 no-print">
                  <Button onClick={handleAdvanceStage} disabled={advancing}>
                    {advancing ? 'Advancing...' : <>Advance to Payment <ChevronRight className="h-4 w-4" /></>}
                  </Button>
                </div>
              )}
            </div>
          ) : stage === 'gate-in' ? (
            <ArrivalGateForm
              visit={visit}
              onSaved={setVisit}
              onAdvance={handleAdvanceStage}
              advancing={advancing}
              canAdvance={Boolean(nextPath)}
            />
          ) : (
            <div className="p-8">
              <div className="text-center mb-6">
                <span className="text-5xl block animate-float mb-4">{content.emoji}</span>
                <p className="text-sm text-brand-muted max-w-md mx-auto">{content.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-grey px-4 py-2 text-xs text-brand-muted">
                  Stage: <code className="font-mono text-brand-charcoal">{stage}</code>
                  <span className="text-brand-border">|</span>
                  Current: <Badge variant="default">{visit.currentStage.replace(/_/g, ' ')}</Badge>
                </div>
              </div>

              {nextPath && (
                <div className="flex justify-center">
                  <Button onClick={handleAdvanceStage} disabled={advancing}>
                    {advancing ? 'Advancing...' : (
                      <>
                        Advance to Next Stage
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="mt-8 mx-auto max-w-xs rounded-xl overflow-hidden border border-brand-border shadow-lg">
                <img src={GIFS.checkDone} alt="" className="w-full h-32 object-cover" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ServiceVisitWorkspace>
  )
}
