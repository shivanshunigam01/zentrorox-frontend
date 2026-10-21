import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, Car, User, Play, Printer, Pencil, MapPin, Truck } from 'lucide-react'
import { ModuleFormDialog } from '@/components/ui/module-form-dialog'
import { PaginationBar, type PaginationMeta } from '@/components/ui/pagination-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageBanner } from '@/components/ui/page-banner'
import { Badge } from '@/components/ui/badge'
import { MasterSelect } from '@/components/ui/master-select'
import { Input } from '@/components/ui/input'
import { PrintableBookingSlip } from '@/components/documents/printable-booking-slip'
import { bookingsApi, customersApi, vehiclesApi, type BookingItem, type BookingDetail, type CustomerItem, type VehicleItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { captureGeoLocation } from '@/lib/geolocation'
import {
  formatPreferredSlotDisplay,
  preferredSlotToTimeValue,
  timeValueToPreferredSlot,
} from '@/lib/time-slot'

/** Select value when advisor adds a vehicle inline (persisted via vehicles API / CRM master). */
const NEW_VEHICLE_ID = '__new_vehicle__'

const BOOKING_STATUSES = [
  'CONFIRMED', 'AWAITING_PICKUP', 'PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS',
  'AWAITING_GATE_IN', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW',
] as const

const emptyForm = {
  bookingType: 'NORMAL' as 'NORMAL' | 'BREAKDOWN_ON_SPOT',
  arrivalMethod: 'SELF' as 'SELF' | 'PICKUP',
  customerId: '',
  vehicleId: '',
  serviceType: '',
  bookingSource: '',
  preferredSlot: '',
  preferredDate: '',
  customerComplaint: '',
  customerPriority: '',
  status: 'CONFIRMED',
  remarks: '',
  engineNo: '',
  chassisNo: '',
  pickupRequired: false,
  pickupAddress: '',
  pickupLocationLat: undefined as number | undefined,
  pickupLocationLng: undefined as number | undefined,
  breakdownAddress: '',
  breakdownSymptoms: '',
  breakdownSafetyNotes: '',
  breakdownContact: '',
  newVehicleRegistration: '',
  newVehicleMake: '',
  newVehicleModel: '',
  newVehicleVariant: '',
  newVehicleFuel: '',
}

export function BookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [vehicles, setVehicles] = useState<VehicleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null)
  const [startingVisit, setStartingVisit] = useState<string | null>(null)
  const [printBooking, setPrintBooking] = useState<BookingDetail | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [loadingPrint, setLoadingPrint] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [capturingLocation, setCapturingLocation] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 })

  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [b, c] = await Promise.all([
        bookingsApi.list(token, branchId, { page, limit }),
        customersApi.list(token, { limit: 500 }),
      ])
      setBookings(b.items)
      setPagination(b.pagination)
      setCustomers(c.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, limit])

  useEffect(() => {
    if (!token || !form.customerId) {
      setVehicles([])
      return
    }
    vehiclesApi.list(token, { customerId: form.customerId }).then((r) => setVehicles(r.items))
  }, [form.customerId, token])

  useEffect(() => {
    if (!form.vehicleId || form.vehicleId === NEW_VEHICLE_ID) return
    const selected = vehicles.find((v) => v.id === form.vehicleId)
    if (!selected) return
    setForm((prev) => ({
      ...prev,
      engineNo: prev.engineNo || selected.engineNo || '',
      chassisNo: prev.chassisNo || selected.chassisNo || selected.vin || '',
    }))
  }, [form.vehicleId, vehicles])

  const isNewVehicle = form.vehicleId === NEW_VEHICLE_ID

  const resolveVehicleIdForSave = async (): Promise<string> => {
    if (!token || !form.customerId) throw new Error('Customer is required')
    if (form.vehicleId && form.vehicleId !== NEW_VEHICLE_ID) return form.vehicleId
    if (!form.newVehicleRegistration.trim() || !form.newVehicleMake || !form.newVehicleModel) {
      throw new Error('Enter registration, make and model for the new vehicle')
    }
    const created = await vehiclesApi.create(token, {
      customerId: form.customerId,
      registrationNo: form.newVehicleRegistration.trim().toUpperCase(),
      make: form.newVehicleMake,
      model: form.newVehicleModel,
      variant: form.newVehicleVariant || undefined,
      fuelType: form.newVehicleFuel || undefined,
      engineNo: form.engineNo || undefined,
      chassisNo: form.chassisNo || undefined,
      vin: form.chassisNo || undefined,
    }, branchId)
    const newId = created.id ?? String((created as { _id?: string })._id ?? '')
    if (!newId) throw new Error('Vehicle was created but id was missing')
    setVehicles((prev) => [{ ...created, id: newId }, ...prev.filter((v) => v.id !== newId)])
    return newId
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  const openCreateForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = async (bookingId: string) => {
    if (!token) return
    setLoadingEdit(bookingId)
    try {
      const detail = await bookingsApi.get(token, bookingId, branchId)
      setEditingId(bookingId)
      setForm({
        ...emptyForm,
        customerId: detail.customer?.id ?? '',
        vehicleId: detail.vehicle?.id ?? '',
        serviceType: detail.serviceType ?? '',
        bookingSource: detail.source ?? '',
        preferredSlot: preferredSlotToTimeValue(detail.preferredSlot),
        preferredDate: detail.preferredDate
          ? new Date(detail.preferredDate).toISOString().slice(0, 10)
          : '',
        customerComplaint: detail.customerComplaint ?? '',
        bookingType: (detail.bookingType as 'NORMAL' | 'BREAKDOWN_ON_SPOT') ?? 'NORMAL',
        arrivalMethod: (detail.arrivalMethod as 'SELF' | 'PICKUP') ?? (detail.pickupRequired ? 'PICKUP' : 'SELF'),
        customerPriority: detail.customerPriority ?? '',
        status: detail.status ?? 'CONFIRMED',
        breakdownAddress: (detail.breakdownDetails as { address?: string })?.address ?? '',
        breakdownSymptoms: (detail.breakdownDetails as { symptoms?: string })?.symptoms ?? '',
        breakdownSafetyNotes: (detail.breakdownDetails as { safetyNotes?: string })?.safetyNotes ?? '',
        breakdownContact: (detail.breakdownDetails as { contactAtLocation?: string })?.contactAtLocation ?? '',
        remarks: detail.remarks ?? '',
        engineNo: detail.vehicle?.engineNo ?? '',
        chassisNo: detail.vehicle?.chassisNo ?? detail.vehicle?.vin ?? '',
        pickupRequired: detail.pickupRequired ?? false,
        pickupAddress: detail.pickupAddress ?? '',
        pickupLocationLat: detail.pickupLocationLat,
        pickupLocationLng: detail.pickupLocationLng,
      })
      setShowForm(true)
    } finally {
      setLoadingEdit(null)
    }
  }

  const openPrintSlip = async (bookingId: string) => {
    if (!token) return
    setLoadingPrint(bookingId)
    try {
      const detail = await bookingsApi.get(token, bookingId, branchId)
      setPrintBooking(detail)
      requestAnimationFrame(() => printRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } finally {
      setLoadingPrint(null)
    }
  }

  const handleStartVisit = async (bookingId: string) => {
    if (!token || !branchId) return
    setStartingVisit(bookingId)
    try {
      const visit = await bookingsApi.createVisitFromBooking(token, bookingId, branchId)
      const currentStage = visit.stages.find((s) => s.status === 'current')
      const path = currentStage?.path ?? 'gate-in'
      navigate(`/app/service-visits/${visit.id}/${path}`)
      await load()
    } finally {
      setStartingVisit(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !branchId) return
    setSaving(true)
    setFormError(null)
    try {
      const vehiclePayload = {
        engineNo: form.engineNo || undefined,
        chassisNo: form.chassisNo || undefined,
      }
      const pickupRequired = form.bookingType === 'BREAKDOWN_ON_SPOT' || form.arrivalMethod === 'PICKUP' || form.pickupRequired
      const pickupPayload = {
        bookingType: form.bookingType,
        arrivalMethod: pickupRequired ? 'PICKUP' : 'SELF',
        customerPriority: form.customerPriority || undefined,
        pickupRequired,
        pickupAddress: pickupRequired ? (form.pickupAddress || form.breakdownAddress || undefined) : undefined,
        pickupLocationLat: pickupRequired ? form.pickupLocationLat : undefined,
        pickupLocationLng: pickupRequired ? form.pickupLocationLng : undefined,
        breakdownDetails: form.bookingType === 'BREAKDOWN_ON_SPOT' ? {
          address: form.breakdownAddress,
          symptoms: form.breakdownSymptoms,
          safetyNotes: form.breakdownSafetyNotes,
          contactAtLocation: form.breakdownContact,
          towRequired: true,
        } : undefined,
      }

      const preferredSlotLabel = timeValueToPreferredSlot(form.preferredSlot)
      const vehicleId = await resolveVehicleIdForSave()

      if (editingId) {
        await bookingsApi.update(token, editingId, {
          customerId: form.customerId,
          vehicleId,
          serviceType: form.serviceType,
          source: form.bookingSource,
          preferredSlot: preferredSlotLabel || undefined,
          preferredDate: form.preferredDate || undefined,
          customerComplaint: form.customerComplaint,
          status: form.status,
          remarks: form.remarks,
          ...vehiclePayload,
          ...pickupPayload,
        }, branchId)
        resetForm()
        await load()
      } else {
        const created = await bookingsApi.create(token, {
          branchId,
          customerId: form.customerId,
          vehicleId,
          serviceType: form.serviceType,
          source: form.bookingSource,
          preferredSlot: preferredSlotLabel || undefined,
          preferredDate: form.preferredDate || undefined,
          customerComplaint: form.customerComplaint,
          remarks: form.remarks,
          ...vehiclePayload,
          ...pickupPayload,
        }, branchId)
        resetForm()
        await load()
        if (created.id) await openPrintSlip(created.id)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save booking')
    } finally {
      setSaving(false)
    }
  }

  const canEdit = (status: string) => status !== 'CHECKED_IN' && status !== 'ARRIVED' && status !== 'CANCELLED'

  const capturePickupLocation = async () => {
    setCapturingLocation(true)
    try {
      const geo = await captureGeoLocation()
      if (geo) {
        setForm((prev) => ({
          ...prev,
          pickupLocationLat: geo.latitude,
          pickupLocationLng: geo.longitude,
        }))
      }
    } finally {
      setCapturingLocation(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Bookings"
        description="Create, edit bookings and print professional service booking slips"
        icon={Calendar}
        gradient="from-emerald-600 to-teal-700"
        emoji="📅"
        actions={
          <Button className="bg-white text-emerald-700 hover:bg-white/90 shadow-lg" onClick={openCreateForm}>
            <Plus className="h-4 w-4" /> New Booking
          </Button>
        }
      />

      <ModuleFormDialog
        open={showForm}
        onOpenChange={(open) => { if (!open) resetForm() }}
        title={editingId ? 'Edit Booking' : 'Create Booking'}
        description="Customer, vehicle, service slot and pickup details"
        size="xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            <Button type="submit" form="booking-form" disabled={saving} className="min-w-[140px]">
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create booking'}
            </Button>
          </>
        }
      >
            <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-3 py-2">{formError}</p>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`rounded-xl border-2 p-4 text-left transition ${form.bookingType === 'NORMAL' ? 'border-emerald-500 bg-emerald-50' : 'border-brand-border'}`}
                  onClick={() => setForm({ ...form, bookingType: 'NORMAL' })}
                >
                  <div className="font-semibold">Normal booking</div>
                  <p className="text-xs text-muted-foreground mt-1">Scheduled service or walk-in at workshop</p>
                </button>
                <button
                  type="button"
                  className={`rounded-xl border-2 p-4 text-left transition ${form.bookingType === 'BREAKDOWN_ON_SPOT' ? 'border-amber-500 bg-amber-50' : 'border-brand-border'}`}
                  onClick={() => setForm({
                    ...form,
                    bookingType: 'BREAKDOWN_ON_SPOT',
                    arrivalMethod: 'PICKUP',
                    pickupRequired: true,
                  })}
                >
                  <div className="font-semibold">Breakdown on-spot</div>
                  <p className="text-xs text-muted-foreground mt-1">Roadside assistance · booking fee ₹0</p>
                </button>
              </div>

              {form.bookingType === 'BREAKDOWN_ON_SPOT' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                  Do not dispatch personnel into unsafe conditions. Confirm rescue availability before promising ETA.
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Customer *</label>
                <select
                  required
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value, vehicleId: '' })}
                  className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm"
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.mobile}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Vehicle *</label>
                <select
                  required
                  value={form.vehicleId}
                  onChange={(e) => setForm({
                    ...form,
                    vehicleId: e.target.value,
                    engineNo: '',
                    chassisNo: '',
                    newVehicleRegistration: '',
                    newVehicleMake: '',
                    newVehicleModel: '',
                    newVehicleVariant: '',
                    newVehicleFuel: '',
                  })}
                  disabled={!form.customerId}
                  className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm disabled:opacity-50"
                >
                  <option value="">{form.customerId ? 'Select vehicle' : 'Select customer first'}</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNo} — {v.make} {v.model}
                    </option>
                  ))}
                  {form.customerId && !editingId && (
                    <option value={NEW_VEHICLE_ID}>+ Add another vehicle (saved to vehicle master)</option>
                  )}
                </select>
                <p className="text-xs text-brand-muted">
                  Pick a vehicle already linked to this customer, or add a new one — it is stored under CRM → Vehicles.
                </p>
              </div>
              {isNewVehicle && (
                <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 grid sm:grid-cols-2 gap-4">
                  <p className="sm:col-span-2 text-sm font-medium text-emerald-950">New vehicle details</p>
                  <Input
                    label="Registration number *"
                    required
                    placeholder="e.g. BR 01 AB 1234"
                    value={form.newVehicleRegistration}
                    onChange={(e) => setForm({ ...form, newVehicleRegistration: e.target.value })}
                  />
                  <MasterSelect
                    category="VEHICLE_MAKE"
                    label="Make *"
                    required
                    value={form.newVehicleMake}
                    onChange={(v) => setForm({ ...form, newVehicleMake: v, newVehicleModel: '' })}
                  />
                  <MasterSelect
                    category="VEHICLE_MODEL"
                    label="Model *"
                    required
                    value={form.newVehicleModel}
                    onChange={(v) => setForm({ ...form, newVehicleModel: v })}
                    parentCode={form.newVehicleMake}
                  />
                  <Input
                    label="Variant"
                    placeholder="Optional"
                    value={form.newVehicleVariant}
                    onChange={(e) => setForm({ ...form, newVehicleVariant: e.target.value })}
                  />
                  <MasterSelect
                    category="FUEL_TYPE"
                    label="Fuel type"
                    value={form.newVehicleFuel}
                    onChange={(v) => setForm({ ...form, newVehicleFuel: v })}
                  />
                </div>
              )}
              <Input
                label="Engine Number"
                placeholder="e.g. L15Z1-7890123"
                value={form.engineNo}
                onChange={(e) => setForm({ ...form, engineNo: e.target.value })}
              />
              <Input
                label="Chassis Number"
                placeholder="e.g. MAHFR2WK5K1234567"
                value={form.chassisNo}
                onChange={(e) => setForm({ ...form, chassisNo: e.target.value })}
              />
              <MasterSelect
                category="SERVICE_TYPE"
                label="Service Type"
                required
                value={form.serviceType}
                onChange={(v) => setForm({ ...form, serviceType: v })}
              />
              <MasterSelect
                category="BOOKING_SOURCE"
                label="Booking Source"
                value={form.bookingSource}
                onChange={(v) => setForm({ ...form, bookingSource: v })}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Preferred Date</label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm"
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="booking-preferred-slot" className="text-sm font-medium">
                  Preferred time
                </label>
                <input
                  id="booking-preferred-slot"
                  type="time"
                  step={900}
                  className="flex h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                  value={form.preferredSlot}
                  onChange={(e) => setForm({ ...form, preferredSlot: e.target.value })}
                />
                <p className="text-xs text-brand-muted">
                  Click the field to open the time picker (15-minute steps). Saved as{' '}
                  {form.preferredSlot ? formatPreferredSlotDisplay(form.preferredSlot) : '—'}.
                </p>
              </div>
              {form.bookingType === 'BREAKDOWN_ON_SPOT' && (
                <>
                  <Input label="Breakdown address *" value={form.breakdownAddress} onChange={(e) => setForm({ ...form, breakdownAddress: e.target.value })} />
                  <Input label="Contact at location" value={form.breakdownContact} onChange={(e) => setForm({ ...form, breakdownContact: e.target.value })} />
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium">Symptoms</label>
                    <textarea className="flex w-full rounded-lg border border-brand-border px-3 py-2 text-sm min-h-[60px]" value={form.breakdownSymptoms} onChange={(e) => setForm({ ...form, breakdownSymptoms: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium">Safety notes</label>
                    <textarea className="flex w-full rounded-lg border border-brand-border px-3 py-2 text-sm min-h-[48px]" value={form.breakdownSafetyNotes} onChange={(e) => setForm({ ...form, breakdownSafetyNotes: e.target.value })} />
                  </div>
                </>
              )}
              {editingId && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm"
                  >
                    {BOOKING_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5 sm:col-span-2 rounded-xl border border-brand-border bg-brand-grey/30 p-4">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4 text-brand-yellow" />
                  Pickup Request
                </label>
                <p className="text-xs text-brand-muted">
                  Choose Yes if our executive should pick up the vehicle from a location. Choose No for normal gate arrival by the vehicle owner.
                </p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="pickupRequired"
                      checked={!form.pickupRequired}
                      onChange={() => setForm({
                        ...form,
                        pickupRequired: false,
                        pickupAddress: '',
                        pickupLocationLat: undefined,
                        pickupLocationLng: undefined,
                      })}
                    />
                    No — Gate arrival
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="pickupRequired"
                      checked={form.pickupRequired}
                      onChange={() => setForm({ ...form, pickupRequired: true })}
                    />
                    Yes — Pickup from location
                  </label>
                </div>
                {form.pickupRequired && (
                  <div className="mt-3 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Pickup Address *</label>
                      <textarea
                        required
                        className="flex w-full rounded-lg border border-brand-border px-3 py-2 text-sm min-h-[72px]"
                        placeholder="Full address where the vehicle will be picked up..."
                        value={form.pickupAddress}
                        onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="button" variant="outline" size="sm" disabled={capturingLocation} onClick={capturePickupLocation}>
                        <MapPin className="h-3.5 w-3.5" />
                        {capturingLocation ? 'Getting location...' : 'Capture GPS Coordinates'}
                      </Button>
                      {(form.pickupLocationLat != null && form.pickupLocationLng != null) && (
                        <span className="text-xs text-brand-muted">
                          {form.pickupLocationLat.toFixed(5)}, {form.pickupLocationLng.toFixed(5)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Customer Complaint</label>
                <textarea
                  className="flex w-full rounded-lg border border-brand-border px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Describe the issue..."
                  value={form.customerComplaint}
                  onChange={(e) => setForm({ ...form, customerComplaint: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Remarks</label>
                <textarea
                  className="flex w-full rounded-lg border border-brand-border px-3 py-2 text-sm min-h-[60px]"
                  placeholder="Internal notes..."
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>
              </div>
            </form>
      </ModuleFormDialog>

      <ModuleFormDialog
        open={!!printBooking}
        onOpenChange={(open) => { if (!open) setPrintBooking(null) }}
        title={printBooking ? `Booking Slip — ${printBooking.bookingNumber}` : 'Booking Slip'}
        size="xl"
      >
        <div ref={printRef} className="print-host-card">
          {printBooking ? <PrintableBookingSlip booking={printBooking} /> : null}
        </div>
      </ModuleFormDialog>

      {loading ? (
        <Card className="no-print"><p className="text-center py-8 text-sm text-brand-muted">Loading bookings...</p></Card>
      ) : bookings.length === 0 ? (
        <Card className="no-print"><p className="text-center py-8 text-sm text-brand-muted">No bookings yet. Use New Booking to create one.</p></Card>
      ) : (
        <>
          <div className="grid gap-3 lg:hidden no-print">
            {bookings.map((b) => (
              <Card key={b.id} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-brand-muted">{b.bookingNumber}</p>
                      <p className="font-semibold truncate">{b.customer?.name ?? '—'}</p>
                      <p className="text-sm text-brand-muted flex items-center gap-1.5 mt-1">
                        <Car className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{b.vehicle?.registrationNo ?? '—'}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge>{b.status}</Badge>
                      {b.pickupRequired && <Badge variant="info" className="text-[10px]">Pickup</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-brand-muted">Service</p>
                      <p className="font-medium">{b.serviceType ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted">Slot</p>
                      <p className="font-medium">{formatPreferredSlotDisplay(b.preferredSlot)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {canEdit(b.status) && (
                      <Button variant="outline" size="sm" className="flex-1" disabled={loadingEdit === b.id} onClick={() => openEdit(b.id)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1" disabled={loadingPrint === b.id} onClick={() => openPrintSlip(b.id)}>
                      <Printer className="h-3.5 w-3.5" /> Slip
                    </Button>
                    {canEdit(b.status) && (
                      <Button size="sm" className="w-full" disabled={startingVisit === b.id} onClick={() => handleStartVisit(b.id)}>
                        <Play className="h-3.5 w-3.5" />
                        {startingVisit === b.id ? 'Starting...' : 'Start Visit'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="no-print hidden lg:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-grey/50">
                      <th className="text-left px-5 py-3 font-medium text-brand-muted">Booking #</th>
                      <th className="text-left px-3 py-3 font-medium text-brand-muted">Customer</th>
                      <th className="text-left px-3 py-3 font-medium text-brand-muted">Vehicle</th>
                      <th className="text-left px-3 py-3 font-medium text-brand-muted">Service</th>
                      <th className="text-left px-3 py-3 font-medium text-brand-muted">Slot</th>
                      <th className="text-left px-3 py-3 font-medium text-brand-muted">Status</th>
                      <th className="text-right px-5 py-3 font-medium text-brand-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-brand-border hover:bg-brand-grey/30">
                        <td className="px-5 py-3 font-mono text-xs">{b.bookingNumber}</td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {b.customer?.name ?? '—'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5" /> {b.vehicle?.registrationNo ?? '—'}</span>
                        </td>
                        <td className="px-3 py-3">{b.serviceType ?? '—'}</td>
                        <td className="px-3 py-3">{formatPreferredSlotDisplay(b.preferredSlot)}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge>{b.status}</Badge>
                            {b.pickupRequired && <Badge variant="info">Pickup</Badge>}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit(b.status) && (
                              <Button variant="ghost" size="sm" disabled={loadingEdit === b.id} onClick={() => openEdit(b.id)}>
                                <Pencil className="h-3.5 w-3.5" />
                                {loadingEdit === b.id ? '...' : 'Edit'}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" disabled={loadingPrint === b.id} onClick={() => openPrintSlip(b.id)}>
                              <Printer className="h-3.5 w-3.5" />
                              {loadingPrint === b.id ? '...' : 'Slip'}
                            </Button>
                            {canEdit(b.status) && (
                              <Button variant="ghost" size="sm" disabled={startingVisit === b.id} onClick={() => handleStartVisit(b.id)}>
                                <Play className="h-3.5 w-3.5" />
                                {startingVisit === b.id ? 'Starting...' : 'Start Visit'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
                onLimitChange={(n) => { setLimit(n); setPage(1) }}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
