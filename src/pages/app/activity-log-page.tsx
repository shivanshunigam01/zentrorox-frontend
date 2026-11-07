import { useCallback, useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { PageBanner } from '@/components/ui/page-banner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { authStorage } from '@/lib/auth-storage'
import { auditLogsApi, usersApi } from '@/lib/api'

type AuditRow = {
  id: string
  module: string
  action: string
  recordId: string | null
  createdAt: string
  user: { id: string; name: string; email: string; userCode?: string } | null
  newValue?: unknown
  oldValue?: unknown
  ipAddress?: string | null
}

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 16)
}

function defaultTo() {
  return new Date().toISOString().slice(0, 16)
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function summarizeValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'object') {
    try {
      const text = JSON.stringify(value)
      return text.length > 120 ? `${text.slice(0, 120)}…` : text
    } catch {
      return '…'
    }
  }
  return String(value)
}

export function ActivityLogPage() {
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [userId, setUserId] = useState('')
  const [recordId, setRecordId] = useState('')

  const [modules, setModules] = useState<string[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [users, setUsers] = useState<Array<{ id: string; label: string }>>([])

  const [items, setItems] = useState<AuditRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterTick, setFilterTick] = useState(0)

  useEffect(() => {
    if (!token) return
    auditLogsApi.filters(token, branchId).then((f) => {
      setModules(f.modules)
      setActions(f.actions)
    }).catch(() => {})
    usersApi.list(token, branchId).then((list) => {
      setUsers(
        list.map((u) => ({
          id: String(u.id),
          label: [u.firstName, u.lastName].filter(Boolean).join(' ') || String(u.email ?? u.id),
        })),
      )
    }).catch(() => {})
  }, [token, branchId])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await auditLogsApi.list(token, {
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
        module: module || undefined,
        action: action || undefined,
        userId: userId || undefined,
        recordId: recordId || undefined,
        page,
        limit: 50,
      }, branchId)
      setItems(data.items as AuditRow[])
      setTotalPages(data.totalPages)
    } finally {
      setLoading(false)
    }
  }, [token, branchId, from, to, module, action, userId, recordId, page, filterTick])

  useEffect(() => {
    void load()
  }, [load])

  const applyFilters = () => {
    setPage(1)
    setFilterTick((t) => t + 1)
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Activity Log"
        description="Who logged in, who changed records, and when — filter by date range, user, and module"
        icon={ScrollText}
        gradient="from-slate-700 to-brand-charcoal"
        emoji="📋"
      />

      <Card>
        <CardContent className="pt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="From" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          <div>
            <label className="text-xs font-medium">User</label>
            <select
              className="w-full border rounded-md h-10 px-2 text-sm"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Module</label>
            <select
              className="w-full border rounded-md h-10 px-2 text-sm"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              <option value="">All modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Action</label>
            <select
              className="w-full border rounded-md h-10 px-2 text-sm"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <Input label="Record ID (optional)" value={recordId} onChange={(e) => setRecordId(e.target.value)} />
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
            <Button type="button" onClick={applyFilters}>Apply filters</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFrom(defaultFrom())
                setTo(defaultTo())
                setModule('')
                setAction('')
                setUserId('')
                setRecordId('')
                setPage(1)
                setFilterTick((t) => t + 1)
              }}
            >
              Reset (last 7 days)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <p className="text-center text-sm text-brand-muted py-12">Loading activity…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-brand-muted py-12">No activity in this range.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-brand-grey/50 text-left">
                  <th className="p-3 font-medium">When</th>
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Module</th>
                  <th className="p-3 font-medium">Action</th>
                  <th className="p-3 font-medium">Record</th>
                  <th className="p-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b align-top hover:bg-brand-grey/30">
                    <td className="p-3 whitespace-nowrap text-brand-muted">{formatWhen(row.createdAt)}</td>
                    <td className="p-3">
                      {row.user ? (
                        <div>
                          <p className="font-medium">{row.user.name}</p>
                          <p className="text-xs text-brand-muted">{row.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-brand-muted">System</span>
                      )}
                    </td>
                    <td className="p-3"><Badge variant="secondary">{row.module}</Badge></td>
                    <td className="p-3">{row.action.replace(/_/g, ' ')}</td>
                    <td className="p-3 font-mono text-xs">{row.recordId ?? '—'}</td>
                    <td className="p-3 text-xs text-brand-muted max-w-xs break-all">
                      {summarizeValue(row.newValue ?? row.oldValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-brand-muted">Page {page} of {totalPages}</span>
          <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
