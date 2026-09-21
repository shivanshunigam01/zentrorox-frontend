import { useEffect, useState } from 'react'
import { Save, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { VehiclePhotoCapture } from '@/components/ui/vehicle-photo-capture'
import { serviceVisitsApi, type ServiceVisitDetail } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'

const FUEL_LEVELS = ['Empty', '1/4', '1/2', '3/4', 'Full']

interface ArrivalGateFormProps {
  visit: ServiceVisitDetail
  onSaved: (visit: ServiceVisitDetail) => void
  onAdvance?: () => void
  advancing?: boolean
  canAdvance?: boolean
}

export function ArrivalGateForm({
  visit,
  onSaved,
  onAdvance,
  advancing,
  canAdvance,
}: ArrivalGateFormProps) {
  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    engineNo: visit.engineNo ?? '',
    chassisNo: visit.chassisNo ?? visit.vin ?? '',
    odometer: visit.odometer != null ? String(visit.odometer) : '',
    fuelLevel: visit.fuel ?? '',
    vehicleImageUrl: visit.vehicleImageUrl ?? '',
    vehicleImagePublicId: visit.vehicleImagePublicId ?? '',
    remarks: '',
  })

  useEffect(() => {
    setForm({
      engineNo: visit.engineNo ?? '',
      chassisNo: visit.chassisNo ?? visit.vin ?? '',
      odometer: visit.odometer != null ? String(visit.odometer) : '',
      fuelLevel: visit.fuel ?? '',
      vehicleImageUrl: visit.vehicleImageUrl ?? '',
      vehicleImagePublicId: visit.vehicleImagePublicId ?? '',
      remarks: '',
    })
  }, [visit.id, visit.engineNo, visit.chassisNo, visit.vin, visit.odometer, visit.fuel, visit.vehicleImageUrl, visit.vehicleImagePublicId])

  const handleSave = async () => {
    if (!token) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const updated = await serviceVisitsApi.update(token, visit.id, {
        engineNo: form.engineNo || undefined,
        chassisNo: form.chassisNo || undefined,
        odometer: form.odometer ? Number(form.odometer) : undefined,
        fuelLevel: form.fuelLevel || undefined,
        vehicleImageUrl: form.vehicleImageUrl || undefined,
        vehicleImagePublicId: form.vehicleImagePublicId || undefined,
        remarks: form.remarks || undefined,
      }, branchId)
      onSaved(updated)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save arrival details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-brand-charcoal">Gate-In / Arrival Details</h3>
          <p className="text-sm text-brand-muted mt-1">
            Confirm or update engine number, chassis number, odometer, fuel and vehicle photo before advancing.
          </p>
        </div>
        <Badge variant="default">{visit.registrationNumber}</Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-grey/40 p-4 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-2">Vehicle</p>
          <p className="font-semibold">{visit.make} {visit.model} {visit.variant}</p>
          <p className="text-sm text-brand-muted">{visit.customerName} · {visit.customerMobile}</p>
        </div>

        <Input
          label="Engine Number *"
          required
          placeholder="Engine number"
          value={form.engineNo}
          onChange={(e) => setForm({ ...form, engineNo: e.target.value })}
        />
        <Input
          label="Chassis Number *"
          required
          placeholder="Chassis / VIN"
          value={form.chassisNo}
          onChange={(e) => setForm({ ...form, chassisNo: e.target.value })}
        />
        <Input
          label="Odometer (km)"
          type="number"
          placeholder="e.g. 45230"
          value={form.odometer}
          onChange={(e) => setForm({ ...form, odometer: e.target.value })}
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fuel Level</label>
          <select
            value={form.fuelLevel}
            onChange={(e) => setForm({ ...form, fuelLevel: e.target.value })}
            className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm"
          >
            <option value="">Select fuel level</option>
            {FUEL_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <VehiclePhotoCapture
          imageUrl={form.vehicleImageUrl || undefined}
          entityId={visit.vehicleId}
          onUploaded={({ url, publicId }) => setForm({
            ...form,
            vehicleImageUrl: url,
            vehicleImagePublicId: publicId,
          })}
          onCleared={() => setForm({
            ...form,
            vehicleImageUrl: '',
            vehicleImagePublicId: '',
          })}
        />

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Arrival Remarks</label>
          <textarea
            className="flex w-full rounded-lg border border-brand-border px-3 py-2 text-sm min-h-[72px]"
            placeholder="Any notes at gate entry..."
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-brand-danger">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Arrival details saved. You can advance to the next stage when ready.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSave} disabled={saving || !form.engineNo || !form.chassisNo}>
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Arrival Details'}
        </Button>
        {canAdvance && onAdvance && (
          <Button variant="outline" onClick={onAdvance} disabled={advancing}>
            {advancing ? 'Advancing...' : (
              <>
                Advance to Next Stage
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
