import { DocumentHeader } from './document-header'
import { DocumentFooter } from './document-footer'
import { DocumentLayout } from './document-layout'
import { PrintActions } from './print-actions'
import { useOrganization } from '@/hooks/use-organization'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  amountInWords,
  buildInvoiceLines,
  generateInvoiceNumber,
} from '@/lib/document-utils'
import type { ServiceVisitDetail, JobCardItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'

interface PrintableInvoiceProps {
  visit: ServiceVisitDetail
  jobCard?: JobCardItem | null
}

export function PrintableInvoice({ visit, jobCard }: PrintableInvoiceProps) {
  const { profile } = useOrganization()
  const user = authStorage.getUser()
  const baseAmount = jobCard?.currentValue ?? jobCard?.approvedValue ?? visit.outstanding ?? 0
  const gst = buildInvoiceLines(baseAmount, jobCard?.jobType)
  const invoiceNo = generateInvoiceNumber(visit.visitNumber)

  return (
    <>
      <PrintActions />
      <DocumentLayout>
        <DocumentHeader
          title="Tax Invoice"
          subtitle="Original for Recipient"
          documentNo={invoiceNo}
          date={formatDateTime(new Date())}
          profile={profile}
          copyType="Customer Copy"
        />

        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div className="border border-brand-border rounded-lg p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Bill To</p>
            <p className="font-semibold text-sm">{visit.customerName}</p>
            <p className="text-brand-muted">Mobile: {visit.customerMobile}</p>
            <p className="text-brand-muted mt-1">Place of Supply: {profile?.branch?.state ?? profile?.tenant.state ?? '—'}</p>
          </div>
          <div className="border border-brand-border rounded-lg p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Vehicle & Visit</p>
            <p className="font-semibold text-sm">{visit.registrationNumber}</p>
            <p className="text-brand-muted">{visit.make} {visit.model} {visit.variant ?? ''}</p>
            {visit.vin && visit.vin !== '—' && <p className="text-brand-muted">VIN: {visit.vin}</p>}
            {visit.engineNo && visit.engineNo !== '—' && <p className="text-brand-muted">Engine: {visit.engineNo}</p>}
            <p className="text-brand-muted mt-1">Visit: {visit.visitNumber}</p>
            {jobCard?.jobCardNumber && <p className="text-brand-muted">Job Card: {jobCard.jobCardNumber}</p>}
            {visit.odometer ? <p className="text-brand-muted">Odometer: {visit.odometer.toLocaleString()} km</p> : null}
          </div>
        </div>

        <table className="w-full text-[11px] border-collapse mb-3">
          <thead>
            <tr className="bg-brand-charcoal text-white">
              <th className="text-left px-2 py-1.5 border border-brand-charcoal w-8">#</th>
              <th className="text-left px-2 py-1.5 border border-brand-charcoal">Description</th>
              <th className="text-center px-2 py-1.5 border border-brand-charcoal w-16">HSN/SAC</th>
              <th className="text-center px-2 py-1.5 border border-brand-charcoal w-10">Qty</th>
              <th className="text-right px-2 py-1.5 border border-brand-charcoal w-20">Rate (₹)</th>
              <th className="text-right px-2 py-1.5 border border-brand-charcoal w-20">Taxable (₹)</th>
              <th className="text-center px-2 py-1.5 border border-brand-charcoal w-12">GST%</th>
              <th className="text-right px-2 py-1.5 border border-brand-charcoal w-20">CGST (₹)</th>
              <th className="text-right px-2 py-1.5 border border-brand-charcoal w-20">SGST (₹)</th>
              <th className="text-right px-2 py-1.5 border border-brand-charcoal w-24">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {gst.lines.map((line) => (
              <tr key={line.sr}>
                <td className="px-2 py-1.5 border border-brand-border text-center">{line.sr}</td>
                <td className="px-2 py-1.5 border border-brand-border">{line.description}</td>
                <td className="px-2 py-1.5 border border-brand-border text-center font-mono">{line.hsnSac}</td>
                <td className="px-2 py-1.5 border border-brand-border text-center">{line.qty} {line.uom}</td>
                <td className="px-2 py-1.5 border border-brand-border text-right">{line.rate.toLocaleString('en-IN')}</td>
                <td className="px-2 py-1.5 border border-brand-border text-right">{line.taxable.toLocaleString('en-IN')}</td>
                <td className="px-2 py-1.5 border border-brand-border text-center">{line.gstPercent}%</td>
                <td className="px-2 py-1.5 border border-brand-border text-right">{line.cgst.toLocaleString('en-IN')}</td>
                <td className="px-2 py-1.5 border border-brand-border text-right">{line.sgst.toLocaleString('en-IN')}</td>
                <td className="px-2 py-1.5 border border-brand-border text-right font-medium">{line.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-brand-grey/50 font-semibold">
              <td colSpan={5} className="px-2 py-1.5 border border-brand-border text-right text-[10px] uppercase tracking-wide">
                Total
              </td>
              <td className="px-2 py-1.5 border border-brand-border text-right">{gst.subtotal.toLocaleString('en-IN')}</td>
              <td className="px-2 py-1.5 border border-brand-border text-center">—</td>
              <td className="px-2 py-1.5 border border-brand-border text-right">{gst.cgstTotal.toLocaleString('en-IN')}</td>
              <td className="px-2 py-1.5 border border-brand-border text-right">{gst.sgstTotal.toLocaleString('en-IN')}</td>
              <td className="px-2 py-1.5 border border-brand-border text-right">{gst.grandTotal.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-xs border border-brand-border rounded-lg p-3 bg-brand-grey/30">
            <p className="text-[10px] font-bold uppercase text-brand-muted mb-1">Amount in Words</p>
            <p className="font-medium italic">{amountInWords(gst.grandTotal)}</p>
          </div>
          <div className="text-xs border border-brand-border rounded-lg overflow-hidden">
            <div className="flex justify-between px-3 py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">Taxable Value</span>
              <span>{formatCurrency(gst.subtotal)}</span>
            </div>
            <div className="flex justify-between px-3 py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">CGST @ 9%</span>
              <span>{formatCurrency(gst.cgstTotal)}</span>
            </div>
            <div className="flex justify-between px-3 py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">SGST @ 9%</span>
              <span>{formatCurrency(gst.sgstTotal)}</span>
            </div>
            {gst.roundOff !== 0 && (
              <div className="flex justify-between px-3 py-1.5 border-b border-brand-border">
                <span className="text-brand-muted">Round Off</span>
                <span>{gst.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between px-3 py-2 bg-brand-charcoal text-white font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(gst.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-brand-muted mb-2 grid grid-cols-2 gap-2">
          <p>Advisor: {user?.firstName ?? '—'} {user?.lastName ?? ''}</p>
          <p className="text-right">Payment Status: {visit.outstanding > 0 ? 'Pending' : 'Paid'}</p>
        </div>

        <DocumentFooter
          copyType="Customer Copy"
          terms={[
            'Workmanship warranty as per company policy. Parts warranty as per manufacturer terms.',
            'Estimate variation beyond approved scope requires customer re-approval.',
            'Subject to applicable GST provisions under Indian law.',
          ]}
        />
      </DocumentLayout>
    </>
  )
}
