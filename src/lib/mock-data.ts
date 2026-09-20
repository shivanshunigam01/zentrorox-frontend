import type { Branch, KpiCard, ServiceVisit, User } from '@/types'
import { WORKFLOW_STAGES } from './constants'

export const DEMO_USER: User = {
  id: '1',
  name: 'Rajesh Kumar',
  email: 'rajesh@demomotors.com',
  role: 'Workshop Manager',
  branch: 'Patna Central Workshop',
  tenant: 'ZentroSure Demo Motors Pvt. Ltd.',
}

export const DEMO_BRANCHES: Branch[] = [
  { id: '1', name: 'Patna Central Workshop', code: 'PAT-01' },
  { id: '2', name: 'Muzaffarpur Workshop', code: 'MUZ-01' },
  { id: '3', name: 'Ranchi Workshop', code: 'RAN-01' },
]

export const DEMO_SERVICE_VISIT: ServiceVisit = {
  id: 'sv-001',
  visitNumber: 'SV-202509-000042',
  registrationNumber: 'BR 01 AB 4521',
  customerName: 'Amit Sharma',
  customerMobile: '+91 98765 43210',
  make: 'Honda',
  model: 'City',
  variant: 'VX CVT',
  vin: 'MAHFR2WK5K1234567',
  engineNumber: 'L15Z1-7890123',
  odometer: 45230,
  fuel: 'Petrol — 3/4',
  jobCardNumber: 'JC-PAT-202509-000038',
  advisor: 'Priya Singh',
  status: 'WIP',
  promiseTime: '2025-09-20T18:00:00',
  outstanding: 0,
  currentStage: 'wip',
  stages: WORKFLOW_STAGES.map((stage, index) => ({
    ...stage,
    status:
      index < 12
        ? 'completed'
        : index === 12
          ? 'current'
          : 'not_started',
  })),
}

export const DASHBOARD_KPIS: KpiCard[] = [
  { label: 'Vehicles In', value: 24, change: '+3 today', trend: 'up', icon: 'Car' },
  { label: "Today's Bookings", value: 18, change: '6 confirmed', trend: 'neutral', icon: 'Calendar' },
  { label: 'WIP', value: 12, change: '2 overdue', trend: 'down', icon: 'Wrench' },
  { label: 'Awaiting Approval', value: 5, change: '₹1.2L pending', trend: 'neutral', icon: 'Clock' },
  { label: 'Parts Pending', value: 7, change: '3 critical', trend: 'down', icon: 'Package' },
  { label: 'QC Pending', value: 4, change: 'Ready soon', trend: 'neutral', icon: 'CheckCircle' },
  { label: 'Ready for Delivery', value: 6, change: '2 waiting payment', trend: 'up', icon: 'Truck' },
  { label: 'Revenue Today', value: '₹2.4L', change: '+12% vs yesterday', trend: 'up', icon: 'IndianRupee' },
]

export const WIP_VEHICLES = [
  {
    id: '1',
    registration: 'BR 01 AB 4521',
    model: 'Honda City VX',
    jc: 'JC-PAT-202509-000038',
    advisor: 'Priya Singh',
    technician: 'Ravi Mehta',
    bay: 'Bay 3',
    status: 'WIP',
    promiseTime: '6:00 PM',
    pendingSince: '2h 15m',
    ageing: '4h 30m',
    reason: 'Parts pending',
  },
  {
    id: '2',
    registration: 'BR 02 CD 7890',
    model: 'Hyundai Creta SX',
    jc: 'JC-PAT-202509-000039',
    advisor: 'Anil Verma',
    technician: 'Suresh Yadav',
    bay: 'Bay 1',
    status: 'Awaiting Approval',
    promiseTime: '5:30 PM',
    pendingSince: '45m',
    ageing: '1h 20m',
    reason: 'Customer approval',
  },
  {
    id: '3',
    registration: 'BR 03 EF 1234',
    model: 'Maruti Swift VDI',
    jc: 'JC-PAT-202509-000040',
    advisor: 'Priya Singh',
    technician: '—',
    bay: '—',
    status: 'QC Pending',
    promiseTime: '7:00 PM',
    pendingSince: '30m',
    ageing: '3h 10m',
    reason: 'Final QC',
  },
  {
    id: '4',
    registration: 'BR 04 GH 5678',
    model: 'Toyota Innova Crysta',
    jc: 'JC-PAT-202509-000041',
    advisor: 'Anil Verma',
    technician: 'Ravi Mehta',
    bay: 'Bay 5',
    status: 'Parts Pending',
    promiseTime: 'Tomorrow',
    pendingSince: '1h 10m',
    ageing: '5h 45m',
    reason: 'Brake pads unavailable',
  },
]

export const REVENUE_CHART_DATA = [
  { month: 'Apr', revenue: 820000, jobCards: 145 },
  { month: 'May', revenue: 910000, jobCards: 162 },
  { month: 'Jun', revenue: 880000, jobCards: 158 },
  { month: 'Jul', revenue: 950000, jobCards: 171 },
  { month: 'Aug', revenue: 1020000, jobCards: 185 },
  { month: 'Sep', revenue: 780000, jobCards: 142 },
]

export const BOOKINGS_TODAY = [
  { id: 'SB-202509-000045', customer: 'Vikram Patel', vehicle: 'BR 05 IJ 9012', service: 'Periodic Service', time: '10:00 AM', advisor: 'Priya Singh', status: 'Confirmed' },
  { id: 'SB-202509-000046', customer: 'Neha Gupta', vehicle: 'BR 06 KL 3456', service: 'AC Service', time: '11:30 AM', advisor: 'Anil Verma', status: 'Booked' },
  { id: 'SB-202509-000047', customer: 'Sanjay Mishra', vehicle: 'BR 07 MN 7890', service: 'Brake Inspection', time: '2:00 PM', advisor: 'Priya Singh', status: 'Confirmed' },
  { id: 'SB-202509-000048', customer: 'Pooja Sinha', vehicle: 'BR 08 OP 1234', service: 'Denting & Painting', time: '3:30 PM', advisor: 'Anil Verma', status: 'Rescheduled' },
]

export const CUSTOMERS = [
  { id: 'C001', code: 'CUS-00001', name: 'Amit Sharma', mobile: '9876543210', email: 'amit@email.com', vehicles: 2, lastVisit: '2025-09-15', type: 'Individual' },
  { id: 'C002', code: 'CUS-00002', name: 'Fleet Solutions Pvt Ltd', mobile: '9123456789', email: 'fleet@company.com', vehicles: 24, lastVisit: '2025-09-18', type: 'Fleet' },
  { id: 'C003', code: 'CUS-00003', name: 'Neha Gupta', mobile: '9988776655', email: 'neha@email.com', vehicles: 1, lastVisit: '2025-09-10', type: 'Individual' },
]

export const VEHICLES = [
  { id: 'V001', registration: 'BR 01 AB 4521', make: 'Honda', model: 'City', variant: 'VX CVT', year: 2021, fuel: 'Petrol', odometer: 45230, customer: 'Amit Sharma' },
  { id: 'V002', registration: 'BR 02 CD 7890', make: 'Hyundai', model: 'Creta', variant: 'SX', year: 2022, fuel: 'Diesel', odometer: 32100, customer: 'Amit Sharma' },
  { id: 'V003', registration: 'BR 06 KL 3456', make: 'Maruti', model: 'Swift', variant: 'VDI', year: 2020, fuel: 'Diesel', odometer: 67800, customer: 'Neha Gupta' },
]
