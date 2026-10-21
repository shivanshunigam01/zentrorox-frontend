import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Car, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageBanner } from '@/components/ui/page-banner'
import { MasterSelect } from '@/components/ui/master-select'
import { ModuleFormDialog } from '@/components/ui/module-form-dialog'
import { PaginationBar, type PaginationMeta } from '@/components/ui/pagination-bar'
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
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [form, setForm] = useState({
    customerId: '',
    registrationNo: '',
    make: '',
    model: '',
    variant: '',
    fuelType: '',
    odometer: '',
  })

  const load = async (q?: string, p = page, l = limit) => {
    const token = authStorage.getToken()
    const branchId = authStorage.getBranchId() ?? undefined
    if (!token) return
    setLoading(true)
    try {
      const [v, c] = await Promise.all([
        vehiclesApi.list(token, { search: q || undefined, page: p, limit: l }, branchId),
        customersApi.list(token, { limit: 500 }, branchId),
      ])
      setVehicles(v.items)
      setPagination(v.pagination)
      setCustomers(c.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(search, page, limit) }, [page, limit])

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
      await load(search, page, limit)
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
          { label: 'Total Vehicles', value: pagination.total },
          { label: 'On This Page', value: vehicles.length },
        ]}
        actions={
          <Button className="bg-brand-yellow text-brand-charcoal hover:bg-brand-yellow-hover shadow-lg" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        }
      />

      <ModuleFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title="Register Vehicle"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" form="vehicle-form" disabled={saving}>{saving ? 'Saving...' : 'Save Vehicle'}</Button>
          </>
        }
      >
        <form id="vehicle-form" onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
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
        </form>
      </ModuleFormDialog>

      <Card>
        <CardContent className="p-4">
          <form className="relative max-w-md" onSubmit={(e) => { e.preventDefault(); setPage(1); load(search, 1, limit) }}>
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
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-grey/50">
                    <th className="text-left px-5 py-3 font-medium text-brand-muted">Registration</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Make / Model</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Customer</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Fuel</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className="border-b border-brand-border hover:bg-brand-grey/30">
                      <td className="px-5 py-3 font-mono font-medium">{v.registrationNo}</td>
                      <td className="px-3 py-3">{v.make} {v.model}{v.variant ? ` · ${v.variant}` : ''}</td>
                      <td className="px-3 py-3">{v.customer?.name ?? '—'}</td>
                      <td className="px-3 py-3 text-brand-muted">{v.fuelType ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vehicles.length === 0 && (
                <p className="text-center text-sm text-brand-muted py-8">No vehicles match your search.</p>
              )}
            </div>
            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
              onLimitChange={(n) => { setLimit(n); setPage(1) }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
