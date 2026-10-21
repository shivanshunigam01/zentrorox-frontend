import { authStorage } from './auth-storage'
import { getApiBaseUrl, isLocalApiEnabled } from './local-mode'
import { localApiRequest } from './local-api'

const API_BASE = getApiBaseUrl()

interface ApiOptions extends RequestInit {
  token?: string
  branchId?: string
  /** @internal skip refresh retry (prevents infinite loops) */
  _retry?: boolean
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
}

let refreshPromise: Promise<string | null> | null = null

/** Parse API JSON safely — avoids "Unexpected end of JSON input" when proxy/backend returns empty body. */
async function readApiJson<T>(res: Response): Promise<ApiResponse<T>> {
  const text = await res.text()
  if (!text.trim()) {
    const unavailable =
      res.status === 0 ||
      res.status === 502 ||
      res.status === 503 ||
      res.status === 504
    throw new Error(
      unavailable
        ? `Cannot reach the API at ${API_BASE}. Start the backend: cd Backend && npm run dev, then refresh this page.`
        : `Empty response from server (HTTP ${res.status}). Check that the backend is running.`,
    )
  }
  try {
    return JSON.parse(text) as ApiResponse<T>
  } catch {
    throw new Error(
      `Server returned non-JSON (HTTP ${res.status}). Is the backend running on port 3000?`,
    )
  }
}

function redirectToLogin() {
  authStorage.clear()
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login?session=expired'
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStorage.getRefreshToken()
  if (!refreshToken) return null

  if (isLocalApiEnabled()) {
    try {
      const data = await localApiRequest<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
      if (data?.accessToken) {
        authStorage.setToken(data.accessToken)
        return data.accessToken
      }
    } catch {
      return null
    }
    return null
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const json = await readApiJson<{ accessToken: string }>(res)
  if (!res.ok || !json.success || !json.data?.accessToken) {
    return null
  }

  authStorage.setToken(json.data.accessToken)
  return json.data.accessToken
}

async function ensureFreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

function buildAuthHeaders(
  token: string | undefined,
  branchId: string | undefined,
  headers: HeadersInit | undefined,
  jsonBody: boolean,
): HeadersInit {
  return {
    ...(jsonBody && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(branchId && { 'X-Branch-Id': branchId }),
    ...headers,
  }
}

async function fetchWithAuth(
  endpoint: string,
  options: ApiOptions = {},
): Promise<Response> {
  if (isLocalApiEnabled()) {
    throw new Error('fetchWithAuth must not run in local API mode')
  }

  const { token, branchId, headers, _retry, ...rest } = options
  const authToken = token ?? authStorage.getToken() ?? undefined
  const jsonBody = !(rest.body instanceof FormData)

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers: buildAuthHeaders(authToken, branchId, headers, jsonBody),
  })

  const isAuthRoute = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/refresh')
  if (res.status === 401 && authToken && !_retry && !isAuthRoute) {
    const newToken = await ensureFreshAccessToken()
    if (newToken) {
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...rest,
        headers: buildAuthHeaders(newToken, branchId, headers, jsonBody),
      })
    } else {
      redirectToLogin()
    }
  }

  return res
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  if (isLocalApiEnabled()) {
    const { token, branchId: _branchId, body, method, headers: _headers, _retry, ...rest } = options
    void _branchId
    void _headers
    void _retry
    void rest
    return localApiRequest<T>(endpoint, {
      method,
      body: typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined,
      token,
    })
  }

  const res = await fetchWithAuth(endpoint, options)
  const json = await readApiJson<T>(res)

  if (!res.ok || !json.success) {
    if (res.status === 401 && !endpoint.startsWith('/auth/')) {
      redirectToLogin()
    }
    throw new Error(json.error?.message || 'Request failed')
  }

  return json.data as T
}

/** Download or open a binary API response (e.g. PDF) with JWT auth. */
export async function downloadApiFile(
  endpoint: string,
  options: ApiOptions & { filename?: string; openInNewTab?: boolean } = {},
): Promise<void> {
  if (isLocalApiEnabled()) {
    throw new Error('Authenticated downloads require the remote API (disable local mode).')
  }
  const { filename, openInNewTab, ...rest } = options
  const res = await fetchWithAuth(endpoint, rest)
  if (!res.ok) {
    if (res.status === 401) redirectToLogin()
    let message = 'Download failed'
    try {
      const json = await readApiJson<unknown>(res)
      message = json.error?.message ?? message
    } catch {
      message = await res.text().catch(() => message)
    }
    throw new Error(message)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  if (openInNewTab) {
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
    return
  }
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? 'document.pdf'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
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

  refresh: (refreshToken: string) =>
    api<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      _retry: true,
    }),

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
  fuelType?: string
  engineNo?: string
  chassisNo?: string
  vin?: string
  imageUrl?: string
  imagePublicId?: string
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
  pickupRequired?: boolean
  customer?: { name: string; mobile?: string }
  vehicle?: { registrationNo: string; make: string; model: string }
}

export interface BookingDetail {
  id: string
  bookingNumber: string
  bookingDate: string
  status: string
  bookingType?: 'NORMAL' | 'BREAKDOWN_ON_SPOT'
  arrivalMethod?: 'SELF' | 'PICKUP'
  bookingCharge?: number
  customerPriority?: string
  breakdownDetails?: Record<string, unknown>
  serviceType?: string
  customerComplaint?: string
  preferredSlot?: string
  preferredDate?: string
  pickupRequired?: boolean
  pickupAddress?: string
  pickupLocationLat?: number
  pickupLocationLng?: number
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
    chassisNo?: string
    engineNo?: string
    fuelType?: string
    odometer?: number
    imageUrl?: string
    imagePublicId?: string
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

export type ListPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const customersApi = {
  list: (token: string, params?: { search?: string; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: CustomerItem[]; pagination: ListPagination }>(`/customers?${qs}`, { token, branchId })
  },

  get: (token: string, id: string, branchId?: string) =>
    api<CustomerDetail>(`/customers/${id}`, { token, branchId }),

  create: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<CustomerItem>('/customers', { method: 'POST', token, branchId, body: JSON.stringify(body) }),
}

export const vehiclesApi = {
  list: (token: string, params?: { search?: string; customerId?: string; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.customerId) qs.set('customerId', params.customerId)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: VehicleItem[]; pagination: ListPagination }>(`/vehicles?${qs}`, { token, branchId })
  },

  create: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<VehicleItem>('/vehicles', { method: 'POST', token, branchId, body: JSON.stringify(body) }),

  update: (token: string, id: string, body: Record<string, unknown>, branchId?: string) =>
    api<VehicleItem>(`/vehicles/${id}`, { method: 'PATCH', token, branchId, body: JSON.stringify(body) }),
}

export const bookingsApi = {
  list: (token: string, branchId?: string, params?: { date?: string; status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.date) qs.set('date', params.date)
    if (params?.status) qs.set('status', params.status)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: BookingItem[]; pagination: ListPagination }>(`/bookings?${qs}`, { token, branchId })
  },

  get: (token: string, id: string, branchId?: string) =>
    api<BookingDetail>(`/bookings/${id}`, { token, branchId }),

  create: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<BookingItem>('/bookings', { method: 'POST', token, branchId, body: JSON.stringify(body) }),

  update: (token: string, id: string, body: Record<string, unknown>, branchId?: string) =>
    api<BookingDetail>(`/bookings/${id}`, { method: 'PATCH', token, branchId, body: JSON.stringify(body) }),

  createVisitFromBooking: (token: string, bookingId: string, branchId?: string) =>
    api<ServiceVisitDetail>(`/service-visits/from-booking/${bookingId}`, { method: 'POST', token, branchId }),

  updateStatus: (token: string, id: string, status: string, branchId?: string) =>
    api<BookingDetail>(`/bookings/${id}/status`, {
      method: 'PATCH',
      token,
      branchId,
      body: JSON.stringify({ status }),
    }),
}

export interface PickupTaskItem {
  id: string
  status: string
  bookingId: string
  visitId: string | null
  driverId: string | null
  pickupAddress?: string
  booking?: { bookingNumber?: string; bookingType?: string; status?: string }
}

export const pickupsApi = {
  list: (token: string, params?: { status?: string; bookingType?: string }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.bookingType) qs.set('bookingType', params.bookingType)
    return api<{ items: PickupTaskItem[] }>(`/pickups?${qs}`, { token, branchId })
  },
  assign: (
    token: string,
    id: string,
    body: {
      driverId: string
      recoveryVehicleLabel?: string
      recoveryPartner?: string
      scheduledPickupTime?: string
      dispatchNotes?: string
    },
    branchId?: string,
  ) => api<PickupTaskItem>(`/pickups/${id}/assign`, { method: 'PATCH', token, branchId, body: JSON.stringify(body) }),
  updateStatus: (token: string, id: string, status: string, branchId?: string) =>
    api<PickupTaskItem>(`/pickups/${id}/status`, {
      method: 'PATCH',
      token,
      branchId,
      body: JSON.stringify({ status }),
    }),
}

export const receivingApi = {
  queue: (token: string, branchId?: string) =>
    api<{
      expectedArrivals: unknown[]
      activeVisits: unknown[]
      receivingInProgress: unknown[]
    }>('/receiving/queue', { token, branchId }),
  getByVisit: (token: string, visitId: string, branchId?: string) =>
    api<{ visit: unknown; receiving: Record<string, unknown> }>(`/receiving/by-visit/${visitId}`, { token, branchId }),
  getWorkspace: (token: string, visitId: string, branchId?: string) =>
    api<Record<string, unknown>>(`/receiving/by-visit/${visitId}/workspace`, { token, branchId }),
  saveDraft: (token: string, visitId: string, body: Record<string, unknown>, branchId?: string) =>
    api<{ id: string; receivingStatus: string }>(`/receiving/by-visit/${visitId}/draft`, {
      method: 'PUT',
      token,
      branchId,
      body: JSON.stringify(body),
    }),
  complete: (token: string, visitId: string, branchId?: string) =>
    api<{ id: string; receivingStatus: string }>(`/receiving/by-visit/${visitId}/complete`, {
      method: 'POST',
      token,
      branchId,
    }),
}

export const vocApi = {
  get: (token: string, visitId: string, branchId?: string) =>
    api<{ id: string; complaints: unknown[]; confirmationStatus: string }>(`/voc/by-visit/${visitId}`, { token, branchId }),
  save: (token: string, visitId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/voc/by-visit/${visitId}`, { method: 'PUT', token, branchId, body: JSON.stringify(body) }),
  confirm: (token: string, visitId: string, branchId?: string) =>
    api<unknown>(`/voc/by-visit/${visitId}/confirm`, { method: 'POST', token, branchId }),
}

export const inspectionsApi = {
  dashboard: (token: string, branchId?: string) =>
    api<Record<string, number>>('/inspections/dashboard', { token, branchId }),
  queue: (
    token: string,
    params?: { status?: string; search?: string; page?: number; limit?: number },
    branchId?: string,
  ) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: unknown[]; page: number; limit: number; total: number }>(
      `/inspections/queue?${qs}`,
      { token, branchId },
    )
  },
  inspectors: (token: string, vehicleCategory?: string, branchId?: string) => {
    const qs = vehicleCategory ? `?vehicleCategory=${encodeURIComponent(vehicleCategory)}` : ''
    return api<unknown[]>(`/inspections/inspectors${qs}`, { token, branchId })
  },
  get: (token: string, id: string, branchId?: string) =>
    api<Record<string, unknown>>(`/inspections/${id}`, { token, branchId }),
  assign: (token: string, id: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/inspections/${id}/assign`, { method: 'PATCH', token, branchId, body: JSON.stringify(body) }),
  start: (token: string, id: string, branchId?: string) =>
    api<unknown>(`/inspections/${id}/start`, { method: 'POST', token, branchId }),
  pause: (token: string, id: string, branchId?: string) =>
    api<unknown>(`/inspections/${id}/pause`, { method: 'POST', token, branchId }),
  resume: (token: string, id: string, branchId?: string) =>
    api<unknown>(`/inspections/${id}/resume`, { method: 'POST', token, branchId }),
  saveTrial: (token: string, id: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/inspections/${id}/trial`, { method: 'PUT', token, branchId, body: JSON.stringify(body) }),
  saveChecklist: (token: string, id: string, responses: unknown[], branchId?: string) =>
    api<unknown>(`/inspections/${id}/checklist`, {
      method: 'PUT',
      token,
      branchId,
      body: JSON.stringify({ responses }),
    }),
  addFinding: (token: string, id: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/inspections/${id}/findings`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  submit: (token: string, id: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/inspections/${id}/submit`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  review: (token: string, id: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/inspections/${id}/review`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  report: (token: string, id: string, branchId?: string) =>
    api<Record<string, unknown>>(`/inspections/${id}/report`, { token, branchId }),
}

export const estimatesApi = {
  dashboard: (token: string, branchId?: string) =>
    api<Record<string, number>>('/estimates/dashboard', { token, branchId }),
  queue: (token: string, params?: { status?: string; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: unknown[]; page: number; limit: number; total: number }>(`/estimates/queue?${qs}`, { token, branchId })
  },
  fromInspection: (token: string, inspectionCaseId: string, branchId?: string) =>
    api<{ id: string; estimateNumber: string }>(`/estimates/from-inspection/${inspectionCaseId}`, {
      method: 'POST',
      token,
      branchId,
    }),
  get: (token: string, id: string, branchId?: string) =>
    api<Record<string, unknown>>(`/estimates/${id}`, { token, branchId }),
  saveDraft: (token: string, id: string, items: unknown[], version?: number, branchId?: string) =>
    api<{ totals: Record<string, number>; version: number }>(`/estimates/${id}/draft`, {
      method: 'PATCH',
      token,
      branchId,
      body: JSON.stringify({ items, version }),
    }),
  submitReview: (token: string, id: string, branchId?: string) =>
    api<unknown>(`/estimates/${id}/submit-review`, { method: 'POST', token, branchId }),
  internalApprove: (token: string, id: string, branchId?: string) =>
    api<unknown>(`/estimates/${id}/internal-approve`, { method: 'POST', token, branchId }),
  issue: (token: string, id: string, branchId?: string) =>
    api<unknown>(`/estimates/${id}/issue`, { method: 'POST', token, branchId }),
  customerDecision: (token: string, id: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/estimates/${id}/customer-decision`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  parts: (token: string, search?: string, branchId?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : ''
    return api<unknown[]>(`/estimates/parts${qs}`, { token, branchId })
  },
  pdfUrl: (id: string) => `/api/v1/estimates/${id}/pdf`,
  openPdf: (token: string, estimateId: string, branchId?: string) =>
    downloadApiFile(`/estimates/${estimateId}/pdf`, { token, branchId, openInNewTab: true, filename: 'estimate.pdf' }),
  jobCardHandoff: (token: string, id: string, branchId?: string) =>
    api<Record<string, unknown>>(`/estimates/${id}/job-card-handoff`, { token, branchId }),
}

export const approvalsApi = {
  dashboard: (token: string, branchId?: string) =>
    api<Record<string, number>>('/approvals/dashboard', { token, branchId }),
  queue: (token: string, params?: { tab?: string; search?: string; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.tab) qs.set('tab', params.tab)
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: unknown[]; page: number; limit: number; total: number; totalPages: number }>(`/approvals/queue?${qs}`, { token, branchId })
  },
  searchVehicle: (token: string, q: string, branchId?: string) =>
    api<{ vehicles: unknown[] }>(`/approvals/by-vehicle?q=${encodeURIComponent(q)}`, { token, branchId }),
  workspace: (token: string, visitId: string, branchId?: string) =>
    api<Record<string, unknown>>(`/approvals/by-visit/${visitId}`, { token, branchId }),
  recordDecision: (token: string, visitId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/approvals/by-visit/${visitId}/decision`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  authorizeJobCard: (token: string, visitId: string, branchId?: string) =>
    api<unknown>(`/approvals/financial-authorization/${visitId}/job-card`, { method: 'POST', token, branchId }),
}

export const paymentsApi = {
  listByVisit: (token: string, visitId: string, branchId?: string) =>
    api<unknown[]>(`/payments/by-visit/${visitId}`, { token, branchId }),
  createAdvance: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>('/payments/advances', { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  verifyAdvance: (token: string, id: string, branchId?: string) =>
    api<unknown>(`/payments/advances/${id}/verify`, { method: 'POST', token, branchId }),
  receiptPdfUrl: (receiptId: string) => `/api/v1/payments/receipts/${receiptId}/pdf`,
}

export const tenantApi = {
  profile: (token: string, branchId?: string) =>
    api<TenantProfile>('/tenant/profile', { token, branchId }),
}

export type PickupImageType =
  | 'FRONT' | 'REAR' | 'LEFT' | 'RIGHT' | 'STEPNEY' | 'INTERIOR' | 'OTHER_GOODS'

export interface PickupImageRecord {
  type: PickupImageType
  url: string
  publicId?: string
  caption?: string
  latitude?: number
  longitude?: number
  capturedAt: string
  uploadedAt?: string
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
  chassisNo?: string
  engineNo?: string
  vehicleImageUrl?: string
  vehicleImagePublicId?: string
  vehicleId?: string
  pickupRequired?: boolean
  pickupAddress?: string
  pickupLocationLat?: number
  pickupLocationLng?: number
  pickupExecutiveId?: string
  pickupExecutiveName?: string
  pickupAssignedAt?: string
  pickupCompletedAt?: string
  pickupImages?: PickupImageRecord[]
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

export interface ServiceVisitListItem extends ServiceVisitDetail {
  queueStageStatus?: string
  queueStageCompletedAt?: string
}

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
  list: (token: string, params?: { search?: string; stage?: string; outstandingOnly?: boolean; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.stage) qs.set('stage', params.stage)
    if (params?.outstandingOnly) qs.set('outstandingOnly', 'true')
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: ServiceVisitListItem[]; pagination: unknown }>(`/service-visits?${qs}`, { token, branchId })
  },

  get: (token: string, id: string, branchId?: string) =>
    api<ServiceVisitDetail>(`/service-visits/${id}`, { token, branchId }),

  phaseEligibility: (token: string, id: string, branchId?: string) =>
    api<{
      phase1State: string
      readyForInspection: boolean
      blockers: string[]
      receivingStatus: string | null
      vocConfirmationStatus: string | null
    }>(`/service-visits/${id}/phase-eligibility`, { token, branchId }),

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

  assignPickupExecutive: (token: string, id: string, executiveId: string, branchId?: string) =>
    api<ServiceVisitDetail>(`/service-visits/${id}/pickup/assign`, {
      method: 'PATCH',
      token,
      branchId,
      body: JSON.stringify({ executiveId }),
    }),

  addPickupImage: (
    token: string,
    id: string,
    body: {
      type: PickupImageType
      url: string
      publicId?: string
      caption?: string
      latitude?: number
      longitude?: number
      capturedAt: string
    },
    branchId?: string,
  ) =>
    api<ServiceVisitDetail>(`/service-visits/${id}/pickup/images`, {
      method: 'POST',
      token,
      branchId,
      body: JSON.stringify(body),
    }),

  completePickup: (token: string, id: string, branchId?: string) =>
    api<ServiceVisitDetail>(`/service-visits/${id}/pickup/complete`, {
      method: 'POST',
      token,
      branchId,
    }),
}

export const jobCardsApi = {
  dashboard: (token: string, branchId?: string) =>
    api<Record<string, number>>('/job-cards/dashboard', { token, branchId }),
  queue: (token: string, params?: { tab?: string; search?: string; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.tab) qs.set('tab', params.tab)
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: unknown[]; page: number; limit: number; total: number }>(`/job-cards/queue?${qs}`, { token, branchId })
  },
  list: (token: string, params?: { search?: string; status?: string; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.status) qs.set('status', params.status)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: JobCardItem[]; pagination: unknown }>(`/job-cards?${qs}`, { token, branchId })
  },
  createFromVisit: (token: string, visitId: string, branchId?: string, idempotencyKey?: string) =>
    api<unknown>(`/job-cards/from-visit/${visitId}`, {
      method: 'POST',
      token,
      branchId,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),
  workspace: (token: string, jobCardId: string, branchId?: string) =>
    api<Record<string, unknown>>(`/job-cards/${jobCardId}/workspace`, { token, branchId }),
  teams: (token: string, branchId?: string) =>
    api<unknown[]>('/job-cards/masters/teams', { token, branchId }),
  eligibleEmployees: (token: string, params?: { role?: string }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.role) qs.set('role', params.role)
    return api<unknown[]>(`/job-cards/masters/eligible-employees?${qs}`, { token, branchId })
  },
  createAssignment: (token: string, jobCardId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/job-cards/${jobCardId}/assignments`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  releaseAssignment: (token: string, jobCardId: string, assignmentId: string, branchId?: string) =>
    api<unknown>(`/job-cards/${jobCardId}/assignments/${assignmentId}/release`, { method: 'POST', token, branchId }),
  deliveryPlan: (token: string, jobCardId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/job-cards/${jobCardId}/delivery-plan`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  pdfUrl: (id: string) => `/api/v1/job-cards/${id}/pdf`,
  openPdf: (token: string, jobCardId: string, branchId?: string) =>
    downloadApiFile(`/job-cards/${jobCardId}/pdf`, { token, branchId, openInNewTab: true, filename: 'job-card.pdf' }),
  byVisit: (token: string, visitId: string, branchId?: string) =>
    api<JobCardItem | null>(`/job-cards/by-visit/${visitId}`, { token, branchId }),
}

export const billingApi = {
  dashboard: (token: string, branchId?: string) =>
    api<Record<string, number>>('/billing/dashboard', { token, branchId }),
  queue: (token: string, params?: { tab?: string; search?: string; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.tab) qs.set('tab', params.tab)
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: unknown[]; total: number; limit: number }>(`/billing/queue?${qs}`, { token, branchId })
  },
  visitWorkspace: (token: string, visitId: string, branchId?: string) =>
    api<Record<string, unknown>>(`/billing/visits/${visitId}/workspace`, { token, branchId }),
  reconciliation: (token: string, visitId: string, branchId?: string) =>
    api<Record<string, unknown>>(`/billing/visits/${visitId}/reconciliation`, { token, branchId }),
  resolveReconciliation: (token: string, visitId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/billing/visits/${visitId}/reconciliation/resolve`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  createDraft: (token: string, visitId: string, branchId?: string, idempotencyKey?: string) =>
    api<Record<string, unknown>>(`/billing/invoices/from-visit/${visitId}`, {
      method: 'POST',
      token,
      branchId,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),
  issue: (token: string, invoiceId: string, branchId?: string) =>
    api<unknown>(`/billing/invoices/${invoiceId}/issue`, { method: 'POST', token, branchId }),
  collectPayment: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>('/billing/payments/collect', { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  creditClearance: (token: string, invoiceId: string, branchId?: string, remarks?: string) =>
    api<unknown>(`/billing/invoices/${invoiceId}/credit-clearance`, {
      method: 'POST',
      token,
      branchId,
      body: JSON.stringify({ remarks }),
    }),
  createGatePass: (token: string, invoiceId: string, branchId?: string, idempotencyKey?: string) =>
    api<unknown>(`/billing/gate-passes/from-invoice/${invoiceId}`, {
      method: 'POST',
      token,
      branchId,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),
  completeDelivery: (token: string, deliveryId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/billing/deliveries/${deliveryId}/complete`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  openInvoicePdf: (token: string, invoiceId: string, branchId?: string) =>
    downloadApiFile(`/billing/invoices/${invoiceId}/pdf`, { token, branchId, openInNewTab: true, filename: 'tax-invoice.pdf' }),
  openRepairReportPdf: (token: string, invoiceId: string, branchId?: string) =>
    downloadApiFile(`/billing/invoices/${invoiceId}/repair-report`, { token, branchId, openInNewTab: true, filename: 'repair-report.pdf' }),
  issueGatePass: (token: string, gatePassId: string, branchId?: string) =>
    api<unknown>(`/billing/gate-passes/${gatePassId}/issue`, { method: 'POST', token, branchId }),
  createDelivery: (token: string, gatePassId: string, branchId?: string) =>
    api<unknown>(`/billing/deliveries/from-gate-pass/${gatePassId}`, { method: 'POST', token, branchId }),
  verifyPayment: (token: string, paymentId: string, branchId?: string) =>
    api<unknown>(`/billing/payments/${paymentId}/verify`, { method: 'POST', token, branchId }),
  sendEmail: (token: string, invoiceId: string, recipient: string, branchId?: string) =>
    api<unknown>(`/billing/invoices/${invoiceId}/send-email`, { method: 'POST', token, branchId, body: JSON.stringify({ recipient }) }),
  sendWhatsApp: (token: string, invoiceId: string, recipient: string, branchId?: string) =>
    api<unknown>(`/billing/invoices/${invoiceId}/send-whatsapp`, { method: 'POST', token, branchId, body: JSON.stringify({ recipient }) }),
  submitFeedback: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>('/billing/feedback', { method: 'POST', token, branchId, body: JSON.stringify(body) }),
}

export const razorpayApi = {
  createLink: (token: string, invoiceId: string, branchId?: string, idempotencyKey?: string) =>
    api<Record<string, unknown>>('/payments/razorpay/links', {
      method: 'POST',
      token,
      branchId,
      body: JSON.stringify({ invoiceId }),
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),
  refreshStatus: (token: string, paymentRequestId: string, branchId?: string) =>
    api<Record<string, unknown>>(`/payments/razorpay/links/${paymentRequestId}/status`, { token, branchId }),
  dashboard: (token: string, params?: { status?: string }, branchId?: string) => {
    const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : ''
    return api<{ items: unknown[] }>(`/payments/razorpay/dashboard${qs}`, { token, branchId })
  },
  sendLinkEmail: (token: string, paymentRequestId: string, recipient: string, branchId?: string) =>
    api<unknown>(`/payments/razorpay/links/${paymentRequestId}/send-email`, {
      method: 'POST',
      token,
      branchId,
      body: JSON.stringify({ recipient }),
    }),
  sendLinkWhatsApp: (token: string, paymentRequestId: string, recipient: string, branchId?: string) =>
    api<unknown>(`/payments/razorpay/links/${paymentRequestId}/send-whatsapp`, {
      method: 'POST',
      token,
      branchId,
      body: JSON.stringify({ recipient }),
    }),
  cancelLink: (token: string, paymentRequestId: string, reason?: string, branchId?: string) =>
    api<unknown>(`/payments/razorpay/links/${paymentRequestId}/cancel`, {
      method: 'POST',
      token,
      branchId,
      body: JSON.stringify({ reason }),
    }),
}

export const qcApi = {
  dashboard: (token: string, branchId?: string) =>
    api<Record<string, number>>('/qc/dashboard', { token, branchId }),
  queue: (token: string, params?: { tab?: string; search?: string; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.tab) qs.set('tab', params.tab)
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: unknown[]; page: number; limit: number; total: number }>(`/qc/queue?${qs}`, { token, branchId })
  },
  inspectors: (token: string, branchId?: string) =>
    api<unknown[]>('/qc/inspectors', { token, branchId }),
  workspace: (token: string, qcCaseId: string, branchId?: string) =>
    api<Record<string, unknown>>(`/qc/${qcCaseId}`, { token, branchId }),
  assign: (token: string, qcCaseId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/qc/${qcCaseId}/assign`, { method: 'PATCH', token, branchId, body: JSON.stringify(body) }),
  start: (token: string, qcCaseId: string, branchId?: string) =>
    api<unknown>(`/qc/${qcCaseId}/start`, { method: 'POST', token, branchId }),
  updateChecklist: (token: string, qcCaseId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/qc/${qcCaseId}/checklist`, { method: 'PUT', token, branchId, body: JSON.stringify(body) }),
  updateQuantity: (token: string, qcCaseId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/qc/${qcCaseId}/quantity-verification`, { method: 'PUT', token, branchId, body: JSON.stringify(body) }),
  updateVoc: (token: string, qcCaseId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/qc/${qcCaseId}/voc-verification`, { method: 'PUT', token, branchId, body: JSON.stringify(body) }),
  updateRoadTest: (token: string, qcCaseId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/qc/${qcCaseId}/road-test`, { method: 'PUT', token, branchId, body: JSON.stringify(body) }),
  pass: (token: string, qcCaseId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/qc/${qcCaseId}/pass`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  fail: (token: string, qcCaseId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/qc/${qcCaseId}/fail`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  pdfUrl: (id: string) => `/api/v1/qc/${id}/pdf`,
  openPdf: (token: string, qcCaseId: string, branchId?: string) =>
    downloadApiFile(`/qc/${qcCaseId}/pdf`, { token, branchId, openInNewTab: true, filename: 'qc-report.pdf' }),
}

export const wipApi = {
  dashboard: (token: string, branchId?: string) =>
    api<Record<string, number>>('/wip/dashboard', { token, branchId }),
  queue: (token: string, params?: { tab?: string; search?: string; page?: number; limit?: number }, branchId?: string) => {
    const qs = new URLSearchParams()
    if (params?.tab) qs.set('tab', params.tab)
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api<{ items: unknown[]; page: number; limit: number; total: number }>(`/wip/queue?${qs}`, { token, branchId })
  },
  workspace: (token: string, jobCardId: string, branchId?: string) =>
    api<Record<string, unknown>>(`/wip/by-job-card/${jobCardId}`, { token, branchId }),
  start: (token: string, jobCardId: string, branchId?: string) =>
    api<unknown>(`/wip/${jobCardId}/start`, { method: 'POST', token, branchId }),
  updateWorkItem: (token: string, jobCardId: string, itemId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/wip/${jobCardId}/work-items/${itemId}`, { method: 'PATCH', token, branchId, body: JSON.stringify(body) }),
  completeWorkItem: (token: string, jobCardId: string, itemId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/wip/${jobCardId}/work-items/${itemId}/complete`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  verifyWorkItem: (token: string, jobCardId: string, itemId: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>(`/wip/${jobCardId}/work-items/${itemId}/verify`, { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  submitCompletion: (token: string, jobCardId: string, branchId?: string) =>
    api<unknown>(`/wip/${jobCardId}/submit-completion`, { method: 'POST', token, branchId }),
  verifyCompletion: (token: string, jobCardId: string, branchId?: string) =>
    api<unknown>(`/wip/${jobCardId}/verify-completion`, { method: 'POST', token, branchId }),
  createRequisition: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>('/parts-requisitions', { method: 'POST', token, branchId, body: JSON.stringify(body) }),
  createAdditionalWork: (token: string, body: Record<string, unknown>, branchId?: string) =>
    api<unknown>('/additional-work', { method: 'POST', token, branchId, body: JSON.stringify(body) }),
}

export const partsApi = {
  warehouses: (token: string, branchId?: string) =>
    api<Array<{ id: string; code: string; name: string }>>('/parts/warehouses', { token, branchId }),
  list: (token: string, params?: { search?: string; limit?: number }, branchId?: string) => {
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
  options?: {
    entityType?: string
    entityId?: string
    folder?: string
    imageCategory?: string
    remarks?: string
  },
): Promise<UploadResult> {
  if (isLocalApiEnabled()) {
    const objectUrl = URL.createObjectURL(file)
    return localApiRequest<UploadResult>('/uploads/image', {
      method: 'POST',
      token,
    }).then((result) => ({ ...result, url: objectUrl }))
  }

  const formData = new FormData()
  formData.append('file', file)
  if (options?.entityType) formData.append('entityType', options.entityType)
  if (options?.entityId) formData.append('entityId', options.entityId)
  if (options?.folder) formData.append('folder', options.folder)
  if (options?.imageCategory) formData.append('imageCategory', options.imageCategory)
  if (options?.remarks) formData.append('remarks', options.remarks)

  const res = await fetchWithAuth('/uploads/image', {
    method: 'POST',
    token,
    body: formData,
  })

  const json = await readApiJson<UploadResult>(res)
  if (!res.ok || !json.success) {
    if (res.status === 401) redirectToLogin()
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
  if (isLocalApiEnabled()) {
    void caption
    return Promise.all(
      files.map(async (file) => {
        const objectUrl = URL.createObjectURL(file)
        const result = await localApiRequest<UploadResult[]>(
          `/uploads/service-visits/${serviceVisitId}/inspection`,
          { method: 'POST', token },
        )
        return { ...result[0], url: objectUrl }
      }),
    )
  }

  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  if (caption) formData.append('caption', caption)

  const res = await fetchWithAuth(`/uploads/service-visits/${serviceVisitId}/inspection`, {
    method: 'POST',
    token,
    body: formData,
  })

  const json = await readApiJson<UploadResult[]>(res)
  if (!res.ok || !json.success) {
    if (res.status === 401) redirectToLogin()
    throw new Error(json.error?.message || 'Upload failed')
  }
  return json.data as UploadResult[]
}
