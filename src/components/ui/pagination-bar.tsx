import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function PaginationBar({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50],
}: {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
}) {
  if (total === 0) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border px-4 py-3 text-sm bg-brand-grey/30">
      <p className="text-brand-muted">
        Showing <span className="font-medium text-brand-charcoal">{from}</span>–
        <span className="font-medium text-brand-charcoal">{to}</span> of{' '}
        <span className="font-medium text-brand-charcoal">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {onLimitChange && (
          <select
            className="h-9 rounded-lg border border-brand-border px-2 text-sm"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            {limitOptions.map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[5rem] text-center text-brand-muted">
          Page {page} / {totalPages || 1}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function clientPagination<T>(items: T[], page: number, limit: number): { slice: T[]; meta: PaginationMeta } {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * limit
  return {
    slice: items.slice(start, start + limit),
    meta: { page: safePage, limit, total, totalPages },
  }
}
