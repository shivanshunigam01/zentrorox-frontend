import { useLocation } from 'react-router-dom'
import { Plus, Search, Filter, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageBanner } from '@/components/ui/page-banner'
import { getModuleMeta } from '@/lib/module-meta'
import { GIFS } from '@/lib/assets'

interface ModulePageProps {
  title: string
  description?: string
  showCreate?: boolean
  showTable?: boolean
  columns?: string[]
  rows?: Record<string, string>[]
}

export function ModulePage({
  title,
  description,
  showCreate = true,
  showTable = true,
  columns = ['ID', 'Date', 'Status', 'Created By'],
  rows = [],
}: ModulePageProps) {
  const location = useLocation()
  const meta = getModuleMeta(location.pathname)

  const defaultRows = rows.length > 0 ? rows : [
    { ID: '—', Date: '—', Status: 'No records yet', 'Created By': '—' },
  ]

  const isEmpty = defaultRows.length === 1 && defaultRows[0].Status === 'No records yet'

  return (
    <div className="space-y-6">
      <PageBanner
        title={title}
        description={description}
        icon={meta.icon}
        gradient={meta.gradient}
        emoji={meta.emoji}
        illustration={meta.illustration}
        actions={
          showCreate ? (
            <Button className="bg-white text-brand-charcoal hover:bg-white/90 shadow-lg">
              <Plus className="h-4 w-4" /> Create New
            </Button>
          ) : undefined
        }
      />

      <Card className="border-brand-border/60">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                placeholder={`Search ${title.toLowerCase()}...`}
                className="h-10 w-full rounded-xl border border-brand-border bg-brand-grey/50 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {showTable && (
        <Card className="overflow-hidden">
          {isEmpty ? (
            <div className="relative">
              <EmptyState
                icon={meta.icon}
                image={meta.illustration ?? '/images/empty-workshop.svg'}
                title="No records yet"
                description={`This module is ready — connect the backend API to populate ${title.toLowerCase()} data.`}
                actionLabel={showCreate ? 'Create New' : undefined}
                onAction={showCreate ? () => {} : undefined}
              />
              <div className="absolute bottom-4 right-4 h-16 w-16 rounded-xl overflow-hidden border border-brand-border shadow-lg opacity-60 hidden sm:block">
                <img src={GIFS.wrenchSpin} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          ) : (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-grey/50">
                      {columns.map((col) => (
                        <th key={col} className="text-left px-5 py-3 font-medium text-brand-muted">{col}</th>
                      ))}
                      <th className="text-right px-5 py-3 font-medium text-brand-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultRows.map((row, i) => (
                      <tr key={i} className="border-b border-brand-border hover:bg-brand-yellow/5 transition-colors">
                        {columns.map((col) => (
                          <td key={col} className="px-5 py-3">
                            {col === 'Status' ? (
                              <Badge variant="secondary">{row[col]}</Badge>
                            ) : (
                              <span className="text-brand-charcoal">{row[col]}</span>
                            )}
                          </td>
                        ))}
                        <td className="px-5 py-3 text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
