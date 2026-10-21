import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PaginationBar, clientPagination } from '@/components/ui/pagination-bar'
import { authStorage } from '@/lib/auth-storage'
import { receivingApi } from '@/lib/api'

type QueueRow = {
  id: string
  kind?: string
  reference?: string
  visitNumber?: string
  status?: string
  customer?: { name?: string; mobile?: string }
  vehicle?: { registrationNo?: string; make?: string; model?: string }
}

export function VehicleReceivingWorkspacePage() {
  const navigate = useNavigate()
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined
  const [expected, setExpected] = useState<QueueRow[]>([])
  const [visits, setVisits] = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expectedPage, setExpectedPage] = useState(1)
  const [visitsPage, setVisitsPage] = useState(1)
  const [limit, setLimit] = useState(8)

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const q = await receivingApi.queue(token, branchId)
      setExpected((q.expectedArrivals ?? []) as QueueRow[])
      setVisits((q.activeVisits ?? []) as QueueRow[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openVisit = (visitId: string) => {
    navigate(`/app/service-visits/${visitId}/receiving`)
  }

  const expectedPaginated = clientPagination(expected, expectedPage, limit)
  const visitsPaginated = clientPagination(visits, visitsPage, limit)

  return (
    <div className="space-y-6">
      <PageBanner
        title="Vehicle Receiving"
        description="Expected arrivals, gate-in verification, inventory and VOC on one workflow"
        icon={ClipboardCheck}
        gradient="from-violet-600 to-purple-700"
        emoji="🛃"
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expected arrivals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading && <p className="text-sm text-muted-foreground p-4">Loading…</p>}
            {!loading && expected.length === 0 && (
              <p className="text-sm text-muted-foreground p-4">
                No bookings awaiting gate-in.{' '}
                <button type="button" className="font-medium text-brand-charcoal underline" onClick={() => navigate('/app/workshop/bookings')}>
                  Create a booking
                </button>{' '}
                first, then return here for gate-in and VOC.
              </p>
            )}
            {!loading && expected.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-brand-grey/50 text-left text-brand-muted">
                        <th className="p-3">Reference</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Vehicle</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expectedPaginated.slice.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="p-3 font-medium">{row.reference ?? row.id}</td>
                          <td className="p-3">{row.customer?.name}</td>
                          <td className="p-3">{row.vehicle?.registrationNo}</td>
                          <td className="p-3 text-muted-foreground">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar
                  page={expectedPaginated.meta.page}
                  totalPages={expectedPaginated.meta.totalPages}
                  total={expectedPaginated.meta.total}
                  limit={expectedPaginated.meta.limit}
                  onPageChange={setExpectedPage}
                  limitOptions={[5, 8, 15]}
                  onLimitChange={(n) => { setLimit(n); setExpectedPage(1); setVisitsPage(1) }}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active service visits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!loading && visits.length === 0 && (
              <p className="text-sm text-muted-foreground p-4">No active visits in receiving.</p>
            )}
            {visits.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-brand-grey/50 text-left text-brand-muted">
                        <th className="p-3">Visit</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Vehicle</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitsPaginated.slice.map((v) => (
                        <tr key={v.id} className="border-b hover:bg-brand-grey/30">
                          <td className="p-3 font-medium">{v.visitNumber}</td>
                          <td className="p-3">{v.customer?.name}</td>
                          <td className="p-3">{v.vehicle?.registrationNo}</td>
                          <td className="p-3 text-right">
                            <Button size="sm" onClick={() => openVisit(v.id)}>Receive</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar
                  page={visitsPaginated.meta.page}
                  totalPages={visitsPaginated.meta.totalPages}
                  total={visitsPaginated.meta.total}
                  limit={visitsPaginated.meta.limit}
                  onPageChange={setVisitsPage}
                  limitOptions={[5, 8, 15]}
                  onLimitChange={(n) => { setLimit(n); setExpectedPage(1); setVisitsPage(1) }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
