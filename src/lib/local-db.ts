import { WORKFLOW_STAGES } from '@/lib/constants'
import {
  BOOKINGS_TODAY,
  CUSTOMERS,
  DEMO_BRANCHES,
  REVENUE_CHART_DATA,
  VEHICLES,
  WIP_VEHICLES,
} from '@/lib/mock-data'
import type {
  BayItem,
  BookingDetail,
  BranchItem,
  CustomerItem,
  JobCardItem,
  MasterItem,
  PartItem,
  ServiceVisitDetail,
  StockItem,
  TenantProfile,
  UserItem,
  VehicleItem,
  WipItem,
} from '@/lib/api'

const DB_KEY = 'zs_local_db_v1'

export interface LocalDatabase {
  customers: CustomerItem[]
  vehicles: VehicleItem[]
  bookings: BookingDetail[]
  serviceVisits: ServiceVisitDetail[]
  jobCards: JobCardItem[]
  parts: PartItem[]
  stock: StockItem[]
  bays: BayItem[]
  branches: BranchItem[]
  users: UserItem[]
  masters: MasterItem[]
  tenantProfile: TenantProfile
}

export function workflowStagesForPath(currentPath: string) {
  const currentIndex = WORKFLOW_STAGES.findIndex((s) => s.path === currentPath)
  const idx = currentIndex >= 0 ? currentIndex : 12
  return WORKFLOW_STAGES.map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    path: stage.path,
    status: index < idx ? 'completed' : index === idx ? 'current' : 'not_started',
  }))
}

function seedServiceVisit(
  id: string,
  visitNumber: string,
  registration: string,
  customerName: string,
  customerMobile: string,
  make: string,
  model: string,
  currentStagePath: string,
  status: string,
  jobCardNumber?: string,
): ServiceVisitDetail {
  return {
    id,
    visitNumber,
    registrationNumber: registration,
    customerName,
    customerMobile,
    make,
    model,
    variant: '',
    jobCardNumber,
    advisor: 'Priya Singh',
    status,
    currentStage: currentStagePath,
    promiseTime: new Date().toISOString(),
    outstanding: 0,
    odometer: 45230,
    fuel: 'Petrol — 3/4',
    pickupRequired: currentStagePath === 'pickup',
    pickupImages: [],
    stages: workflowStagesForPath(currentStagePath),
  }
}

function seedBookings(): BookingDetail[] {
  return BOOKINGS_TODAY.map((b, i) => ({
    id: `bk-${i + 1}`,
    bookingNumber: b.id,
    bookingDate: new Date().toISOString().slice(0, 10),
    status: b.status,
    serviceType: b.service,
    preferredSlot: b.time,
    customer: { name: b.customer, mobile: '9876543210' },
    vehicle: {
      registrationNo: b.vehicle,
      make: 'Honda',
      model: 'City',
    },
  }))
}

function seedCustomers(): CustomerItem[] {
  return CUSTOMERS.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    mobile: c.mobile,
    email: c.email,
    type: c.type,
    vehicles: c.vehicles,
    lastVisit: c.lastVisit,
  }))
}

function seedVehicles(): VehicleItem[] {
  return VEHICLES.map((v) => ({
    id: v.id,
    registrationNo: v.registration,
    make: v.make,
    model: v.model,
    variant: v.variant,
    customerId: v.customer === 'Amit Sharma' ? 'C001' : 'C003',
    customer: { name: v.customer, mobile: '9876543210' },
  }))
}

function seedMasters(): MasterItem[] {
  const rows: MasterItem[] = [
    { id: 'm-st-1', category: 'SERVICE_TYPE', code: 'PERIODIC', label: 'Periodic Service', sortOrder: 1 },
    { id: 'm-st-2', category: 'SERVICE_TYPE', code: 'AC', label: 'AC Service', sortOrder: 2 },
    { id: 'm-vm-1', category: 'VEHICLE_MAKE', code: 'HONDA', label: 'Honda', sortOrder: 1 },
    { id: 'm-vm-2', category: 'VEHICLE_MAKE', code: 'HYUNDAI', label: 'Hyundai', sortOrder: 2 },
    { id: 'm-vmd-1', category: 'VEHICLE_MODEL', code: 'CITY', label: 'City', parentCode: 'HONDA', sortOrder: 1 },
    { id: 'm-ft-1', category: 'FUEL_TYPE', code: 'PETROL', label: 'Petrol', sortOrder: 1 },
    { id: 'm-bt-1', category: 'BAY_TYPE', code: 'GENERAL', label: 'General Service', sortOrder: 1 },
    { id: 'm-jt-1', category: 'JOB_TYPE', code: 'MECH', label: 'Mechanical', sortOrder: 1 },
    { id: 'm-bs-1', category: 'BOOKING_SOURCE', code: 'WALKIN', label: 'Walk-in', sortOrder: 1 },
    { id: 'm-pm-1', category: 'PAYMENT_MODE', code: 'UPI', label: 'UPI', sortOrder: 1 },
    { id: 'm-ct-1', category: 'COMPLAINT_TYPE', code: 'NOISE', label: 'Unusual noise', sortOrder: 1 },
  ]
  return rows
}

export function createSeedDatabase(): LocalDatabase {
  const serviceVisits: ServiceVisitDetail[] = [
    seedServiceVisit(
      'sv-001',
      'SV-202509-000042',
      'BR 01 AB 4521',
      'Amit Sharma',
      '9876543210',
      'Honda',
      'City',
      'wip',
      'WIP',
      'JC-PAT-202509-000038',
    ),
    seedServiceVisit(
      'sv-002',
      'SV-202509-000043',
      'BR 02 CD 7890',
      'Neha Gupta',
      '9988776655',
      'Hyundai',
      'Creta',
      'pickup',
      'BOOKED',
    ),
    seedServiceVisit(
      'sv-003',
      'SV-202509-000044',
      'BR 06 KL 3456',
      'Sanjay Mishra',
      '9123456789',
      'Maruti',
      'Swift',
      'invoice',
      'WIP',
      'JC-PAT-202509-000040',
    ),
  ]

  const jobCards: JobCardItem[] = [
    {
      id: 'jc-1',
      jobCardNumber: 'JC-PAT-202509-000038',
      status: 'WIP',
      approvedValue: 12500,
      currentValue: 13200,
      visitId: 'sv-001',
      visitNumber: 'SV-202509-000042',
      registration: 'BR 01 AB 4521',
      vehicle: 'Honda City',
      customer: 'Amit Sharma',
      bay: 'Bay 3',
      advisor: 'Priya Singh',
      currentStage: 'wip',
    },
  ]

  return {
    customers: seedCustomers(),
    vehicles: seedVehicles(),
    bookings: seedBookings(),
    serviceVisits,
    jobCards,
    parts: [
      { id: 'p1', partNumber: 'BRK-PAD-001', description: 'Brake Pad Set', category: 'Brakes', brand: 'OEM', mrp: 2400 },
      { id: 'p2', partNumber: 'OIL-5W30', description: 'Engine Oil 5W30', category: 'Lubricants', brand: 'Castrol', mrp: 3200 },
    ],
    stock: [
      { id: 's1', partNumber: 'BRK-PAD-001', description: 'Brake Pad Set', warehouse: 'Main', available: 12, reserved: 2, reorderLevel: 5, lowStock: false },
      { id: 's2', partNumber: 'OIL-5W30', description: 'Engine Oil 5W30', warehouse: 'Main', available: 3, reserved: 0, reorderLevel: 10, lowStock: true },
    ],
    bays: [
      { id: 'b1', code: 'BAY-1', name: 'Bay 1', bayType: 'General', status: 'BUSY', jobCardNumber: 'JC-PAT-202509-000039', registration: 'BR 02 CD 7890', vehicle: 'Hyundai Creta' },
      { id: 'b2', code: 'BAY-3', name: 'Bay 3', bayType: 'General', status: 'BUSY', jobCardNumber: 'JC-PAT-202509-000038', registration: 'BR 01 AB 4521', vehicle: 'Honda City' },
      { id: 'b3', code: 'BAY-5', name: 'Bay 5', bayType: 'D&P', status: 'FREE' },
    ],
    branches: DEMO_BRANCHES.map((b) => ({ id: b.id, code: b.code, name: b.name, city: 'Patna', state: 'Bihar' })),
    users: [
      { id: 'u1', name: 'Rajesh Kumar', email: 'rajesh@demomotors.com', role: 'Workshop Manager', roleCode: 'MANAGER' },
      { id: 'u2', name: 'Priya Singh', email: 'priya@demomotors.com', role: 'Service Advisor', roleCode: 'ADVISOR' },
      { id: 'u3', name: 'Ravi Mehta', email: 'ravi@demomotors.com', role: 'Technician', roleCode: 'TECHNICIAN' },
    ],
    masters: seedMasters(),
    tenantProfile: {
      tenant: {
        id: 't1',
        code: 'DEMO-MOTORS',
        name: 'ZentroSure Demo Motors Pvt. Ltd.',
        legalName: 'ZentroSure Demo Motors Pvt. Ltd.',
        gstin: '10AABCD1234E1Z5',
        email: 'info@demomotors.com',
        phone: '9876543210',
        address: '123 MG Road',
        city: 'Patna',
        state: 'Bihar',
        pin: '800001',
      },
      branch: {
        id: '1',
        code: 'PAT-01',
        name: 'Patna Central Workshop',
        address: '123 MG Road',
        city: 'Patna',
        state: 'Bihar',
        pin: '800001',
        phone: '9876543210',
      },
    },
  }
}

export function loadDatabase(): LocalDatabase {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const seed = createSeedDatabase()
    localStorage.setItem(DB_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    return JSON.parse(raw) as LocalDatabase
  } catch {
    const seed = createSeedDatabase()
    localStorage.setItem(DB_KEY, JSON.stringify(seed))
    return seed
  }
}

export function saveDatabase(db: LocalDatabase): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function mutateDatabase(mutator: (db: LocalDatabase) => void): LocalDatabase {
  const db = loadDatabase()
  mutator(db)
  saveDatabase(db)
  return db
}

export const LOCAL_DEMO_CREDENTIALS = {
  tenantCode: 'DEMO-MOTORS',
  identifier: 'rajesh@demomotors.com',
  password: 'demo1234',
}

export function buildLoginUser() {
  return {
    id: 'u1',
    email: LOCAL_DEMO_CREDENTIALS.identifier,
    firstName: 'Rajesh',
    lastName: 'Kumar',
    role: 'Workshop Manager',
    roleCode: 'MANAGER',
    permissions: ['*'],
    tenant: { id: 't1', code: 'DEMO-MOTORS', name: 'ZentroSure Demo Motors Pvt. Ltd.' },
    branches: DEMO_BRANCHES.map((b) => ({ id: b.id, name: b.name, code: b.code })),
    defaultBranchId: '1',
  }
}

export function buildDashboardFromDb(db: LocalDatabase) {
  const kpis: Record<string, number> = {
    vehiclesIn: 24,
    todaysBookings: 18,
    wip: 12,
    awaitingApproval: 5,
    partsPending: 7,
    qcPending: 4,
    readyForDelivery: 6,
    revenueToday: 240000,
  }

  const wipVehicles = WIP_VEHICLES.map((v) => ({
    id: v.id === '1' ? 'sv-001' : `sv-wip-${v.id}`,
    registration: v.registration,
    model: v.model,
    jc: v.jc,
    status: v.status,
    ageing: v.ageing,
    reason: v.reason,
  }))

  const bookingsToday: DashboardDataBooking[] = db.bookings.slice(0, 6).map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    customer: b.customer?.name ?? '—',
    vehicle: b.vehicle?.registrationNo ?? '—',
    model: b.vehicle?.model ?? '—',
    service: b.serviceType ?? null,
    time: b.preferredSlot ?? '—',
    status: b.status,
  }))

  return {
    kpis,
    bookingsToday,
    wipVehicles,
    charts: {
      revenueTrend: REVENUE_CHART_DATA.map((r) => ({
        month: r.month,
        revenue: r.revenue,
        jobCards: r.jobCards,
      })),
      partsVsLabour: [
        { name: 'Parts', value: 45 },
        { name: 'Labour', value: 35 },
        { name: 'Consumables', value: 20 },
      ],
    },
  }
}

type DashboardDataBooking = {
  id: string
  bookingNumber: string
  customer: string
  vehicle: string
  model: string
  service: string | null
  time: string
  status: string
}

export function wipFromDb(db: LocalDatabase): WipItem[] {
  return db.serviceVisits
    .filter((v) => v.status === 'WIP' || v.currentStage === 'wip')
    .map((v) => ({
      id: v.id,
      visitNumber: v.visitNumber,
      registration: v.registrationNumber,
      model: `${v.make ?? ''} ${v.model ?? ''}`.trim(),
      jc: v.jobCardNumber,
      status: v.status,
      ageing: '4h 30m',
      reason: 'In workshop',
      promiseTime: v.promiseTime,
    }))
}

export function paginate<T>(items: T[], page = 1, limit = 50) {
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    pagination: { page, limit, total: items.length },
  }
}
