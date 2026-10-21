import { useEffect, useState } from 'react'
import { Search, Users, Phone, Car, UserPlus, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageBanner } from '@/components/ui/page-banner'
import { ModuleFormDialog } from '@/components/ui/module-form-dialog'
import { PaginationBar, type PaginationMeta } from '@/components/ui/pagination-bar'
import { customersApi, type CustomerItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { AVATARS, ILLUSTRATIONS, STICKERS } from '@/lib/assets'

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', mobile: '', email: '', type: 'INDIVIDUAL', city: '' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [totalCount, setTotalCount] = useState(0)

  const load = async (q?: string, p = page, l = limit) => {
    const token = authStorage.getToken()
    if (!token) return
    setLoading(true)
    try {
      const res = await customersApi.list(token, { search: q || undefined, page: p, limit: l })
      setCustomers(res.items)
      setPagination(res.pagination)
      setTotalCount(res.pagination.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(search, page, limit) }, [page, limit])

  const runSearch = () => {
    setPage(1)
    load(search, 1, limit)
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Customers"
        description="Manage customer master and vehicle relationships"
        icon={Users}
        gradient="from-blue-600 via-indigo-600 to-violet-700"
        emoji={STICKERS.phone}
        illustration={ILLUSTRATIONS.crm}
        stats={[
          { label: 'Total Customers', value: totalCount },
          { label: 'On This Page', value: customers.length },
        ]}
        actions={
          <Button className="bg-white text-indigo-700 hover:bg-white/90 shadow-lg" onClick={() => setShowForm(true)}>
            <UserPlus className="h-4 w-4" /> Add Customer
          </Button>
        }
      />

      <ModuleFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title="Add Customer"
        description="Create a new customer record for bookings and vehicles"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" form="customer-form" disabled={saving}>
              {saving ? 'Saving...' : 'Create Customer'}
            </Button>
          </>
        }
      >
        <form
          id="customer-form"
          onSubmit={async (e) => {
            e.preventDefault()
            const token = authStorage.getToken()
            if (!token) return
            setSaving(true)
            try {
              await customersApi.create(token, form)
              setShowForm(false)
              setForm({ name: '', mobile: '', email: '', type: 'INDIVIDUAL', city: '' })
              await load(search, page, limit)
            } finally {
              setSaving(false)
            }
          }}
          className="grid sm:grid-cols-2 gap-4"
        >
          <Input label="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Mobile *" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm">
              <option value="INDIVIDUAL">Individual</option>
              <option value="FLEET">Fleet</option>
              <option value="CORPORATE">Corporate</option>
              <option value="INSURANCE">Insurance</option>
            </select>
          </div>
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </form>
      </ModuleFormDialog>

      <Card className="border-brand-border/60">
        <CardContent className="p-4">
          <form
            className="relative max-w-md"
            onSubmit={(e) => { e.preventDefault(); runSearch() }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              placeholder="Search by name, mobile, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-brand-border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow bg-brand-grey/50"
            />
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-sm text-brand-muted py-12">Loading customers...</p>
      ) : customers.length === 0 ? (
        <p className="text-center text-sm text-brand-muted py-12">No customers found. Run seed or add a customer.</p>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-grey/50">
                    <th className="text-left px-5 py-3 font-medium text-brand-muted">Customer</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Code</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Contact</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Type</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Vehicles</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">City</th>
                    <th className="text-right px-5 py-3 font-medium text-brand-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={c.id} className="border-b border-brand-border hover:bg-brand-yellow/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={AVATARS[i % AVATARS.length]} alt="" className="h-10 w-10 rounded-full ring-2 ring-brand-yellow/20 object-cover" />
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 font-mono text-xs text-brand-muted">{c.code}</td>
                      <td className="px-3 py-4 text-brand-muted">
                        <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {c.mobile}</p>
                        {c.email && <p className="flex items-center gap-1.5 mt-0.5 text-xs"><Mail className="h-3 w-3" /> {c.email}</p>}
                      </td>
                      <td className="px-3 py-4"><Badge variant={c.type === 'FLEET' ? 'info' : 'secondary'}>{c.type}</Badge></td>
                      <td className="px-3 py-4"><span className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5 text-brand-yellow" /> {c.vehicles}</span></td>
                      <td className="px-3 py-4 text-brand-muted">{c.city ?? '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <Button variant="ghost" size="sm" asChild><Link to={`/app/crm/customers/${c.id}`}>View</Link></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
