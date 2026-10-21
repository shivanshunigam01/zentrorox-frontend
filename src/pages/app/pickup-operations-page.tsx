import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ModuleFormDialog } from '@/components/ui/module-form-dialog'
import { PaginationBar, clientPagination } from '@/components/ui/pagination-bar'
import { authStorage } from '@/lib/auth-storage'
import { pickupsApi, usersApi, type PickupTaskItem } from '@/lib/api'

const TABS = [
  { key: 'UNASSIGNED', label: 'Unassigned' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
] as const

export function PickupOperationsPage() {
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined
  const [tab, setTab] = useState<string>('UNASSIGNED')
  const [items, setItems] = useState<PickupTaskItem[]>([])
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [assignPickupId, setAssignPickupId] = useState<string | null>(null)
  const [driverId, setDriverId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [pickups, users] = await Promise.all([
        pickupsApi.list(token, { status: tab }, branchId),
        usersApi.list(token, branchId),
      ])
      setItems(pickups.items)
      setDrivers(users.map((u) => ({ id: u.id, name: u.name })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); setPage(1) }, [tab])

  const { slice: pageItems, meta } = clientPagination(items, page, limit)

  const submitAssign = async () => {
    if (!token || !assignPickupId || !driverId) return
    setAssigning(true)
    try {
      await pickupsApi.assign(token, assignPickupId, { driverId }, branchId)
      setAssignPickupId(null)
      setDriverId('')
      await load()
    } finally {
      setAssigning(false)
    }
  }

  const markInProgress = async (pickupId: string) => {
    if (!token) return
    await pickupsApi.updateStatus(token, pickupId, 'IN_PROGRESS', branchId)
    await load()
  }

  const completePickup = async (pickupId: string) => {
    if (!token) return
    await pickupsApi.updateStatus(token, pickupId, 'COMPLETED', branchId)
    await load()
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Pickup Operations"
        description="Assign drivers, track breakdown assistance and hand over to gate-in queue"
        icon={Truck}
        gradient="from-sky-600 to-blue-700"
        emoji="🚚"
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <ModuleFormDialog
        open={!!assignPickupId}
        onOpenChange={(open) => { if (!open) { setAssignPickupId(null); setDriverId('') } }}
        title="Assign driver"
        description="Select pickup executive for this request"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setAssignPickupId(null)}>Cancel</Button>
            <Button type="button" disabled={!driverId || assigning} onClick={submitAssign}>
              {assigning ? 'Assigning…' : 'Assign'}
            </Button>
          </>
        }
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Driver</label>
          <select
            className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          >
            <option value="">Select driver</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </ModuleFormDialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pickup requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <p className="text-sm text-muted-foreground p-4">Loading…</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground p-4">No pickups in this queue.</p>
          )}
          {!loading && items.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-brand-grey/50 text-left text-brand-muted">
                      <th className="p-3">Booking</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-brand-grey/30">
                        <td className="p-3 font-medium">
                          {(p.booking as { bookingNumber?: string })?.bookingNumber ?? p.bookingId}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{p.pickupAddress ?? '—'}</td>
                        <td className="p-3"><Badge variant="info">{p.status}</Badge></td>
                        <td className="p-3 text-right space-x-1">
                          {p.status === 'UNASSIGNED' && (
                            <Button size="sm" disabled={!drivers.length} onClick={() => setAssignPickupId(p.id)}>
                              Assign
                            </Button>
                          )}
                          {p.status === 'ASSIGNED' && (
                            <Button size="sm" onClick={() => markInProgress(p.id)}>Start</Button>
                          )}
                          {p.status === 'IN_PROGRESS' && (
                            <Button size="sm" onClick={() => completePickup(p.id)}>Complete</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
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
