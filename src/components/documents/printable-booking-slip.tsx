import { DocumentHeader } from './document-header'
import { DocumentFooter } from './document-footer'
import { DocumentLayout } from './document-layout'
import { PrintActions } from './print-actions'
import { useOrganization } from '@/hooks/use-organization'
import { formatDate, formatDateTime } from '@/lib/utils'
import { formatAddress, formatCodeLabel } from '@/lib/document-utils'
import type { BookingDetail } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'

interface PrintableBookingSlipProps {
  booking: BookingDetail
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 py-1 border-b border-brand-border/60 last:border-0">
      <span className="text-brand-muted w-36 shrink-0 text-[11px]">{label}</span>
      <span className="text-[11px] font-medium text-brand-charcoal flex-1">{value}</span>
    </div>
  )
}

export function PrintableBookingSlip({ booking }: PrintableBookingSlipProps) {
  const { profile } = useOrganization()
  const user = authStorage.getUser()
  const advisorName = user ? `${user.firstName} ${user.lastName ?? ''}`.trim() : '—'

  return (
    <>
      <PrintActions label="Print Booking Slip" />
      <DocumentLayout>
        <DocumentHeader
          title="Service Booking Slip"
          subtitle="Appointment Confirmation"
          documentNo={booking.bookingNumber}
          date={formatDateTime(booking.bookingDate)}
          profile={profile}
          copyType="Customer Copy"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-brand-border rounded-lg p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">Customer Details</p>
            <InfoRow label="Name" value={booking.customer?.name} />
            <InfoRow label="Mobile" value={booking.customer?.mobile} />
            <InfoRow label="Email" value={booking.customer?.email} />
            <InfoRow
              label="Address"
              value={formatAddress([
                booking.customer?.address,
                booking.customer?.city,
                booking.customer?.state,
                booking.customer?.pin,
              ])}
            />
          </div>
          <div className="border border-brand-border rounded-lg p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">Vehicle Details</p>
            <InfoRow label="Registration" value={booking.vehicle?.registrationNo} />
            <InfoRow label="Make / Model" value={`${booking.vehicle?.make ?? ''} ${booking.vehicle?.model ?? ''}`.trim()} />
            <InfoRow label="Variant" value={booking.vehicle?.variant} />
            <InfoRow label="VIN / Chassis" value={booking.vehicle?.vin} />
            <InfoRow label="Engine No." value={booking.vehicle?.engineNo} />
            <InfoRow label="Fuel Type" value={booking.vehicle?.fuelType} />
            <InfoRow label="Odometer" value={booking.vehicle?.odometer ? `${booking.vehicle.odometer.toLocaleString()} km` : undefined} />
          </div>
        </div>

        <div className="border border-brand-border rounded-lg p-3 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">Service Request</p>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <InfoRow label="Service Type" value={formatCodeLabel(booking.serviceType)} />
            <InfoRow label="Booking Source" value={formatCodeLabel(booking.source)} />
            <InfoRow label="Preferred Date" value={booking.preferredDate ? formatDate(booking.preferredDate) : formatDate(booking.bookingDate)} />
            <InfoRow label="Preferred Slot" value={booking.preferredSlot ?? 'To be confirmed'} />
            <InfoRow label="Status" value={formatCodeLabel(booking.status)} />
            <InfoRow label="Service Advisor" value={advisorName} />
            <InfoRow label="Pickup Required" value={booking.pickupRequired ? 'Yes' : 'No'} />
            {booking.pickupRequired && <InfoRow label="Pickup Address" value={booking.pickupAddress} />}
          </div>
          {booking.customerComplaint && (
            <div className="mt-2 pt-2 border-t border-brand-border">
              <p className="text-[10px] font-bold uppercase text-brand-muted mb-1">Customer Complaint / Request</p>
              <p className="text-[11px] leading-relaxed">{booking.customerComplaint}</p>
            </div>
          )}
          {booking.remarks && (
            <div className="mt-2">
              <InfoRow label="Remarks" value={booking.remarks} />
            </div>
          )}
        </div>

        <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-3 mb-4 print:p-2 print:mb-2 text-[11px] print:text-[9px]">
          <p className="font-semibold text-brand-charcoal mb-1 print:mb-0.5">Important Instructions</p>
          <ul className="list-disc list-inside text-brand-muted space-y-0.5 print:space-y-0 print:leading-tight">
            <li>Please arrive 10 minutes before your scheduled slot.</li>
            <li>Carry vehicle RC, insurance and previous service records if available.</li>
            <li>Remove valuables from the vehicle before handover.</li>
            <li>Present this slip at the service reception on arrival.</li>
          </ul>
        </div>

        {booking.serviceVisit && (
          <p className="text-xs print:text-[9px] text-brand-muted mb-4 print:mb-2">
            Linked Service Visit: <span className="font-mono font-medium">{booking.serviceVisit.visitNumber}</span>
          </p>
        )}

        <DocumentFooter
          copyType="Customer Copy"
          showSignature
          terms={[
            'Booking confirmation is subject to bay and parts availability.',
            'Cancellation/reschedule should be informed at least 2 hours prior.',
            'Estimated delivery time will be confirmed after vehicle inspection.',
          ]}
        />
      </DocumentLayout>
    </>
  )
}
