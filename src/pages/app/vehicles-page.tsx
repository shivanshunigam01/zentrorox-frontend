import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Car, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageBanner } from '@/components/ui/page-banner'
import { VehicleCard } from '@/components/ui/vehicle-card'
import { MasterSelect } from '@/components/ui/master-select'
import { vehiclesApi, customersApi, type VehicleItem, type CustomerItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { ILLUSTRATIONS, STICKERS } from '@/lib/assets'

export function VehiclesPage() {
  const [searchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<VehicleItem[]>([])
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customerId: '',
    registrationNo: '',
    make: '',
    model: '',
    variant: '',
    fuelType: '',
    odometer: '',
  })

  const load = async (q?: string) => {
    const token = authStorage.getToken()
    const branchId = authStorage.getBranchId() ?? undefined
    if (!token) return
    setLoading(true)
    try {
      const [v, c] = await Promise.all([
        vehiclesApi.list(token, q ? { search: q } : undefined, branchId),
        customersApi.list(token, undefined, branchId),
      ])
      setVehicles(v.items)
      setCustomers(c.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(search) }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = authStorage.getToken()
    const branchId = authStorage.getBranchId() ?? undefined
    if (!token) return
    setSaving(true)
    try {
      await vehiclesApi.create(token, {
        customerId: form.customerId,
        registrationNo: form.registrationNo,
        make: form.make,
        model: form.model,
        variant: form.variant || undefined,
        fuelType: form.fuelType || undefined,
        odometer: form.odometer ? Number(form.odometer) : undefined,
      }, branchId)
      setShowForm(false)
      setForm({ customerId: '', registrationNo: '', make: '', model: '', variant: '', fuelType: '', odometer: '' })
      await load(search)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Vehicles"
        description="Vehicle master with live data from MongoDB"
        icon={Car}
        gradient="from-brand-charcoal via-slate-800 to-brand-charcoal-light"
        emoji={STICKERS.car}
        illustration={ILLUSTRATIONS.carService}
        stats={[
          { label: 'Total Vehicles', value: vehicles.length },
          { label: 'Loaded Live', value: '✓' },
        ]}
        actions={
          <Button className="bg-brand-yellow text-brand-charcoal hover:bg-brand-yellow-hover shadow-lg" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Register Vehicle</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Customer *</label>
                <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm">
                  <option value="">Select customer</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.mobile}</option>)}
                </select>
              </div>
              <Input label="Registration No. *" required value={form.registrationNo} onChange={(e) => setForm({ ...form, registrationNo: e.target.value })} />
              <MasterSelect category="VEHICLE_MAKE" label="Make *" required value={form.make} onChange={(v) => setForm({ ...form, make: v, model: '' })} />
              <MasterSelect category="VEHICLE_MODEL" label="Model *" required value={form.model} onChange={(v) => setForm({ ...form, model: v })} parentCode={form.make} />
              <Input label="Variant" value={form.variant} onChange={(e) => setForm({ ...form, variant: e.target.value })} />
              <MasterSelect category="FUEL_TYPE" label="Fuel Type" value={form.fuelType} onChange={(v) => setForm({ ...form, fuelType: v })} />
              <Input label="Odometer (km)" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Vehicle'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <form className="relative max-w-md" onSubmit={(e) => { e.preventDefault(); load(search) }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              placeholder="Search registration, make, model, VIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-brand-border bg-brand-grey/50 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            />
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-sm text-brand-muted py-12">Loading vehicles...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              registration={v.registrationNo}
              make={v.make}
              model={v.model}
              variant={v.variant ?? ''}
              year={0}
              fuel=""
              odometer={0}
              customer={v.customer?.name ?? '—'}
              lastService="—"
              status="Active"
            />
          ))}
        </div>
      )}
    </div>
  )
}
