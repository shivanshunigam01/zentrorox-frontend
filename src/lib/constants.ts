import type { NavItem, WorkflowStage } from '@/types'

export const APP_NAME = 'ZENTROROX'

export const WORKFLOW_STAGES: Omit<WorkflowStage, 'status'>[] = [
  { id: 'booking', label: 'Booking', path: 'booking' },
  { id: 'pickup', label: 'Pickup', path: 'pickup' },
  { id: 'arrival', label: 'Arrival', path: 'gate-in' },
  { id: 'inventory', label: 'Inventory', path: 'receiving' },
  { id: 'inspection', label: 'VOC, Trial & Inspection', path: 'inspection' },
  { id: 'estimate', label: 'Estimate', path: 'estimate' },
  { id: 'approval', label: 'Approval', path: 'approval' },
  { id: 'job_card', label: 'Job Card', path: 'job-card' },
  { id: 'assignment', label: 'Assignment', path: 'assignment' },
  { id: 'bay', label: 'Bay', path: 'bay' },
  { id: 'wip', label: 'WIP', path: 'wip' },
  { id: 'qc', label: 'Final QC & Road Test', path: 'qc' },
  { id: 'invoice', label: 'Invoice', path: 'invoice' },
  { id: 'payment', label: 'Payment', path: 'payment' },
  { id: 'gatepass', label: 'Gatepass', path: 'gatepass' },
  { id: 'delivery', label: 'Delivery', path: 'delivery' },
  { id: 'feedback', label: 'Feedback', path: 'feedback' },
  { id: 'psf', label: 'PSF', path: 'psf' },
]

export const SIDEBAR_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
  {
    label: 'Workshop',
    icon: 'Wrench',
    children: [
      { label: 'Booking & Pickup', path: '/app/workshop/bookings' },
      { label: 'Vehicle Receiving', path: '/app/workshop/receiving-hub' },
      { label: 'VOC, Trial & Inspection', path: '/app/workshop/inspection' },
      { label: 'Estimates', path: '/app/workshop/estimates' },
      { label: 'Customer Approval', path: '/app/workshop/approvals' },
      { label: 'Job Cards', path: '/app/workshop/job-cards' },
      { label: 'Work in Progress', path: '/app/workshop/wip' },
      { label: 'Final QC & Road Test', path: '/app/workshop/qc' },
      { label: 'Billing & Delivery', path: '/app/workshop/billing-delivery' },
    ],
  },
  {
    label: 'Parts',
    icon: 'Package',
    children: [
      { label: 'Parts Dashboard', path: '/app/parts/dashboard' },
      { label: 'Parts Master', path: '/app/parts/master' },
      { label: 'Stock', path: '/app/parts/stock' },
      { label: 'Requisition', path: '/app/parts/requisition' },
      { label: 'Issue', path: '/app/parts/issue' },
      { label: 'Return', path: '/app/parts/return' },
      { label: 'OTC Sales', path: '/app/parts/otc-sales' },
      { label: 'Stock Transfer', path: '/app/parts/stock-transfer' },
      { label: 'Stock Adjustment', path: '/app/parts/stock-adjustment' },
      { label: 'Physical Verification', path: '/app/parts/physical-verification' },
    ],
  },
  {
    label: 'Purchase',
    icon: 'ShoppingCart',
    children: [
      { label: 'Purchase Requisition', path: '/app/purchase/requisition' },
      { label: 'RFQ', path: '/app/purchase/rfq' },
      { label: 'Purchase Order', path: '/app/purchase/purchase-order' },
      { label: 'GRN', path: '/app/purchase/grn' },
      { label: 'Purchase Return', path: '/app/purchase/return' },
      { label: 'Vendor Management', path: '/app/purchase/vendors' },
    ],
  },
  {
    label: 'Sales & Billing',
    icon: 'Receipt',
    children: [
      { label: 'Billing & Delivery', path: '/app/workshop/billing-delivery' },
      { label: 'Receipts', path: '/app/billing/receipts' },
      { label: 'Credit Notes', path: '/app/billing/credit-notes' },
      { label: 'Outstanding', path: '/app/billing/outstanding' },
    ],
  },
  {
    label: 'CRM',
    icon: 'Users',
    children: [
      { label: 'Customers', path: '/app/crm/customers' },
      { label: 'Vehicles', path: '/app/crm/vehicles' },
      { label: 'Leads', path: '/app/crm/leads' },
      { label: 'Follow-ups', path: '/app/crm/follow-ups' },
      { label: 'Feedback', path: '/app/crm/feedback' },
      { label: 'PSF', path: '/app/crm/psf' },
      { label: 'Complaints', path: '/app/crm/complaints' },
      { label: 'Service Reminders', path: '/app/crm/service-reminders' },
    ],
  },
  { label: 'Reports', path: '/app/reports', icon: 'BarChart3' },
  { label: 'Masters', path: '/app/masters', icon: 'Database' },
  { label: 'Administration', path: '/app/administration', icon: 'Settings' },
  { label: 'Settings', path: '/app/settings', icon: 'SlidersHorizontal' },
]

export const PUBLIC_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/features' },
  { label: 'Workshop', href: '/automotive-workshop-management-software' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]
