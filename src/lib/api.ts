const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

interface ApiOptions extends RequestInit {
  token?: string
  branchId?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, branchId, headers, ...rest } = options

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(branchId && { 'X-Branch-Id': branchId }),
      ...headers,
    },
  })

  const json: ApiResponse<T> = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Request failed')
  }

  return json.data as T
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string | null
    role: string | null
    roleCode: string | null
    permissions: string[]
    tenant: { id: string; code: string; name: string }
    branches: { id: string; name: string; code: string }[]
    defaultBranchId: string | null
  }
}

export interface DashboardData {
  kpis: Record<string, number>
  bookingsToday: Array<{
    id: string
    bookingNumber: string
    customer: string
    vehicle: string
    model: string
    service: string | null
    time: string
    status: string
  }>
  wipVehicles: Array<{
    id: string
    registration: string
    model: string
    jc: string | null
    status: string
    ageing?: string
    reason?: string
  }>
  charts: {
    revenueTrend: Array<{ month: string; revenue: number; jobCards: number }>
    partsVsLabour: Array<{ name: string; value: number }>
  }
}

export const authApi = {
  login: (body: { tenantCode: string; identifier: string; password: string; rememberMe?: boolean }) =>
    api<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: (token: string) => api<LoginResponse['user']>('/auth/me', { token }),

  logout: (token: string) => api<void>('/auth/logout', { method: 'POST', token }),
}

export const dashboardApi = {
  get: (token: string, branchId?: string) =>
    api<DashboardData>('/dashboard', { token, branchId }),
}

export interface CustomerItem {
  id: string
  code: string
  name: string
  mobile: string
  email?: string
  type: string
  city?: string
  vehicles: number
  lastVisit?: string
}

export interface VehicleItem {
  id: string
  registrationNo: string
  make: string
  model: string
  variant?: string
  customerId?: string
  customer?: { name: string; mobile?: string }
}

export interface BookingItem {
  id: string
  bookingNumber: string
  bookingDate: string
  serviceType?: string
  preferredSlot?: string
  status: string
  customer?: { name: string; mobile?: string }
  vehicle?: { registrationNo: string; make: string; model: string }
}

export interface BookingDetail {
  id: string
  bookingNumber: string
  bookingDate: string
  status: string
  serviceType?: string
  customerComplaint?: string
  preferredSlot?: string
  preferredDate?: string
  pickupRequired?: boolean
  pickupAddress?: string
  source?: string
  remarks?: string
  customer?: {
    id?: string
    name?: string
    mobile?: string
    email?: string
    address?: string
    city?: string
    state?: string
    pin?: string
    gstin?: string
  }
  vehicle?: {
    id?: string
    registrationNo?: string
    make?: string
    model?: string
    variant?: string
    vin?: string
    engineNo?: string
    fuelType?: string
    odometer?: number
  }
  branch?: {
    name?: string
    code?: string
    address?: string
    city?: string
    state?: string
    pin?: string
    phone?: string
  }
  serviceVisit?: { id: string; visitNumber: string } | null
}

export interface TenantProfile {
  tenant: {
    id: string
    code: string
    name: string
    legalName: string
    gstin: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    pin: string
  }
  branch: {
    id: string
    code: string
    name: string
    address: string
    city: string
    state: string
    pin: string
    phone: string
  } | null
}

export interface WipItem {
  id: string
  visitNumber: string
  registration: string
  model: string
  jc?: string
  bay?: string
  status: string
  ageing: string
  reason?: string
  promiseTime?: string
}

export interface MasterItem {
  id: string
  category: string
  code: string
  label: string
  parentCode?: string
  sortOrder?: number
}

export interface DropdownOption {
  value: string
  label: string
  parentCode?: string
}

export interface CustomerDetail extends Omit<CustomerItem, 'vehicles'> {
  alternateMobile?: string
  gstin?: string
  address?: string
  state?: string
  pin?: string
  vehicles?: VehicleItem[] | number
}

export const customersApi = {
  list: (token: string, params?: { search?: string; page?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    return api<{ items: CustomerItem[]; pagination: unknown }>(`/customers?${qs}`, { token, branchId })
  },

  get: (token: string, id: string, branchId?: string) =>
    api<CustomerDetail>(`/customers/${id}`, { token, branchId }),

  create: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<CustomerItem>('/customers', { method: 'POST', token, branchId, body: JSON.stringify(body) }),
}

export const vehiclesApi = {
  list: (token: string, params?: { search?: string; customerId?: string; page?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.customerId) qs.set('customerId', params.customerId)
    if (params?.page) qs.set('page', String(params.page))
    return api<{ items: VehicleItem[]; pagination: unknown }>(`/vehicles?${qs}`, { token, branchId })
  },

  create: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<VehicleItem>('/vehicles', { method: 'POST', token, branchId, body: JSON.stringify(body) }),
}

export const bookingsApi = {
  list: (token: string, branchId?: string, params?: { date?: string; status?: string }) => {
    const qs = new URLSearchParams()
    if (params?.date) qs.set('date', params.date)
    if (params?.status) qs.set('status', params.status)
    return api<{ items: BookingItem[]; pagination: unknown }>(`/bookings?${qs}`, { token, branchId })
  },

  get: (token: string, id: string, branchId?: string) =>
    api<BookingDetail>(`/bookings/${id}`, { token, branchId }),

  create: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<BookingItem>('/bookings', { method: 'POST', token, branchId, body: JSON.stringify(body) }),

  createVisitFromBooking: (token: string, bookingId: string, branchId?: string) =>
    api<ServiceVisitDetail>(`/service-visits/from-booking/${bookingId}`, { method: 'POST', token, branchId }),
}

export const tenantApi = {
  profile: (token: string, branchId?: string) =>
    api<TenantProfile>('/tenant/profile', { token, branchId }),
}

export interface ServiceVisitDetail {
  id: string
  visitNumber: string
  registrationNumber: string
  customerName: string
  customerMobile: string
  make?: string
  model?: string
  variant?: string
  vin?: string
  engineNo?: string
  jobCardNumber?: string
  advisor?: string
  status: string
  currentStage: string
  promiseTime?: string
  outstanding: number
  odometer?: number
  fuel?: string
  stages: Array<{
    id: string
    label: string
    status: string
    path?: string
  }>
}

export interface ServiceVisitListItem extends ServiceVisitDetail {}

export interface JobCardItem {
  id: string
  jobCardNumber: string
  jobType?: string
  status: string
  approvedValue: number
  currentValue: number
  promiseDate?: string
  visitId?: string
  visitNumber?: string
  registration: string
  vehicle: string
  customer: string
  bay: string
  advisor: string
  currentStage?: string
}

export interface PartItem {
  id: string
  partNumber: string
  description: string
  category?: string
  brand?: string
  mrp?: number
}

export interface StockItem {
  id: string
  partNumber: string
  description: string
  warehouse: string
  available: number
  reserved: number
  reorderLevel: number
  lowStock: boolean
}

export interface BayItem {
  id: string
  code: string
  name: string
  bayType: string
  status: string
  jobCardNumber?: string
  registration?: string
  vehicle?: string
}

export interface BranchItem {
  id: string
  code: string
  name: string
  city?: string
  state?: string
}

export interface UserItem {
  id: string
  name: string
  email: string
  role: string
  roleCode?: string
}

export interface SearchResultItem {
  id: string
  type: string
  label: string
  sublabel: string
  path: string
}

export const serviceVisitsApi = {
  list: (token: string, params?: { search?: string; stage?: string; outstandingOnly?: boolean; page?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.stage) qs.set('stage', params.stage)
    if (params?.outstandingOnly) qs.set('outstandingOnly', 'true')
    if (params?.page) qs.set('page', String(params.page))
    return api<{ items: ServiceVisitListItem[]; pagination: unknown }>(`/service-visits?${qs}`, { token, branchId })
  },

  get: (token: string, id: string, branchId?: string) =>
    api<ServiceVisitDetail>(`/service-visits/${id}`, { token, branchId }),

  update: (token: string, id: string, body: Record<string, unknown>, branchId?: string) =>
    api<ServiceVisitDetail>(`/service-visits/${id}`, { method: 'PATCH', token, branchId, body: JSON.stringify(body) }),

  wip: (token: string, branchId?: string) =>
    api<WipItem[]>('/service-visits/wip', { token, branchId }),

  advanceStage: (token: string, id: string, stage: string, branchId?: string) =>
    api<ServiceVisitDetail>(`/service-visits/${id}/advance-stage`, {
      method: 'PATCH',
      token,
      branchId,
      body: JSON.stringify({ stage }),
    }),
}

export const jobCardsApi = {
  list: (token: string, params?: { search?: string; status?: string }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.status) qs.set('status', params.status)
    return api<{ items: JobCardItem[]; pagination: unknown }>(`/job-cards?${qs}`, { token, branchId })
  },

  byVisit: (token: string, visitId: string, branchId?: string) =>
    api<JobCardItem | null>(`/job-cards/by-visit/${visitId}`, { token, branchId }),
}

export const partsApi = {
  list: (token: string, params?: { search?: string }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    return api<{ items: PartItem[]; pagination: unknown }>(`/parts?${qs}`, { token, branchId })
  },

  stock: (token: string, params?: { search?: string }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    return api<{ items: StockItem[]; pagination: unknown }>(`/parts/stock?${qs}`, { token, branchId })
  },

  dashboard: (token: string, branchId?: string) =>
    api<{ totalParts: number; warehouses: number; lowStockCount: number; stockValue: number }>(
      '/parts/dashboard',
      { token, branchId },
    ),
}

export const baysApi = {
  list: (token: string, branchId?: string) => api<BayItem[]>('/bays', { token, branchId }),
}

export const branchesApi = {
  list: (token: string, branchId?: string) => api<BranchItem[]>('/branches', { token, branchId }),
}

export const usersApi = {
  list: (token: string, branchId?: string) => api<UserItem[]>('/users', { token, branchId }),
  technicians: (token: string, branchId?: string) => api<UserItem[]>('/users/technicians', { token, branchId }),
}

export const searchApi = {
  global: (token: string, q: string, branchId?: string) =>
    api<{
      customers: SearchResultItem[]
      vehicles: SearchResultItem[]
      bookings: SearchResultItem[]
      serviceVisits: SearchResultItem[]
      jobCards: SearchResultItem[]
    }>(`/search?q=${encodeURIComponent(q)}`, { token, branchId }),
}

export const mastersApi = {
  listByCategory: (token: string, category: string, branchId?: string) =>
    api<MasterItem[]>(`/masters/${category}`, { token, branchId }),

  dropdown: (token: string, category: string, parentCode?: string, branchId?: string) => {
    const qs = parentCode ? `?parentCode=${encodeURIComponent(parentCode)}` : ''
    return api<DropdownOption[]>(`/masters/dropdown/${category}${qs}`, { token, branchId })
  },

  create: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<MasterItem>('/masters', { method: 'POST', token, branchId, body: JSON.stringify(body) }),

  deactivate: (token: string, id: string, branchId?: string) =>
    api<{ id: string; deactivated: boolean }>(`/masters/${id}`, { method: 'DELETE', token, branchId }),
}

export interface UploadResult {
  id: string
  url: string
  publicId: string
  format?: string
  width?: number
  height?: number
  bytes?: number
}

export async function uploadImage(
  token: string,
  file: File,
  options?: { entityType?: string; entityId?: string; folder?: string },
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.entityType) formData.append('entityType', options.entityType)
  if (options?.entityId) formData.append('entityId', options.entityId)
  if (options?.folder) formData.append('folder', options.folder)

  const res = await fetch(`${API_BASE}/uploads/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Upload failed')
  }
  return json.data as UploadResult
}

export async function uploadInspectionPhotos(
  token: string,
  serviceVisitId: string,
  files: File[],
  caption?: string,
): Promise<UploadResult[]> {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  if (caption) formData.append('caption', caption)

  const res = await fetch(`${API_BASE}/uploads/service-visits/${serviceVisitId}/inspection`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Upload failed')
  }
  return json.data as UploadResult[]
}
