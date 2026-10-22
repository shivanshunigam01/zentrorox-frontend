import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { billingApi, razorpayApi } from '@/lib/api'
import { appToast } from '@/lib/app-toast'

type Props = {
  visitId: string
  token: string
  branchId?: string
  workspace: Record<string, unknown>
  onRefresh: () => void
}

export function BillingDeliveryWorkspace({ visitId, token, branchId, workspace, onRefresh }: Props) {
  const [error, setError] = useState('')
  const invoice = workspace.invoice as {
    _id?: string
    status?: string
    invoiceNumber?: string
    grandTotal?: number
    balanceDue?: number
    advanceAllocated?: number
    paymentsReceived?: number
    creditClearanceAuthorized?: boolean
    paymentStatus?: string
    creditsApplied?: number
    issuedAt?: string
    lines?: Array<Record<string, unknown>>
  } | undefined
  const customer = workspace.customer as { name?: string; mobile?: string; email?: string } | undefined
  const vehicle = workspace.vehicle as { registrationNo?: string; make?: string; model?: string } | undefined
  const jobCard = workspace.jobCard as { jobCardNumber?: string; revisionNumber?: number } | undefined
  const qcCase = workspace.qcCase as { status?: string; qcReference?: string } | undefined
  const reconciliation = workspace.reconciliation as { lines?: Array<Record<string, unknown>>; hasBlocking?: boolean; blockingReasons?: string[] } | undefined
  const gatePass = workspace.gatePass as { _id?: string; status?: string; gatePassNumber?: string } | undefined
  const delivery = workspace.delivery as { _id?: string; status?: string } | undefined
  const paymentRequests = (workspace.paymentRequests as Array<{
    _id?: string
    razorpayShortUrl?: string
    requestedAmount?: number
    remainingAmount?: number
    providerStatus?: string
    reconciliationStatus?: string
    expiresAt?: string
  }>) ?? []
  const activeLink = paymentRequests.find((p) => p.reconciliationStatus === 'PENDING' || p.reconciliationStatus === 'PARTIALLY_RECONCILED')

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setError('')
    try {
      await fn()
      appToast.success(label)
      onRefresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Operation failed'
      setError(msg)
      appToast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader><CardTitle className="text-base">Customer & vehicle</CardTitle></CardHeader>
        <CardContent className="text-sm grid gap-1 md:grid-cols-2">
          <p>{customer?.name} · {customer?.mobile}</p>
          <p>{vehicle?.registrationNo} — {vehicle?.make} {vehicle?.model}</p>
          <p>Job card: {jobCard?.jobCardNumber} (rev {jobCard?.revisionNumber})</p>
          <p>QC: {qcCase?.qcReference} ({qcCase?.status})</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Parts & labour reconciliation</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {reconciliation?.hasBlocking && (
            <p className="p-3 text-sm text-amber-800 bg-amber-50">{reconciliation.blockingReasons?.join('; ')}</p>
          )}
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="p-2 text-left">Part</th>
                <th className="p-2">Approved</th>
                <th className="p-2">Issued</th>
                <th className="p-2">Consumed</th>
                <th className="p-2">Returned</th>
                <th className="p-2">Billable</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(reconciliation?.lines ?? []).length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No parts consumption rows (labour-only or pending issue).</td></tr>
              ) : (
                reconciliation?.lines?.map((row) => {
                  const key = `${row.partId ?? row.partNumber}-${row.jobWorkItemId ?? 'na'}`
                  return (
                    <tr key={key} className="border-b">
                      <td className="p-2">{String(row.partNumber)}</td>
                      <td className="p-2 text-center">{Number(row.approvedQuantity)}</td>
                      <td className="p-2 text-center">{Number(row.issuedQuantity)}</td>
                      <td className="p-2 text-center">{Number(row.consumedQuantity)}</td>
                      <td className="p-2 text-center">{Number(row.returnedQuantity)}</td>
                      <td className="p-2 text-center">{Number(row.billableQuantity)}</td>
                      <td className="p-2 text-center">
                        {String(row.reconciliationStatus)}
                        {row.reconciliationStatus === 'BLOCKING' && (
                          <Button size="sm" variant="link" className="h-auto p-0 ml-1" onClick={() => {
                            const reason = window.prompt('Variance reason (required for authorized exception)?')
                            if (!reason) return
                            run('Discrepancy resolved', () => billingApi.resolveReconciliation(token, visitId, {
                              lineKey: key,
                              varianceReason: reason,
                              authorizedException: window.confirm('Authorize billing exception?'),
                            }, branchId))
                          }}>Resolve</Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Final invoice</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Number: {invoice?.invoiceNumber ?? '—'} · Status: {invoice?.status ?? 'none'}</p>
          <p>Total ₹{invoice?.grandTotal ?? 0} · Advance ₹{invoice?.advanceAllocated ?? 0} · Paid ₹{invoice?.paymentsReceived ?? 0} · Balance ₹{invoice?.balanceDue ?? 0}</p>
          <p>Credit clearance: {invoice?.creditClearanceAuthorized ? 'Yes' : 'No'}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run('Draft created/updated', () => billingApi.createDraft(token, visitId, branchId))}>Generate / refresh draft</Button>
            {invoice?._id && invoice.status === 'DRAFT' && (
              <Button variant="default" onClick={() => run('Invoice issued', () => billingApi.issue(token, invoice._id!, branchId))}>Issue invoice</Button>
            )}
            {invoice?._id && invoice.status === 'ISSUED' && (
              <>
                <Button variant="outline" onClick={() => run('Opening invoice PDF', () => billingApi.openInvoicePdf(token, invoice._id!, branchId))}>Tax invoice PDF</Button>
                <Button variant="outline" onClick={() => run('Opening repair report', () => billingApi.openRepairReportPdf(token, invoice._id!, branchId))}>Repair report PDF</Button>
                <Button variant="outline" onClick={() => {
                  const recipient = window.prompt('Customer email?')
                  if (recipient) run('Email queued', () => billingApi.sendEmail(token, invoice._id!, recipient, branchId))
                }}>Email</Button>
                <Button variant="outline" onClick={() => {
                  const recipient = window.prompt('WhatsApp number?')
                  if (recipient) run('WhatsApp queued', () => billingApi.sendWhatsApp(token, invoice._id!, recipient, branchId))
                }}>WhatsApp</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Razorpay & payments</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Grand total ₹{invoice?.grandTotal ?? 0} · Advance ₹{invoice?.advanceAllocated ?? 0} · Paid ₹{invoice?.paymentsReceived ?? 0} · Credits applied (see allocations)</p>
          <p className="font-medium">Amount due: ₹{invoice?.balanceDue ?? 0} · Status: {invoice?.paymentStatus ?? invoice?.status ?? '—'}</p>
          {activeLink?.razorpayShortUrl && (
            <div className="rounded border p-2 bg-muted/30 space-y-1">
              <p>Payment link ({activeLink.providerStatus}) — expires {activeLink.expiresAt ? new Date(activeLink.expiresAt).toLocaleString() : '—'}</p>
              <p className="break-all text-xs">{activeLink.razorpayShortUrl}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(activeLink.razorpayShortUrl!)}>Copy link</Button>
                <Button size="sm" variant="outline" onClick={() => window.open(activeLink.razorpayShortUrl, '_blank')}>Open link</Button>
                {activeLink._id && (
                  <Button size="sm" variant="outline" onClick={() => run('Payment status refreshed', () => razorpayApi.refreshStatus(token, activeLink._id!, branchId))}>Refresh status</Button>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {invoice?._id && invoice.status === 'ISSUED' && (invoice.balanceDue ?? 0) > 0 && (
              <>
                <Button onClick={() => run('Razorpay link created', () => razorpayApi.createLink(token, invoice._id!, branchId))}>Generate Razorpay link</Button>
                {activeLink?._id && activeLink.reconciliationStatus === 'PENDING' && (
                  <Button variant="outline" onClick={() => {
                    const reason = window.prompt('Cancel / supersede link reason?')
                    if (!reason) return
                    run('Link cancelled', () => razorpayApi.cancelLink(token, activeLink._id!, reason, branchId))
                  }}>Cancel link</Button>
                )}
                {activeLink?._id && (
                  <>
                    <Button variant="outline" onClick={() => {
                      const recipient = window.prompt('Customer email?', customer?.email as string | undefined)
                      if (recipient) run('Payment link emailed', () => razorpayApi.sendLinkEmail(token, activeLink._id!, recipient, branchId))
                    }}>Send link by email</Button>
                    <Button variant="outline" onClick={() => {
                      const recipient = window.prompt('WhatsApp number?', customer?.mobile)
                      if (recipient) run('WhatsApp queued', () => razorpayApi.sendLinkWhatsApp(token, activeLink._id!, recipient, branchId))
                    }}>Send link on WhatsApp</Button>
                  </>
                )}
              </>
            )}
            {invoice?._id && invoice.status === 'ISSUED' && (
              <>
                <Button variant="outline" onClick={() => {
                  const amt = window.prompt('Payment amount?')
                  if (!amt) return
                  run('Payment recorded', () => billingApi.collectPayment(token, { invoiceId: invoice._id, amount: Number(amt), paymentMethod: 'CASH' }, branchId))
                }}>Record cash/UPI (manual)</Button>
                <Button variant="secondary" onClick={() => run('Credit cleared', () => billingApi.creditClearance(token, invoice._id!, branchId))}>Credit clearance</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Gate pass & delivery</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Gate pass: {gatePass?.gatePassNumber ?? '—'} ({gatePass?.status ?? 'none'})</p>
          <p>Delivery: {delivery?.status ?? 'none'}</p>
          <div className="flex flex-wrap gap-2">
            {invoice?._id && invoice.status === 'ISSUED' && (
              <Button onClick={() => run('Gate pass created', () => billingApi.createGatePass(token, invoice._id!, branchId))}>Create gate pass</Button>
            )}
            {gatePass?._id && gatePass.status === 'READY_FOR_ISSUE' && (
              <Button onClick={() => run('Gate pass issued', () => billingApi.issueGatePass(token, gatePass._id!, branchId))}>Issue gate pass</Button>
            )}
            {gatePass?._id && gatePass.status === 'ISSUED' && !delivery && (
              <Button onClick={() => run('Delivery started', () => billingApi.createDelivery(token, gatePass._id!, branchId))}>Start delivery</Button>
            )}
            {delivery?._id && delivery.status === 'PENDING' && (
              <Button onClick={() => {
                const name = window.prompt('Receiver name?')
                const mobile = window.prompt('Receiver mobile?')
                const odo = window.prompt('Final odometer?')
                run('Delivery completed', () => billingApi.completeDelivery(token, delivery._id!, {
                  receiverName: name,
                  receiverMobile: mobile,
                  finalOdometer: odo ? Number(odo) : undefined,
                  customerAcknowledged: true,
                }, branchId))
              }}>Complete delivery</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
