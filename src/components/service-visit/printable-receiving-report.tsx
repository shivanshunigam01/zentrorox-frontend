import { forwardRef } from 'react'

export type ReceivingReportData = {
  visitNumber?: string
  bookingNumber?: string
  customerName?: string
  registrationNo?: string
  observedArrivalAt?: string
  odometer?: number
  fuelLevel?: string
  engineMatchStatus?: string
  chassisMatchStatus?: string
  inventoryDiscrepancies?: string[]
  vehicleConditionRemarks?: string
  vocSummary?: string[]
  receivingStaff?: string
  customerAcknowledged?: boolean
  receivingStatus?: string
}

export const PrintableReceivingReport = forwardRef<HTMLDivElement, { data: ReceivingReportData }>(
  function PrintableReceivingReport({ data }, ref) {
    return (
      <div ref={ref} className="hidden print:block p-8 text-sm text-black bg-white">
        <h1 className="text-xl font-bold mb-4">Vehicle Receiving Report</h1>
        <table className="w-full mb-4">
          <tbody>
            <tr><td className="font-semibold pr-4">Visit</td><td>{data.visitNumber ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Booking</td><td>{data.bookingNumber ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Customer</td><td>{data.customerName ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Vehicle</td><td>{data.registrationNo ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Gate-In time</td><td>{data.observedArrivalAt ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Odometer</td><td>{data.odometer ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Fuel</td><td>{data.fuelLevel ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Engine verification</td><td>{data.engineMatchStatus ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Chassis verification</td><td>{data.chassisMatchStatus ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Receiving staff</td><td>{data.receivingStaff ?? '—'}</td></tr>
            <tr><td className="font-semibold pr-4">Customer acknowledged</td><td>{data.customerAcknowledged ? 'Yes' : 'No'}</td></tr>
            <tr><td className="font-semibold pr-4">Status</td><td>{data.receivingStatus ?? '—'}</td></tr>
          </tbody>
        </table>
        {data.inventoryDiscrepancies?.length ? (
          <section className="mb-4">
            <h2 className="font-semibold mb-1">Inventory discrepancies</h2>
            <ul className="list-disc pl-5">{data.inventoryDiscrepancies.map((l) => <li key={l}>{l}</li>)}</ul>
          </section>
        ) : null}
        {data.vehicleConditionRemarks ? (
          <section className="mb-4">
            <h2 className="font-semibold mb-1">Existing damage / condition</h2>
            <p>{data.vehicleConditionRemarks}</p>
          </section>
        ) : null}
        {data.vocSummary?.length ? (
          <section>
            <h2 className="font-semibold mb-1">VOC summary</h2>
            <ul className="list-disc pl-5">{data.vocSummary.map((l) => <li key={l}>{l}</li>)}</ul>
          </section>
        ) : null}
      </div>
    )
  },
)
