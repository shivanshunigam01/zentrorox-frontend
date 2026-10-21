import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileText, Plus, Save, Send } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { authStorage } from '@/lib/auth-storage'
import { estimatesApi } from '@/lib/api'

const CATEGORIES = ['LABOUR', 'PARTS', 'LUBRICANT', 'PICKUP', 'TOWING', 'OTHER'] as const

type LineRow = {
  lineId: string
  category: string
  description: string
  quantity: number
  unitRate: number
  hsnSac: string
  discountAmount?: number
}

type QueueRow = {
  serviceVisitId: string
  serviceVisitNumber?: string
  estimateId?: string
  estimateNumber?: string
  estimateStatus?: string
  estimateAmount?: number
  inspectionReportNumber?: string
}

function newLine(): LineRow {
  return {
    lineId: crypto.randomUUID(),
    category: 'LABOUR',
    description: '',
    quantity: 1,
    unitRate: 0,
    hsnSac: '998729',
    discountAmount: 0,
  }
}

export function EstimateManagementPage() {
  const { estimateId } = useParams()
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const [tab, setTab] = useState('')
  const [queue, setQueue] = useState<QueueRow[]>([])
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [lines, setLines] = useState<LineRow[]>([newLine()])
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [version, setVersion] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [queueTotal, setQueueTotal] = useState(0)

  const loadQueue = async () => {
    if (!token) return
    const [dash, q] = await Promise.all([
      estimatesApi.dashboard(token, branchId),
      estimatesApi.queue(token, { status: tab || undefined, page, limit }, branchId),
    ])
    setKpis(dash)
    setQueue(q.items as QueueRow[])
    setQueueTotal(q.total ?? q.items.length)
  }

  const loadEstimate = async (id: string) => {
    if (!token) return
    const d = await estimatesApi.get(token, id, branchId)
    setDetail(d)
    const rev = (d.revisions as Array<{ revisionNumber: number; items?: LineRow[]; totals?: Record<string, number> }>)
      ?.find((r) => r.revisionNumber === d.currentRevisionNumber)
    setLines((rev?.items as LineRow[])?.length ? (rev!.items as LineRow[]) : [newLine()])
    setTotals(rev?.totals ?? {})
    setVersion(Number(d.version ?? 0))
  }

  useEffect(() => { loadQueue() }, [tab, page, limit])
  useEffect(() => {
    if (estimateId) loadEstimate(estimateId)
  }, [estimateId])

  const saveDraft = async () => {
    if (!token || !estimateId) return
    const res = await estimatesApi.saveDraft(token, estimateId, lines, version, branchId)
    setTotals(res.totals)
    setVersion(res.version)
    setMessage('Draft saved (server-calculated totals)')
  }

  const openEstimate = async (row: QueueRow) => {
    if (row.estimateId) {
      navigate(`/app/workshop/estimates/${row.estimateId}`)
      return
    }
    if (!token || !row.inspectionReportNumber) {
      setMessage('Create estimate from completed inspection in Trial & Inspection first')
      return
    }
    setMessage('Use inspection case ID to create — open from inspection approval flow')
  }

  if (estimateId) {
    const status = String(detail?.status ?? 'DRAFT')
    return (
      <div className="space-y-6 pb-24">
        <PageBanner title={`Estimate ${String(detail?.estimateNumber ?? estimateId)}`} description="Unified editor — server-side tax & totals" icon={FileText} gradient="from-amber-600 to-orange-700" />
        {message && <p className="text-sm text-green-700">{message}</p>}
        <Badge variant="info">{status}</Badge>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {lines.map((line, idx) => (
              <Card key={line.lineId}>
                <CardContent className="p-3 grid sm:grid-cols-2 gap-2 text-sm">
                  <select className="border rounded h-9" value={line.category} onChange={(e) => {
                    const next = [...lines]; next[idx] = { ...line, category: e.target.value }; setLines(next)
                  }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Input placeholder="HSN/SAC" value={line.hsnSac} onChange={(e) => {
                    const next = [...lines]; next[idx] = { ...line, hsnSac: e.target.value }; setLines(next)
                  }} />
                  <Input className="sm:col-span-2" placeholder="Description" value={line.description} onChange={(e) => {
                    const next = [...lines]; next[idx] = { ...line, description: e.target.value }; setLines(next)
                  }} />
                  <Input type="number" placeholder="Qty" value={line.quantity} onChange={(e) => {
                    const next = [...lines]; next[idx] = { ...line, quantity: Number(e.target.value) }; setLines(next)
                  }} />
                  <Input type="number" placeholder="Unit rate" value={line.unitRate} onChange={(e) => {
                    const next = [...lines]; next[idx] = { ...line, unitRate: Number(e.target.value) }; setLines(next)
                  }} />
                </CardContent>
              </Card>
            ))}
            <Button variant="secondary" onClick={() => setLines([...lines, newLine()])}><Plus className="w-4 h-4 mr-1" />Add line</Button>
          </div>
          <Card className="sticky top-4 h-fit">
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>Taxable: ₹{totals.taxableAmount?.toFixed(2) ?? '—'}</p>
              <p>CGST: ₹{totals.cgst?.toFixed(2) ?? '0'} SGST: ₹{totals.sgst?.toFixed(2) ?? '0'}</p>
              <p className="text-lg font-bold">Total: ₹{totals.finalAmount?.toFixed(2) ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Totals from backend after save</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={saveDraft}><Save className="w-4 h-4 mr-1" />Save draft</Button>
          <Button variant="secondary" onClick={() => estimatesApi.submitReview(token!, estimateId, branchId).then(() => setMessage('Submitted for review'))}>
            <Send className="w-4 h-4 mr-1" />Internal review
          </Button>
          <Button variant="secondary" onClick={() => estimatesApi.issue(token!, estimateId, branchId).then(() => loadEstimate(estimateId))}>Issue to customer</Button>
          <Button type="button" variant="ghost" onClick={() => estimatesApi.openPdf(token!, estimateId, branchId).catch((e) => setMessage(e instanceof Error ? e.message : 'PDF failed'))}>
            Preview PDF
          </Button>
          <Button variant="ghost" onClick={() => navigate('/app/workshop/estimates')}>Back to queue</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageBanner title="Estimate management" description="Queue after approved inspection — GST, discounts, PDF and customer approval" icon={FileText} gradient="from-amber-600 to-orange-700" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
        {Object.entries(kpis).map(([k, v]) => (
          <Card key={k}><CardContent className="p-2"><div className="font-bold">{v}</div><div className="text-muted-foreground">{k}</div></CardContent></Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {['', 'DRAFT', 'INTERNAL_REVIEW', 'SENT_TO_CUSTOMER', 'CUSTOMER_APPROVED'].map((s) => (
          <Button key={s || 'all'} size="sm" variant={tab === s ? 'default' : 'secondary'} onClick={() => { setTab(s); setPage(1) }}>{s || 'All'}</Button>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Estimate queue</CardTitle></CardHeader>
        <CardContent className="p-0">
          {queue.length === 0 ? (
            <p className="text-muted-foreground text-sm p-4">No visits ready — complete inspection approval first.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-brand-grey/50 text-left text-brand-muted">
                      <th className="p-3">Visit</th>
                      <th className="p-3">Estimate</th>
                      <th className="p-3">Inspection</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((row) => (
                      <tr key={row.serviceVisitId} className="border-b hover:bg-brand-grey/30">
                        <td className="p-3 font-medium">{row.serviceVisitNumber}</td>
                        <td className="p-3">{row.estimateNumber ?? '—'}</td>
                        <td className="p-3 text-muted-foreground">{row.inspectionReportNumber ?? '—'}</td>
                        <td className="p-3"><Badge variant="info">{row.estimateStatus ?? 'Pending'}</Badge></td>
                        <td className="p-3 text-right">
                          <Button size="sm" onClick={() => row.estimateId ? navigate(`/app/workshop/estimates/${row.estimateId}`) : openEstimate(row)}>
                            {row.estimateId ? 'Open' : 'Create'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                page={page}
                totalPages={Math.max(1, Math.ceil(queueTotal / limit))}
                total={queueTotal}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(n) => { setLimit(n); setPage(1) }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
