import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Car, Clock, AlertTriangle, Wrench, Package, CheckCircle, Truck,
  ClipboardList, Eye, FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { serviceVisitsApi, type WipItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'

const kanbanColumns = [
  { name: 'Awaiting Evaluation', icon: Eye, color: 'border-t-blue-400' },
  { name: 'Awaiting Estimate', icon: FileText, color: 'border-t-purple-400' },
  { name: 'Awaiting Approval', icon: ClipboardList, color: 'border-t-amber-400' },
  { name: 'Awaiting Job Card', icon: Wrench, color: 'border-t-indigo-400' },
  { name: 'WIP', icon: Wrench, color: 'border-t-brand-yellow' },
  { name: 'Parts Pending', icon: Package, color: 'border-t-orange-400' },
  { name: 'QC Pending', icon: CheckCircle, color: 'border-t-cyan-400' },
  { name: 'Ready for Delivery', icon: Truck, color: 'border-t-green-400' },
]

const STAGE_TO_COLUMN: Record<string, string> = {
  INSPECTION: 'Awaiting Evaluation',
  DIAGNOSIS: 'Awaiting Evaluation',
  ESTIMATE: 'Awaiting Estimate',
  APPROVAL: 'Awaiting Approval',
  JOB_CARD: 'Awaiting Job Card',
  WIP: 'WIP',
  BAY: 'WIP',
  ASSIGNMENT: 'WIP',
  QC: 'QC Pending',
  DELIVERY: 'Ready for Delivery',
}

function getCardsForColumn(col: string, vehicles: WipItem[]) {
  return vehicles.filter((v) => STAGE_TO_COLUMN[v.status] === col || v.status === col.replace(/ /g, '_').toUpperCase())
}

export function WipPage() {
  const [vehicles, setVehicles] = useState<WipItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authStorage.getToken()
    const branchId = authStorage.getBranchId() ?? undefined
    if (!token) return
    serviceVisitsApi.wip(token, branchId).then(setVehicles).finally(() => setLoading(false))
  }, [])

  const totalWip = vehicles.length
  const overdueCount = vehicles.filter((v) => {
    const h = parseInt(v.ageing, 10)
    return !Number.isNaN(h) && h >= 4
  }).length

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-charcoal to-brand-charcoal-light p-6 text-white">
        <div className="absolute right-0 top-0 opacity-10">
          <img src="/images/car-service.svg" alt="" className="h-32 w-32 animate-float" />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="h-6 w-6 text-brand-yellow" />
              WIP Control Tower
            </h1>
            <p className="text-sm text-white/60 mt-0.5">Real-time workshop floor visibility</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalWip}</p>
              <p className="text-xs text-white/60">Total WIP</p>
            </div>
            <div className="rounded-xl bg-red-500/20 backdrop-blur-sm px-4 py-2 text-center">
              <p className="text-2xl font-bold text-red-300">{overdueCount}</p>
              <p className="text-xs text-white/60">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {kanbanColumns.map((col) => {
            const cards = getCardsForColumn(col.name, vehicles)
            const ColIcon = col.icon

            return (
              <div key={col.name} className={`w-72 shrink-0 rounded-xl border-t-4 ${col.color} bg-brand-grey/30 p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-brand-charcoal flex items-center gap-2">
                    <ColIcon className="h-4 w-4 text-brand-muted" />
                    {col.name}
                  </h3>
                  <Badge variant="secondary">{cards.length}</Badge>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {cards.map((v) => (
                    <Link key={v.id} to={`/app/service-visits/${v.id}/wip`}>
                      <Card className="hover:shadow-[var(--shadow-card-hover)] transition-all hover:-translate-y-0.5 cursor-pointer border-0">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/15">
                              <Car className="h-5 w-5 text-brand-charcoal" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{v.registration}</p>
                              <p className="text-xs text-brand-muted mt-0.5">{v.model}</p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1.5 text-xs text-brand-muted">
                            <p className="flex items-center gap-1.5">
                              <ClipboardList className="h-3 w-3" /> JC: {v.jc}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Wrench className="h-3 w-3" /> Bay: {v.bay ?? '—'}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <Badge variant="warning" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {v.ageing}
                            </Badge>
                            <span className="text-[10px] text-brand-muted">Promise: {v.promiseTime}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {cards.length === 0 && (
                    <div className="rounded-lg border border-dashed border-brand-border p-6 text-center">
                      <Car className="h-8 w-8 mx-auto text-brand-muted/40 mb-2" />
                      <p className="text-xs text-brand-muted">No vehicles</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand-warning" />
            WIP Ageing Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-grey/50">
                  {['Registration', 'JC', 'Status', 'Advisor', 'Technician', 'Bay', 'Promise', 'Ageing', 'Reason'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-brand-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-brand-muted">Loading WIP...</td></tr>
                ) : vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-brand-border hover:bg-brand-grey/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link to={`/app/service-visits/${v.id}/wip`} className="flex items-center gap-2 hover:text-brand-yellow">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-yellow/10">
                          <Car className="h-3.5 w-3.5" />
                        </div>
                        {v.registration}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{v.jc ?? '—'}</td>
                    <td className="px-4 py-3"><Badge>{v.status}</Badge></td>
                    <td className="px-4 py-3 text-brand-muted">—</td>
                    <td className="px-4 py-3 text-brand-muted">—</td>
                    <td className="px-4 py-3 text-brand-muted">{v.bay ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-muted">{v.promiseTime ? new Date(v.promiseTime).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-brand-danger font-medium">
                        <Clock className="h-3.5 w-3.5" /> {v.ageing}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{v.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
