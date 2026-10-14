import { STAGE_UI_PATHS } from '@/lib/stage-paths'
import { authStorage } from '@/lib/auth-storage'
import {
  buildDashboardFromDb,
  buildLoginUser,
  loadDatabase,
  LOCAL_DEMO_CREDENTIALS,
  mutateDatabase,
  paginate,
  wipFromDb,
  workflowStagesForPath,
} from '@/lib/local-db'
import type {
  BookingDetail,
  CustomerDetail,
  CustomerItem,
  MasterItem,
  PickupImageType,
  ServiceVisitDetail,
  ServiceVisitListItem,
  UploadResult,
  VehicleItem,
} from '@/lib/api'

interface LocalRequestOptions {
  method?: string
  body?: string
  token?: string
}

function parseBody<T>(body?: string): T {
  if (!body) return {} as T
  return JSON.parse(body) as T
}

function requireToken(token?: string) {
  const t = token ?? authStorage.getToken()
  if (!t || !t.startsWith('local-')) {
    throw new Error('Unauthorized')
  }
}

function stagePathForKey(stageKey: string): string | undefined {
  const path = STAGE_UI_PATHS[stageKey as keyof typeof STAGE_UI_PATHS]
  return path
}

function matchesStage(visit: ServiceVisitDetail, stageKey: string): ServiceVisitListItem {
  const path = stagePathForKey(stageKey)
  const stageDef = visit.stages.find((s) => s.path === path)
  let queueStageStatus = 'PENDING'
  if (stageDef?.status === 'current') queueStageStatus = 'CURRENT'
  if (stageDef?.status === 'completed') queueStageStatus = 'COMPLETED'
  return { ...visit, queueStageStatus }
}

function filterVisits(
  visits: ServiceVisitDetail[],
  params: URLSearchParams,
): ServiceVisitListItem[] {
  const search = params.get('search')?.toLowerCase()
  const stage = params.get('stage')
  const outstandingOnly = params.get('outstandingOnly') === 'true'

  let list = visits.map((v) => ({ ...v }))

  if (search) {
    list = list.filter(
      (v) =>
        v.visitNumber.toLowerCase().includes(search) ||
        v.registrationNumber.toLowerCase().includes(search) ||
        v.customerName.toLowerCase().includes(search),
    )
  }
  if (outstandingOnly) {
    list = list.filter((v) => v.outstanding > 0)
  }
  if (stage) {
    list = list
      .map((v) => matchesStage(v, stage))
      .filter((v) => {
        const path = stagePathForKey(stage)
        if (!path) return true
        const st = v.stages.find((s) => s.path === path)
        return st && (st.status === 'current' || st.status === 'completed')
      })
  }

  return list
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function localApiRequest<T>(endpoint: string, options: LocalRequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const [path, queryString] = endpoint.split('?')
  const params = new URLSearchParams(queryString ?? '')
  const db = loadDatabase()

  if (path === '/auth/login' && method === 'POST') {
    const body = parseBody<{
      tenantCode: string
      identifier: string
      password: string
    }>(options.body)
    const demoMatch =
      body.tenantCode?.toUpperCase() === LOCAL_DEMO_CREDENTIALS.tenantCode &&
      body.identifier?.toLowerCase() === LOCAL_DEMO_CREDENTIALS.identifier &&
      body.password === LOCAL_DEMO_CREDENTIALS.password
    const anyFilled = Boolean(body.tenantCode && body.identifier && body.password)
    if (!demoMatch && !anyFilled) {
      throw new Error('Invalid credentials')
    }
    const user = buildLoginUser()
    const accessToken = `local-access-${user.id}`
    const refreshToken = `local-refresh-${user.id}`
    return { accessToken, refreshToken, user } as T
  }

  if (path === '/auth/refresh' && method === 'POST') {
    const { refreshToken } = parseBody<{ refreshToken: string }>(options.body)
    if (!refreshToken?.startsWith('local-refresh-')) throw new Error('Invalid refresh token')
    const userId = refreshToken.replace('local-refresh-', '')
    return { accessToken: `local-access-${userId}` } as T
  }

  if (path === '/auth/logout' && method === 'POST') {
    requireToken(options.token)
    return undefined as T
  }

  if (path === '/auth/me' && method === 'GET') {
    requireToken(options.token)
    return buildLoginUser() as T
  }

  requireToken(options.token)

  if (path === '/dashboard' && method === 'GET') {
    return buildDashboardFromDb(db) as T
  }

  if (path === '/tenant/profile' && method === 'GET') {
    return db.tenantProfile as T
  }

  if (path === '/customers' && method === 'GET') {
    const search = params.get('search')?.toLowerCase()
    let items = db.customers
    if (search) {
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.mobile.includes(search) ||
          c.code.toLowerCase().includes(search),
      )
    }
    const page = Number(params.get('page') ?? 1)
    return paginate(items, page) as T
  }

  if (path === '/customers' && method === 'POST') {
    const body = parseBody<Record<string, unknown>>(options.body)
    const item: CustomerItem = {
      id: newId('c'),
      code: `CUS-${String(db.customers.length + 1).padStart(5, '0')}`,
      name: String(body.name ?? 'New Customer'),
      mobile: String(body.mobile ?? ''),
      email: body.email ? String(body.email) : undefined,
      type: String(body.type ?? 'Individual'),
      city: body.city ? String(body.city) : undefined,
      vehicles: 0,
    }
    mutateDatabase((d) => {
      d.customers.unshift(item)
    })
    return item as T
  }

  const customerMatch = path.match(/^\/customers\/([^/]+)$/)
  if (customerMatch && method === 'GET') {
    const c = db.customers.find((x) => x.id === customerMatch[1])
    if (!c) throw new Error('Customer not found')
    const detail: CustomerDetail = {
      ...c,
      vehicles: db.vehicles.filter((v) => v.customerId === c.id),
    }
    return detail as T
  }

  if (path === '/vehicles' && method === 'GET') {
    const search = params.get('search')?.toLowerCase()
    const customerId = params.get('customerId')
    let items = db.vehicles
    if (customerId) items = items.filter((v) => v.customerId === customerId)
    if (search) {
      items = items.filter(
        (v) =>
          v.registrationNo.toLowerCase().includes(search) ||
          v.make.toLowerCase().includes(search) ||
          v.model.toLowerCase().includes(search),
      )
    }
    return paginate(items, Number(params.get('page') ?? 1)) as T
  }

  if (path === '/vehicles' && method === 'POST') {
    const body = parseBody<Record<string, unknown>>(options.body)
    const item: VehicleItem = {
      id: newId('v'),
      registrationNo: String(body.registrationNo ?? ''),
      make: String(body.make ?? ''),
      model: String(body.model ?? ''),
      variant: body.variant ? String(body.variant) : undefined,
      customerId: body.customerId ? String(body.customerId) : undefined,
    }
    mutateDatabase((d) => {
      d.vehicles.unshift(item)
    })
    return item as T
  }

  const vehiclePatch = path.match(/^\/vehicles\/([^/]+)$/)
  if (vehiclePatch && method === 'PATCH') {
    const body = parseBody<Record<string, unknown>>(options.body)
    let updated: VehicleItem | undefined
    mutateDatabase((d) => {
      const idx = d.vehicles.findIndex((v) => v.id === vehiclePatch[1])
      if (idx === -1) throw new Error('Vehicle not found')
      d.vehicles[idx] = { ...d.vehicles[idx], ...body } as VehicleItem
      updated = d.vehicles[idx]
    })
    return updated as T
  }

  if (path === '/bookings' && method === 'GET') {
    return paginate(db.bookings as BookingDetail[]) as T
  }

  if (path === '/bookings' && method === 'POST') {
    const body = parseBody<Record<string, unknown>>(options.body)
    const booking: BookingDetail = {
      id: newId('bk'),
      bookingNumber: `SB-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(db.bookings.length + 1).padStart(6, '0')}`,
      bookingDate: String(body.bookingDate ?? new Date().toISOString().slice(0, 10)),
      status: 'Booked',
      serviceType: body.serviceType ? String(body.serviceType) : undefined,
      preferredSlot: body.preferredSlot ? String(body.preferredSlot) : undefined,
      customer: body.customer as BookingDetail['customer'],
      vehicle: body.vehicle as BookingDetail['vehicle'],
    }
    mutateDatabase((d) => {
      d.bookings.unshift(booking)
    })
    return booking as T
  }

  const bookingIdMatch = path.match(/^\/bookings\/([^/]+)$/)
  if (bookingIdMatch && method === 'GET') {
    const b = db.bookings.find((x) => x.id === bookingIdMatch[1])
    if (!b) throw new Error('Booking not found')
    return b as T
  }
  if (bookingIdMatch && method === 'PATCH') {
    const body = parseBody<Record<string, unknown>>(options.body)
    let updated: BookingDetail | undefined
    mutateDatabase((d) => {
      const idx = d.bookings.findIndex((b) => b.id === bookingIdMatch[1])
      if (idx === -1) throw new Error('Booking not found')
      d.bookings[idx] = { ...d.bookings[idx], ...body } as BookingDetail
      updated = d.bookings[idx]
    })
    return updated as T
  }

  const fromBookingMatch = path.match(/^\/service-visits\/from-booking\/([^/]+)$/)
  if (fromBookingMatch && method === 'POST') {
    const booking = db.bookings.find((b) => b.id === fromBookingMatch[1])
    if (!booking) throw new Error('Booking not found')
    const visit: ServiceVisitDetail = {
      id: newId('sv'),
      visitNumber: `SV-${Date.now()}`,
      registrationNumber: booking.vehicle?.registrationNo ?? '—',
      customerName: booking.customer?.name ?? '—',
      customerMobile: booking.customer?.mobile ?? '—',
      make: booking.vehicle?.make,
      model: booking.vehicle?.model,
      status: 'WIP',
      currentStage: 'gate-in',
      outstanding: 0,
      stages: workflowStagesForPath('gate-in'),
    }
    mutateDatabase((d) => {
      d.serviceVisits.unshift(visit)
    })
    return visit as T
  }

  if (path === '/service-visits/wip' && method === 'GET') {
    return wipFromDb(loadDatabase()) as T
  }

  if (path === '/service-visits' && method === 'GET') {
    const page = Number(params.get('page') ?? 1)
    const limit = Number(params.get('limit') ?? 50)
    const filtered = filterVisits(loadDatabase().serviceVisits, params)
    return paginate(filtered, page, limit) as T
  }

  const visitIdMatch = path.match(/^\/service-visits\/([^/]+)$/)
  if (visitIdMatch && method === 'GET') {
    const v = loadDatabase().serviceVisits.find((x) => x.id === visitIdMatch[1])
    if (!v) throw new Error('Service visit not found')
    return v as T
  }

  if (visitIdMatch && method === 'PATCH') {
    const body = parseBody<Record<string, unknown>>(options.body)
    let updated: ServiceVisitDetail | undefined
    mutateDatabase((d) => {
      const idx = d.serviceVisits.findIndex((v) => v.id === visitIdMatch[1])
      if (idx === -1) throw new Error('Service visit not found')
      d.serviceVisits[idx] = { ...d.serviceVisits[idx], ...body } as ServiceVisitDetail
      updated = d.serviceVisits[idx]
    })
    return updated as T
  }

  const advanceMatch = path.match(/^\/service-visits\/([^/]+)\/advance-stage$/)
  if (advanceMatch && method === 'PATCH') {
    const { stage } = parseBody<{ stage: string }>(options.body)
    let updated: ServiceVisitDetail | undefined
    mutateDatabase((d) => {
      const idx = d.serviceVisits.findIndex((v) => v.id === advanceMatch[1])
      if (idx === -1) throw new Error('Service visit not found')
      const visit = d.serviceVisits[idx]
      const stageIndex = visit.stages.findIndex((s) => s.id === stage || s.path === stage)
      if (stageIndex >= 0) {
        visit.stages = visit.stages.map((s, i) => ({
          ...s,
          status: i < stageIndex ? 'completed' : i === stageIndex ? 'current' : 'not_started',
        }))
        visit.currentStage = visit.stages[stageIndex]?.path ?? visit.currentStage
      }
      updated = visit
    })
    return updated as T
  }

  const pickupAssignMatch = path.match(/^\/service-visits\/([^/]+)\/pickup\/assign$/)
  if (pickupAssignMatch && method === 'PATCH') {
    const { executiveId } = parseBody<{ executiveId: string }>(options.body)
    const exec = loadDatabase().users.find((u) => u.id === executiveId)
    let updated: ServiceVisitDetail | undefined
    mutateDatabase((d) => {
      const idx = d.serviceVisits.findIndex((v) => v.id === pickupAssignMatch[1])
      if (idx === -1) throw new Error('Service visit not found')
      d.serviceVisits[idx] = {
        ...d.serviceVisits[idx],
        pickupExecutiveId: executiveId,
        pickupExecutiveName: exec?.name,
        pickupAssignedAt: new Date().toISOString(),
      }
      updated = d.serviceVisits[idx]
    })
    return updated as T
  }

  const pickupImagesMatch = path.match(/^\/service-visits\/([^/]+)\/pickup\/images$/)
  if (pickupImagesMatch && method === 'POST') {
    const body = parseBody<Record<string, unknown>>(options.body)
    let updated: ServiceVisitDetail | undefined
    mutateDatabase((d) => {
      const idx = d.serviceVisits.findIndex((v) => v.id === pickupImagesMatch[1])
      if (idx === -1) throw new Error('Service visit not found')
      const images = d.serviceVisits[idx].pickupImages ?? []
      images.push({
        type: body.type as PickupImageType,
        url: String(body.url ?? ''),
        capturedAt: String(body.capturedAt ?? new Date().toISOString()),
        latitude: body.latitude as number | undefined,
        longitude: body.longitude as number | undefined,
      })
      d.serviceVisits[idx].pickupImages = images
      updated = d.serviceVisits[idx]
    })
    return updated as T
  }

  const pickupCompleteMatch = path.match(/^\/service-visits\/([^/]+)\/pickup\/complete$/)
  if (pickupCompleteMatch && method === 'POST') {
    let updated: ServiceVisitDetail | undefined
    mutateDatabase((d) => {
      const idx = d.serviceVisits.findIndex((v) => v.id === pickupCompleteMatch[1])
      if (idx === -1) throw new Error('Service visit not found')
      d.serviceVisits[idx].pickupCompletedAt = new Date().toISOString()
      updated = d.serviceVisits[idx]
    })
    return updated as T
  }

  if (path === '/job-cards' && method === 'GET') {
    const search = params.get('search')?.toLowerCase()
    let items = loadDatabase().jobCards
    if (search) {
      items = items.filter(
        (j) =>
          j.jobCardNumber.toLowerCase().includes(search) ||
          j.registration.toLowerCase().includes(search),
      )
    }
    return paginate(items) as T
  }

  const jcByVisit = path.match(/^\/job-cards\/by-visit\/([^/]+)$/)
  if (jcByVisit && method === 'GET') {
    const jc = loadDatabase().jobCards.find((j) => j.visitId === jcByVisit[1]) ?? null
    return jc as T
  }

  if (path === '/parts' && method === 'GET') {
    const search = params.get('search')?.toLowerCase()
    let items = loadDatabase().parts
    if (search) {
      items = items.filter(
        (p) =>
          p.partNumber.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search),
      )
    }
    return paginate(items) as T
  }

  if (path === '/parts/stock' && method === 'GET') {
    const search = params.get('search')?.toLowerCase()
    let items = loadDatabase().stock
    if (search) {
      items = items.filter(
        (s) =>
          s.partNumber.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search),
      )
    }
    return paginate(items) as T
  }

  if (path === '/parts/dashboard' && method === 'GET') {
    const stock = loadDatabase().stock
    return {
      totalParts: loadDatabase().parts.length,
      warehouses: 1,
      lowStockCount: stock.filter((s) => s.lowStock).length,
      stockValue: stock.reduce((sum, s) => sum + s.available * 500, 0),
    } as T
  }

  if (path === '/bays' && method === 'GET') {
    return loadDatabase().bays as T
  }

  if (path === '/branches' && method === 'GET') {
    return loadDatabase().branches as T
  }

  if (path === '/users' && method === 'GET') {
    return loadDatabase().users as T
  }

  if (path === '/users/technicians' && method === 'GET') {
    return loadDatabase().users.filter((u) => u.roleCode === 'TECHNICIAN' || u.role === 'Technician') as T
  }

  if (path.startsWith('/search') && method === 'GET') {
    const q = params.get('q')?.toLowerCase() ?? ''
    const d = loadDatabase()
    return {
      customers: d.customers
        .filter((c) => c.name.toLowerCase().includes(q))
        .map((c) => ({
          id: c.id,
          type: 'customer',
          label: c.name,
          sublabel: c.mobile,
          path: `/app/customers/${c.id}`,
        })),
      vehicles: d.vehicles
        .filter((v) => v.registrationNo.toLowerCase().includes(q))
        .map((v) => ({
          id: v.id,
          type: 'vehicle',
          label: v.registrationNo,
          sublabel: `${v.make} ${v.model}`,
          path: '/app/vehicles',
        })),
      bookings: d.bookings
        .filter((b) => b.bookingNumber.toLowerCase().includes(q))
        .map((b) => ({
          id: b.id,
          type: 'booking',
          label: b.bookingNumber,
          sublabel: b.customer?.name ?? '',
          path: '/app/workshop/bookings',
        })),
      serviceVisits: d.serviceVisits
        .filter((v) => v.visitNumber.toLowerCase().includes(q) || v.registrationNumber.toLowerCase().includes(q))
        .map((v) => ({
          id: v.id,
          type: 'service_visit',
          label: v.visitNumber,
          sublabel: v.registrationNumber,
          path: `/app/service-visits/${v.id}/wip`,
        })),
      jobCards: d.jobCards
        .filter((j) => j.jobCardNumber.toLowerCase().includes(q))
        .map((j) => ({
          id: j.id,
          type: 'job_card',
          label: j.jobCardNumber,
          sublabel: j.registration,
          path: '/app/workshop/job-cards',
        })),
    } as T
  }

  const mastersDropdown = path.match(/^\/masters\/dropdown\/([^/]+)/)
  if (mastersDropdown && method === 'GET') {
    const category = mastersDropdown[1]
    const parentCode = params.get('parentCode')
    let items = loadDatabase().masters.filter((m) => m.category === category)
    if (parentCode) items = items.filter((m) => m.parentCode === parentCode)
    return items.map((m) => ({
      value: m.code,
      label: m.label,
      parentCode: m.parentCode,
    })) as T
  }

  const mastersCategory = path.match(/^\/masters\/([^/]+)$/)
  if (mastersCategory && method === 'GET') {
    const category = mastersCategory[1]
    return loadDatabase().masters.filter((m) => m.category === category) as T
  }

  if (path === '/masters' && method === 'POST') {
    const body = parseBody<Record<string, unknown>>(options.body)
    const item: MasterItem = {
      id: newId('m'),
      category: String(body.category ?? ''),
      code: String(body.code ?? ''),
      label: String(body.label ?? ''),
      parentCode: body.parentCode ? String(body.parentCode) : undefined,
      sortOrder: Number(body.sortOrder ?? 0),
    }
    mutateDatabase((d) => {
      d.masters.push(item)
    })
    return item as T
  }

  const masterDelete = path.match(/^\/masters\/([^/]+)$/)
  if (masterDelete && method === 'DELETE') {
    mutateDatabase((d) => {
      d.masters = d.masters.filter((m) => m.id !== masterDelete[1])
    })
    return { id: masterDelete[1], deactivated: true } as T
  }

  if (path === '/uploads/image' && method === 'POST') {
    const result: UploadResult = {
      id: newId('up'),
      url: 'https://placehold.co/600x400/png?text=Local+Upload',
      publicId: `local/${newId('img')}`,
      format: 'png',
    }
    return result as T
  }

  const inspectionUpload = path.match(/^\/uploads\/service-visits\/([^/]+)\/inspection$/)
  if (inspectionUpload && method === 'POST') {
    const results: UploadResult[] = [
      {
        id: newId('up'),
        url: 'https://placehold.co/600x400/png?text=Inspection',
        publicId: `local/${newId('img')}`,
      },
    ]
    return results as T
  }

  throw new Error(`Local API: no handler for ${method} ${path}`)
}
