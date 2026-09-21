import { useEffect, useState } from 'react'
import { Search, Users, Phone, Car, UserPlus, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageBanner } from '@/components/ui/page-banner'
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

  const load = async (q?: string) => {
    const token = authStorage.getToken()
    if (!token) return
    setLoading(true)
    try {
      const res = await customersApi.list(token, q ? { search: q } : undefined)
      setCustomers(res.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
          { label: 'Total Customers', value: customers.length },
          { label: 'Fleet Accounts', value: customers.filter((c) => c.type === 'FLEET').length },
        ]}
        actions={
          <Button className="bg-white text-indigo-700 hover:bg-white/90 shadow-lg" onClick={() => setShowForm(!showForm)}>
            <UserPlus className="h-4 w-4" /> Add Customer
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Customer</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const token = authStorage.getToken()
                if (!token) return
                setSaving(true)
                try {
                  await customersApi.create(token, form)
                  setShowForm(false)
                  setForm({ name: '', mobile: '', email: '', type: 'INDIVIDUAL', city: '' })
                  await load(search)
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
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Customer'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-brand-border/60">
        <CardContent className="p-4">
          <form
            className="relative max-w-md"
            onSubmit={(e) => { e.preventDefault(); load(search) }}
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
        <p className="text-center text-sm text-brand-muted py-12">No customers found. Run seed or add via API.</p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 lg:hidden">
            {customers.map((c, i) => (
              <Card key={c.id} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={AVATARS[i % AVATARS.length]} alt="" className="h-12 w-12 rounded-full ring-2 ring-brand-yellow/30 object-cover" />
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-brand-muted font-mono">{c.code}</p>
                    </div>
                    <Badge variant={c.type === 'FLEET' ? 'info' : 'secondary'} className="ml-auto">{c.type}</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-brand-muted">
                    <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {c.mobile}</p>
                    <p className="flex items-center gap-2"><Car className="h-3.5 w-3.5" /> {c.vehicles} vehicles</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <Link to={`/app/crm/customers/${c.id}`}>View</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden lg:block overflow-hidden">
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
