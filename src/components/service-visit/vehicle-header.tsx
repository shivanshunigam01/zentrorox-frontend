import { Phone, Clock, FileText, User, Car, Fuel, Gauge, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getVehicleImage } from '@/lib/assets'
import type { ServiceVisit } from '@/types'

interface VehicleHeaderProps {
  visit: ServiceVisit
}

const fieldIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Customer: User,
  Mobile: Phone,
  'Job Card': FileText,
}

export function VehicleHeader({ visit }: VehicleHeaderProps) {
  const vehicleImage = getVehicleImage(visit.make)

  const fields = [
    { label: 'Registration', value: visit.registrationNumber, highlight: true },
    { label: 'Customer', value: visit.customerName },
    { label: 'Mobile', value: visit.customerMobile },
    { label: 'Make / Model', value: `${visit.make} ${visit.model}` },
    { label: 'Variant', value: visit.variant },
    { label: 'VIN / Chassis', value: visit.vin },
    { label: 'Engine No.', value: visit.engineNumber },
    { label: 'Odometer', value: visit.odometer ? `${visit.odometer.toLocaleString()} km` : '—', icon: Gauge },
    { label: 'Fuel', value: visit.fuel, icon: Fuel },
    { label: 'Visit ID', value: visit.visitNumber, icon: Hash },
    { label: 'Job Card', value: visit.jobCardNumber || '—' },
    { label: 'Advisor', value: visit.advisor },
  ]

  return (
    <div className="rounded-2xl border border-brand-border bg-white shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Vehicle image strip */}
        <div className="relative lg:w-48 h-32 lg:h-auto shrink-0 overflow-hidden">
          <img src={vehicleImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 lg:bg-gradient-to-t lg:from-brand-charcoal/60 lg:to-transparent" />
          <div className="absolute bottom-3 left-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-yellow shadow-lg">
              <Car className="h-5 w-5 text-brand-charcoal" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-5 py-3 bg-brand-grey/30">
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl bg-brand-yellow/20">
                <Car className="h-5 w-5 text-brand-charcoal" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-charcoal">{visit.registrationNumber}</h2>
                <p className="text-xs text-brand-muted">{visit.make} {visit.model} · {visit.variant}</p>
              </div>
              <Badge variant="default">{visit.status}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {visit.promiseTime && (
                <span className="flex items-center gap-1.5 text-brand-muted bg-white rounded-lg px-3 py-1.5 border border-brand-border">
                  <Clock className="h-4 w-4 text-brand-yellow" />
                  Promise: {formatDateTime(visit.promiseTime)}
                </span>
              )}
              <span className="font-semibold text-brand-charcoal bg-brand-yellow/15 rounded-lg px-3 py-1.5">
                Outstanding: {formatCurrency(visit.outstanding)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3 px-5 py-4">
            {fields.filter((f) => !f.highlight).map((field) => {
              const Icon = fieldIcons[field.label] || field.icon
              return (
                <div key={field.label}>
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide flex items-center gap-1">
                    {Icon && <Icon className="h-3 w-3" />}
                    {field.label}
                  </p>
                  <p className="text-sm font-medium text-brand-charcoal mt-0.5 truncate">{field.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
