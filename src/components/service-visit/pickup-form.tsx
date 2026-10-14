import { useEffect, useState } from 'react'
import { CheckCircle2, MapPin, Truck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PickupPhotoSlot } from './pickup-photo-slot'
import { serviceVisitsApi, usersApi, type ServiceVisitDetail, type UserItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'

const REQUIRED_SLOTS = [
  { type: 'FRONT' as const, label: 'Front View' },
  { type: 'REAR' as const, label: 'Rear View' },
  { type: 'LEFT' as const, label: 'Left Side' },
  { type: 'RIGHT' as const, label: 'Right Side' },
  { type: 'INTERIOR' as const, label: 'Interior' },
]

const OPTIONAL_SLOTS = [
  { type: 'STEPNEY' as const, label: 'Stepney / Spare Tyre' },
]

interface PickupFormProps {
  visit: ServiceVisitDetail
  onUpdated: (visit: ServiceVisitDetail) => void
}

export function PickupForm({ visit, onUpdated }: PickupFormProps) {
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined
  const [executives, setExecutives] = useState<UserItem[]>([])
  const [executiveId, setExecutiveId] = useState(visit.pickupExecutiveId ?? '')
  const [assigning, setAssigning] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    usersApi.list(token, branchId).then(setExecutives).catch(() => {})
  }, [token, branchId])

  useEffect(() => {
    setExecutiveId(visit.pickupExecutiveId ?? '')
  }, [visit.pickupExecutiveId])

  const getImage = (type: string) =>
    visit.pickupImages?.find((img) => img.type === type)

  const otherGoods = visit.pickupImages?.filter((img) => img.type === 'OTHER_GOODS') ?? []

  const handleAssign = async () => {
    if (!token || !executiveId) return
    setAssigning(true)
    setError(null)
    try {
      const updated = await serviceVisitsApi.assignPickupExecutive(token, visit.id, executiveId, branchId)
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign executive')
    } finally {
      setAssigning(false)
    }
  }

  const handleComplete = async () => {
    if (!token) return
    setCompleting(true)
    setError(null)
    try {
      const updated = await serviceVisitsApi.completePickup(token, visit.id, branchId)
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete pickup')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-brand-yellow" />
            Vehicle Pickup
          </h3>
          <p className="text-sm text-brand-muted mt-1">
            Assign an executive, capture all required vehicle photos with location and timestamp, then complete pickup.
          </p>
        </div>
        <Badge variant="info">Pickup Request</Badge>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-grey/40 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase text-brand-muted">Pickup Location</p>
        <p className="font-medium">{visit.registrationNumber} — {visit.make} {visit.model}</p>
        <p className="text-sm text-brand-muted">{visit.customerName} · {visit.customerMobile}</p>
        {visit.pickupAddress && (
          <p className="text-sm flex items-start gap-1.5 mt-2">
            <MapPin className="h-4 w-4 shrink-0 text-brand-yellow mt-0.5" />
            {visit.pickupAddress}
          </p>
        )}
        {(visit.pickupLocationLat != null && visit.pickupLocationLng != null) && (
          <p className="text-xs text-brand-muted">
            Coordinates: {visit.pickupLocationLat.toFixed(5)}, {visit.pickupLocationLng.toFixed(5)}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-brand-border p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" /> Assign Pickup Executive
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={executiveId}
            onChange={(e) => setExecutiveId(e.target.value)}
            className="flex h-10 flex-1 rounded-lg border border-brand-border px-3 text-sm"
          >
            <option value="">Select executive</option>
            {executives.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.role ? `(${u.role})` : ''}
              </option>
            ))}
          </select>
          <Button type="button" onClick={handleAssign} disabled={assigning || !executiveId}>
            {assigning ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
        {visit.pickupExecutiveName && (
          <p className="text-xs text-green-700">Assigned to: {visit.pickupExecutiveName}</p>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold mb-3">Required Photos (4 sides + interior)</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REQUIRED_SLOTS.map((slot) => (
            <PickupPhotoSlot
              key={slot.type}
              type={slot.type}
              label={slot.label}
              required
              visitId={visit.id}
              image={getImage(slot.type)}
              onUploaded={onUpdated}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-3">Optional Photos</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {OPTIONAL_SLOTS.map((slot) => (
            <PickupPhotoSlot
              key={slot.type}
              type={slot.type}
              label={slot.label}
              visitId={visit.id}
              image={getImage(slot.type)}
              onUploaded={onUpdated}
            />
          ))}
          <PickupPhotoSlot
            type="OTHER_GOODS"
            label="Goods / Items Inside Vehicle"
            visitId={visit.id}
            onUploaded={onUpdated}
          />
        </div>
        {otherGoods.length > 0 && (
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherGoods.map((img, i) => (
              <div key={`${img.url}-${i}`} className="rounded-xl border p-2 text-xs text-brand-muted">
                <img src={img.url} alt="" className="h-24 w-full object-cover rounded mb-1" />
                {new Date(img.capturedAt).toLocaleString('en-IN')}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-brand-danger">{error}</div>
      )}

      <Button
        className="w-full sm:w-auto"
        onClick={handleComplete}
        disabled={completing || !visit.pickupExecutiveId}
      >
        <CheckCircle2 className="h-4 w-4" />
        {completing ? 'Completing Pickup...' : 'Complete Pickup & Move to Gate-In'}
      </Button>
    </div>
  )
}
