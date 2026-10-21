import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { razorpayApi } from '@/lib/api'

type Props = {
  token: string
  branchId?: string
}

export function RazorpayPaymentsPanel({ token, branchId }: Props) {
  const [items, setItems] = useState<unknown[]>([])
  const [summary, setSummary] = useState<unknown[]>([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await razorpayApi.dashboard(token, status ? { status } : undefined, branchId)
      setItems(data.items ?? [])
      setSummary((data as { summary?: unknown[] }).summary ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payments')
    }
  }, [token, branchId, status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Razorpay payment monitor</CardTitle>
        <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          {['', 'PENDING', 'PARTIALLY_RECONCILED', 'RECONCILED', 'CANCELLED'].map((s) => (
            <Button key={s || 'all'} size="sm" variant={status === s ? 'default' : 'outline'} onClick={() => setStatus(s)}>
              {s || 'All'}
            </Button>
          ))}
        </div>
        {summary.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {summary.map((row) => {
              const r = row as { _id?: string; count?: number; collected?: number }
              return `${r._id ?? '?'}: ${r.count ?? 0} (₹${r.collected ?? 0})`
            }).join(' · ')}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="p-2 text-left">Invoice</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Requested</th>
                <th className="p-2">Paid</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No payment links</td></tr>
              ) : (
                items.map((row) => {
                  const r = row as Record<string, unknown>
                  const inv = r.invoiceId as { invoiceNumber?: string; balanceDue?: number } | undefined
                  const cust = r.customerId as { name?: string } | undefined
                  const id = String(r._id)
                  return (
                    <tr key={id} className="border-b">
                      <td className="p-2">{inv?.invoiceNumber ?? '—'}</td>
                      <td className="p-2">{cust?.name ?? '—'}</td>
                      <td className="p-2 text-center">₹{Number(r.requestedAmount ?? 0)}</td>
                      <td className="p-2 text-center">₹{Number(r.amountPaid ?? 0)}</td>
                      <td className="p-2 text-center">{String(r.reconciliationStatus)}</td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={r.reconciliationStatus === 'RECONCILED'}
                          onClick={() => razorpayApi.refreshStatus(token, id, branchId).then(load)}
                        >
                          Sync
                        </Button>
                        {r.reconciliationStatus === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const reason = window.prompt('Cancel reason?')
                              if (!reason) return
                              razorpayApi.cancelLink(token, id, reason, branchId).then(load)
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
