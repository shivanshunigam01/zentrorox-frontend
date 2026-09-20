import { Car, Fuel, Gauge, User, Calendar, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getVehicleImage } from '@/lib/assets'
import { cn } from '@/lib/utils'

interface VehicleCardProps {
  registration: string
  make: string
  model: string
  variant?: string
  year?: number
  fuel?: string
  odometer?: number
  customer?: string
  lastService?: string
  status?: string
  onClick?: () => void
  className?: string
}

export function VehicleCard({
  registration,
  make,
  model,
  variant,
  year,
  fuel,
  odometer,
  customer,
  lastService,
  status,
  onClick,
  className,
}: VehicleCardProps) {
  const image = getVehicleImage(make)

  return (
    <Card
      className={cn(
        'group overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-all hover:-translate-y-1 cursor-pointer border-brand-border/80',
        className,
      )}
      onClick={onClick}
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={image}
          alt={`${make} ${model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/80 via-brand-charcoal/20 to-transparent" />
        <div className="absolute top-3 right-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-yellow/90 shadow-lg">
            <Car className="h-4 w-4 text-brand-charcoal" />
          </div>
        </div>
        {status && (
          <Badge variant="default" className="absolute top-3 left-3 shadow-md">
            {status}
          </Badge>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-lg font-bold text-white tracking-wide">{registration}</p>
          <p className="text-sm text-white/75">{make} {model} {variant}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          {year && (
            <div className="flex items-center gap-2 text-brand-muted">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-brand-yellow" />
              <span><strong className="text-brand-charcoal">{year}</strong></span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-2 text-brand-muted">
              <Fuel className="h-3.5 w-3.5 shrink-0 text-brand-yellow" />
              <span><strong className="text-brand-charcoal">{fuel}</strong></span>
            </div>
          )}
          {odometer !== undefined && (
            <div className="flex items-center gap-2 text-brand-muted">
              <Gauge className="h-3.5 w-3.5 shrink-0 text-brand-yellow" />
              <span><strong className="text-brand-charcoal">{odometer.toLocaleString()} km</strong></span>
            </div>
          )}
          {customer && (
            <div className="flex items-center gap-2 text-brand-muted">
              <User className="h-3.5 w-3.5 shrink-0 text-brand-yellow" />
              <span className="truncate"><strong className="text-brand-charcoal">{customer}</strong></span>
            </div>
          )}
        </div>
        {lastService && (
          <div className="mt-3 pt-3 border-t border-brand-border flex items-center gap-2 text-xs text-brand-muted">
            <Wrench className="h-3.5 w-3.5 text-brand-success" />
            Last service: <span className="font-medium text-brand-charcoal">{lastService}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
