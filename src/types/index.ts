export type WorkflowStageStatus = 'not_started' | 'current' | 'completed' | 'on_hold' | 'rejected' | 'skipped'

export interface WorkflowStage {
  id: string
  label: string
  status: WorkflowStageStatus
  path?: string
}

export interface ServiceVisit {
  id: string
  visitNumber: string
  registrationNumber: string
  customerName: string
  customerMobile: string
  make: string
  model: string
  variant: string
  vin: string
  engineNumber: string
  odometer: number
  fuel: string
  jobCardNumber?: string
  advisor: string
  status: string
  promiseTime?: string
  outstanding: number
  currentStage: string
  stages: WorkflowStage[]
}

export interface NavItem {
  label: string
  path?: string
  icon?: string
  children?: NavItem[]
}

export interface KpiCard {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  branch: string
  tenant: string
  avatar?: string
}

export interface Branch {
  id: string
  name: string
  code: string
}
