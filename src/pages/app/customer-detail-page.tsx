import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Car, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { customersApi, type CustomerDetail } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'

export function CustomerDetailPage() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authStorage.getToken()
    if (!token || !id) return
    customersApi.get(token, id).then(setCustomer).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-center py-12 text-sm text-brand-muted">Loading customer...</p>
  if (!customer) return <p className="text-center py-12 text-sm text-brand-danger">Customer not found</p>

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild><Link to="/app/crm/customers"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{customer.name}</CardTitle>
            <Badge>{customer.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
          <p><span className="text-brand-muted">Code:</span> {customer.code}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {customer.mobile}</p>
          {customer.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {customer.email}</p>}
          <p><span className="text-brand-muted">City:</span> {customer.city ?? '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" /> Vehicles ({Array.isArray(customer.vehicles) ? customer.vehicles.length : customer.vehicles ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {Array.isArray(customer.vehicles) && customer.vehicles.length > 0 ? (
            <div className="space-y-2">
              {(customer.vehicles as Array<{ id: string; registrationNo: string; make: string; model: string }>).map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-brand-border px-4 py-3">
                  <div>
                    <p className="font-medium">{v.registrationNo}</p>
                    <p className="text-xs text-brand-muted">{v.make} {v.model}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild><Link to={`/app/crm/vehicles?q=${encodeURIComponent(v.registrationNo)}`}>View</Link></Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-muted">No vehicles linked yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
