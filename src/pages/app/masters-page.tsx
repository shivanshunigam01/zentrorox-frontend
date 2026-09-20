import { useEffect, useState } from 'react'
import { Plus, Database, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageBanner } from '@/components/ui/page-banner'
import { Badge } from '@/components/ui/badge'
import { MASTER_CATEGORIES, type MasterCategory } from '@/lib/master-categories'
import { mastersApi, type MasterItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'

export function MastersPage() {
  const [activeCategory, setActiveCategory] = useState<MasterCategory>('SERVICE_TYPE')
  const [items, setItems] = useState<MasterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ code: '', label: '', parentCode: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadItems = async () => {
    const token = authStorage.getToken()
    if (!token) return
    setLoading(true)
    try {
      const data = await mastersApi.listByCategory(token, activeCategory)
      setItems(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load masters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [activeCategory])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = authStorage.getToken()
    if (!token) return
    setSaving(true)
    try {
      await mastersApi.create(token, {
        category: activeCategory,
        code: form.code,
        label: form.label,
        parentCode: form.parentCode || undefined,
      })
      setForm({ code: '', label: '', parentCode: '' })
      await loadItems()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const token = authStorage.getToken()
    if (!token) return
    await mastersApi.deactivate(token, id)
    await loadItems()
  }

  const meta = MASTER_CATEGORIES[activeCategory]

  return (
    <div className="space-y-6">
      <PageBanner
        title="Master Data"
        description="Configure dropdown values used across bookings, vehicles, job cards and billing"
        icon={Database}
        gradient="from-slate-700 via-gray-800 to-zinc-900"
        emoji="⚙️"
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Category sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
          <CardContent className="p-2 space-y-1">
            {(Object.keys(MASTER_CATEGORIES) as MasterCategory[]).map((key) => {
              const cat = MASTER_CATEGORIES[key]
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    activeCategory === key
                      ? 'bg-brand-yellow/15 text-brand-charcoal font-semibold'
                      : 'text-brand-muted hover:bg-brand-grey'
                  }`}
                >
                  <span className="mr-2">{cat.emoji}</span>
                  {cat.label}
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Items + form */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>{meta.emoji}</span> {meta.label}
                  </CardTitle>
                  <p className="text-sm text-brand-muted mt-1">{meta.description}</p>
                </div>
                <Badge variant="secondary">{items.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-brand-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-4 rounded-xl bg-brand-grey/50 border border-brand-border">
                <Input
                  label="Code"
                  placeholder="e.g. AC_SERVICE"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
                <Input
                  label="Display Label"
                  placeholder="e.g. AC Service"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  required
                />
                {activeCategory === 'VEHICLE_MODEL' && (
                  <Input
                    label="Parent Make Code"
                    placeholder="e.g. HONDA"
                    value={form.parentCode}
                    onChange={(e) => setForm({ ...form, parentCode: e.target.value })}
                  />
                )}
                <div className="flex items-end">
                  <Button type="submit" disabled={saving} className="w-full">
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </div>
              </form>

              {loading ? (
                <p className="text-sm text-brand-muted text-center py-8">Loading...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-brand-muted text-center py-8">No items yet. Add your first dropdown value above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-grey/50">
                        <th className="text-left px-4 py-3 font-medium text-brand-muted">Code</th>
                        <th className="text-left px-4 py-3 font-medium text-brand-muted">Label</th>
                        {activeCategory === 'VEHICLE_MODEL' && (
                          <th className="text-left px-4 py-3 font-medium text-brand-muted">Make</th>
                        )}
                        <th className="text-right px-4 py-3 font-medium text-brand-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-brand-border hover:bg-brand-grey/30">
                          <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                          <td className="px-4 py-3 font-medium">{item.label}</td>
                          {activeCategory === 'VEHICLE_MODEL' && (
                            <td className="px-4 py-3 text-brand-muted">{item.parentCode ?? '—'}</td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4 text-brand-danger" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-brand-yellow/5 border-brand-yellow/20">
            <CardContent className="p-5 text-sm text-brand-muted">
              <p className="font-semibold text-brand-charcoal mb-2">How master data flows</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Create values here under each category</li>
                <li>Dropdowns in Bookings, Vehicles, Job Cards auto-load from these masters</li>
                <li>Use <strong>VEHICLE_MODEL</strong> with a parent make code (e.g. HONDA) for dependent dropdowns</li>
                <li>Run <code className="bg-white px-1 rounded text-xs">npm run db:seed</code> to restore demo master data</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
