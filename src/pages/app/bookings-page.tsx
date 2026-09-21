import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, Car, User, Play, Printer, X, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageBanner } from '@/components/ui/page-banner'
import { Badge } from '@/components/ui/badge'
import { MasterSelect } from '@/components/ui/master-select'
import { Input } from '@/components/ui/input'
import { VehiclePhotoCapture } from '@/components/ui/vehicle-photo-capture'
import { PrintableBookingSlip } from '@/components/documents/printable-booking-slip'
import { bookingsApi, customersApi, vehiclesApi, type BookingItem, type BookingDetail, type CustomerItem, type VehicleItem } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'

const BOOKING_STATUSES = ['BOOKED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'ARRIVED', 'NO_SHOW'] as const

const emptyForm = {
  customerId: '',
  vehicleId: '',
  serviceType: '',
  bookingSource: '',
  preferredSlot: '',
  preferredDate: '',
  customerComplaint: '',
  status: 'BOOKED',
  remarks: '',
  engineNo: '',
  chassisNo: '',
  vehicleImageUrl: '',
  vehicleImagePublicId: '',
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

  const token = authStorage.getToken()
  const branchId = authStorage.getBranchId() ?? undefined

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [b, c] = await Promise.all([
        bookingsApi.list(token, branchId),
        customersApi.list(token),
      ])
      setBookings(b.items)
      setCustomers(c.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!token || !form.customerId) {
      setVehicles([])
      return
    }
    vehiclesApi.list(token, { customerId: form.customerId }).then((r) => setVehicles(r.items))
  }, [form.customerId, token])

  useEffect(() => {
    if (!form.vehicleId) return
    const selected = vehicles.find((v) => v.id === form.vehicleId)
    if (!selected) return
    setForm((prev) => ({
      ...prev,
      engineNo: prev.engineNo || selected.engineNo || '',
      chassisNo: prev.chassisNo || selected.chassisNo || selected.vin || '',
      vehicleImageUrl: prev.vehicleImageUrl || selected.imageUrl || '',
      vehicleImagePublicId: prev.vehicleImagePublicId || selected.imagePublicId || '',
    }))
  }, [form.vehicleId, vehicles])

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
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
        customerId: detail.customer?.id ?? '',
        vehicleId: detail.vehicle?.id ?? '',
        serviceType: detail.serviceType ?? '',
        bookingSource: detail.source ?? '',
        preferredSlot: detail.preferredSlot ?? '',
        preferredDate: detail.preferredDate
          ? new Date(detail.preferredDate).toISOString().slice(0, 10)
          : '',
        customerComplaint: detail.customerComplaint ?? '',
        status: detail.status ?? 'BOOKED',
        remarks: detail.remarks ?? '',
        engineNo: detail.vehicle?.engineNo ?? '',
        chassisNo: detail.vehicle?.chassisNo ?? detail.vehicle?.vin ?? '',
        vehicleImageUrl: detail.vehicle?.imageUrl ?? '',
        vehicleImagePublicId: detail.vehicle?.imagePublicId ?? '',
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
    try {
      const vehiclePayload = {
        engineNo: form.engineNo || undefined,
        chassisNo: form.chassisNo || undefined,
        vehicleImageUrl: form.vehicleImageUrl || undefined,
        vehicleImagePublicId: form.vehicleImagePublicId || undefined,
      }

      if (editingId) {
        await bookingsApi.update(token, editingId, {
          customerId: form.customerId,
          vehicleId: form.vehicleId,
          serviceType: form.serviceType,
          source: form.bookingSource,
          preferredSlot: form.preferredSlot,
          preferredDate: form.preferredDate || undefined,
          customerComplaint: form.customerComplaint,
          status: form.status,
          remarks: form.remarks,
          ...vehiclePayload,
        }, branchId)
        resetForm()
        await load()
      } else {
        const created = await bookingsApi.create(token, {
          branchId,
          customerId: form.customerId,
          vehicleId: form.vehicleId,
          serviceType: form.serviceType,
          source: form.bookingSource,
          preferredSlot: form.preferredSlot,
          preferredDate: form.preferredDate || undefined,
          customerComplaint: form.customerComplaint,
          remarks: form.remarks,
          ...vehiclePayload,
        }, branchId)
        resetForm()
        await load()
        if (created.id) await openPrintSlip(created.id)
      }
    } finally {
      setSaving(false)
    }
  }

  const canEdit = (status: string) => status !== 'ARRIVED' && status !== 'CANCELLED'

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

      {showForm && (
        <Card className="no-print">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>{editingId ? 'Edit Booking' : 'Create Booking'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" /> Close
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Vehicle *</label>
                <select
                  required
                  value={form.vehicleId}
                  onChange={(e) => setForm({
                    ...form,
                    vehicleId: e.target.value,
                    engineNo: '',
                    chassisNo: '',
                    vehicleImageUrl: '',
                    vehicleImagePublicId: '',
                  })}
                  disabled={!form.customerId}
                  className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm disabled:opacity-50"
                >
                  <option value="">{form.customerId ? 'Select vehicle' : 'Select customer first'}</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registrationNo} — {v.make} {v.model}</option>
                  ))}
                </select>
              </div>
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
              <VehiclePhotoCapture
                imageUrl={form.vehicleImageUrl || undefined}
                entityId={form.vehicleId || undefined}
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
                <label className="text-sm font-medium">Preferred Slot</label>
                <input
                  className="flex h-10 w-full rounded-lg border border-brand-border px-3 text-sm"
                  placeholder="e.g. 10:00 AM"
                  value={form.preferredSlot}
                  onChange={(e) => setForm({ ...form, preferredSlot: e.target.value })}
                />
              </div>
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
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create & Print Slip'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {printBooking && (
        <Card ref={printRef} className="print-host-card border-brand-yellow/40 shadow-lg">
          <CardHeader className="no-print flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Booking Slip — {printBooking.bookingNumber}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setPrintBooking(null)}>
              <X className="h-4 w-4" /> Close
            </Button>
          </CardHeader>
          <CardContent>
            <PrintableBookingSlip booking={printBooking} />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="no-print"><p className="text-center py-8 text-sm text-brand-muted">Loading bookings...</p></Card>
      ) : bookings.length === 0 ? (
        <Card className="no-print"><p className="text-center py-8 text-sm text-brand-muted">No bookings yet. Create one above.</p></Card>
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
                    <Badge className="shrink-0">{b.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-brand-muted">Service</p>
                      <p className="font-medium">{b.serviceType ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted">Slot</p>
                      <p className="font-medium">{b.preferredSlot ?? '—'}</p>
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
                        <td className="px-3 py-3">{b.preferredSlot ?? '—'}</td>
                        <td className="px-3 py-3"><Badge>{b.status}</Badge></td>
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
