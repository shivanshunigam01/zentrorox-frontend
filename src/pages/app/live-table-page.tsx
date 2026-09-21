import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageBanner } from '@/components/ui/page-banner'
import { EmptyState } from '@/components/ui/empty-state'
import { authStorage } from '@/lib/auth-storage'

export interface TableColumn {
  key: string
  label: string
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

interface LiveTablePageProps {
  title: string
  description?: string
  icon: LucideIcon
  gradient: string
  emoji: string
  columns: TableColumn[]
  loadRows: (token: string, branchId: string | undefined, search: string) => Promise<Record<string, unknown>[]>
  getViewLink?: (row: Record<string, unknown>) => string | null
  stats?: Array<{ label: string; value: string | number }>
}

export function LiveTablePage({
  title,
  description,
  icon,
  gradient,
  emoji,
  columns,
  loadRows,
  getViewLink,
  stats,
}: LiveTablePageProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (q = search) => {
    const token = authStorage.getToken()
    if (!token) return
    setLoading(true)
    try {
      const data = await loadRows(token, authStorage.getBranchId() ?? undefined, q)
      setRows(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData('') }, [])

  return (
    <div className="space-y-6">
      <PageBanner
        title={title}
        description={description}
        icon={icon}
        gradient={gradient}
        emoji={emoji}
        stats={stats}
      />

      <Card>
        <CardContent className="p-4">
          <form
            className="relative max-w-md"
            onSubmit={(e) => { e.preventDefault(); fetchData(search) }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-brand-border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow bg-brand-grey/50"
            />
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-brand-danger">{error}</div>
      )}

      {loading ? (
        <Card><p className="text-center py-12 text-sm text-brand-muted">Loading {title.toLowerCase()}...</p></Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={icon}
            title="No records found"
            description={`No ${title.toLowerCase()} match your filters. Data loads live from the backend.`}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 lg:hidden">
            {rows.map((row, i) => (
              <Card key={String(row.id ?? i)} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-4 space-y-3">
                  {columns.slice(0, 5).map((col) => (
                    <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-brand-muted shrink-0">{col.label}</span>
                      <span className="text-right font-medium text-brand-charcoal break-words">
                        {col.render
                          ? col.render(row[col.key], row)
                          : col.key === 'status'
                            ? <Badge>{String(row[col.key] ?? '—')}</Badge>
                            : String(row[col.key] ?? '—')}
                      </span>
                    </div>
                  ))}
                  {getViewLink?.(row) && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={getViewLink(row)!}>Open</Link>
                    </Button>
                  )}
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
                      {columns.map((col) => (
                        <th key={col.key} className="text-left px-5 py-3 font-medium text-brand-muted">{col.label}</th>
                      ))}
                      {getViewLink && <th className="text-right px-5 py-3 font-medium text-brand-muted">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={String(row.id ?? i)} className="border-b border-brand-border hover:bg-brand-yellow/5">
                        {columns.map((col) => (
                          <td key={col.key} className="px-5 py-3">
                            {col.render
                              ? col.render(row[col.key], row)
                              : col.key === 'status'
                                ? <Badge>{String(row[col.key] ?? '—')}</Badge>
                                : String(row[col.key] ?? '—')}
                          </td>
                        ))}
                        {getViewLink && (
                          <td className="px-5 py-3 text-right">
                            {getViewLink(row) && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={getViewLink(row)!}>Open</Link>
                              </Button>
                            )}
                          </td>
                        )}
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
