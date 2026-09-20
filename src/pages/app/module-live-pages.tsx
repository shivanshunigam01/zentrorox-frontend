import { Wrench, Package, LayoutGrid, Users, BarChart3, Settings, ShoppingCart, Receipt, CreditCard } from 'lucide-react'
import { LiveTablePage } from './live-table-page'
import {
  jobCardsApi, partsApi, baysApi, usersApi, branchesApi,
  serviceVisitsApi, dashboardApi,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export function JobCardsLivePage() {
  return (
    <LiveTablePage
      title="Job Cards"
      description="Live job cards linked to service visits"
      icon={Wrench}
      gradient="from-brand-charcoal to-brand-charcoal-light"
      emoji="🔧"
      columns={[
        { key: 'jobCardNumber', label: 'Job Card #' },
        { key: 'registration', label: 'Registration' },
        { key: 'customer', label: 'Customer' },
        { key: 'bay', label: 'Bay' },
        { key: 'status', label: 'Status' },
        { key: 'currentValue', label: 'Value', render: (v) => formatCurrency(Number(v ?? 0)) },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await jobCardsApi.list(token, { search }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
      getViewLink={(row) => row.visitId ? `/app/service-visits/${row.visitId}/job-card` : null}
    />
  )
}

export function PartsMasterLivePage() {
  return (
    <LiveTablePage
      title="Parts Master"
      description="Spare parts catalog from MongoDB"
      icon={Package}
      gradient="from-purple-600 to-indigo-700"
      emoji="🗂️"
      columns={[
        { key: 'partNumber', label: 'Part #' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'brand', label: 'Brand' },
        { key: 'mrp', label: 'MRP', render: (v) => formatCurrency(Number(v ?? 0)) },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await partsApi.list(token, { search }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
    />
  )
}

export function PartsStockLivePage() {
  return (
    <LiveTablePage
      title="Stock"
      description="Current stock balances by warehouse"
      icon={Package}
      gradient="from-orange-600 to-amber-700"
      emoji="📦"
      columns={[
        { key: 'partNumber', label: 'Part #' },
        { key: 'description', label: 'Description' },
        { key: 'warehouse', label: 'Warehouse' },
        { key: 'available', label: 'Available' },
        { key: 'reserved', label: 'Reserved' },
        {
          key: 'lowStock',
          label: 'Alert',
          render: (v) => v ? <Badge variant="warning">Low Stock</Badge> : <Badge variant="success">OK</Badge>,
        },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await partsApi.stock(token, { search }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
    />
  )
}

export function PartsDashboardLivePage() {
  return (
    <LiveTablePage
      title="Parts Dashboard"
      description="Inventory overview and low-stock alerts"
      icon={Package}
      gradient="from-amber-600 to-yellow-600"
      emoji="📦"
      columns={[
        { key: 'partNumber', label: 'Part #' },
        { key: 'description', label: 'Description' },
        { key: 'available', label: 'Available' },
        { key: 'reorderLevel', label: 'Reorder Level' },
      ]}
      loadRows={async (token, branchId) => {
        const [dash, stock] = await Promise.all([
          partsApi.dashboard(token, branchId),
          partsApi.stock(token, {}, branchId),
        ])
        const low = stock.items.filter((s) => s.lowStock)
        return low.length > 0
          ? low as unknown as Record<string, unknown>[]
          : [{ id: 'summary', partNumber: 'Summary', description: `${dash.totalParts} parts · ${dash.lowStockCount} low stock`, available: dash.stockValue, reorderLevel: dash.warehouses }] as Record<string, unknown>[]
      }}
    />
  )
}

export function BayBoardLivePage() {
  return (
    <LiveTablePage
      title="Bay Board"
      description="Live bay occupancy from workshop floor"
      icon={LayoutGrid}
      gradient="from-teal-600 to-cyan-700"
      emoji="🅿️"
      columns={[
        { key: 'name', label: 'Bay' },
        { key: 'bayType', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'registration', label: 'Vehicle' },
        { key: 'jobCardNumber', label: 'Job Card' },
      ]}
      loadRows={async (token, branchId) => {
        const bays = await baysApi.list(token, branchId)
        return bays as unknown as Record<string, unknown>[]
      }}
      getViewLink={(row) => row.visitId ? `/app/service-visits/${row.visitId}/bay` : null}
    />
  )
}

export function TechnicianBoardLivePage() {
  return (
    <LiveTablePage
      title="Technician Board"
      description="Workshop staff from tenant user directory"
      icon={Users}
      gradient="from-orange-600 to-red-600"
      emoji="👷"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
      ]}
      loadRows={async (token, branchId) => {
        const users = await usersApi.technicians(token, branchId)
        return users as unknown as Record<string, unknown>[]
      }}
    />
  )
}

export function WorkshopFloorLivePage() {
  return (
    <LiveTablePage
      title="Workshop Floor"
      description="All vehicles currently in workshop pipeline"
      icon={Wrench}
      gradient="from-indigo-600 to-violet-700"
      emoji="🏭"
      columns={[
        { key: 'visitNumber', label: 'Visit #' },
        { key: 'registrationNumber', label: 'Registration' },
        { key: 'currentStage', label: 'Stage' },
        { key: 'status', label: 'Status' },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await serviceVisitsApi.list(token, { search, page: 1 }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
      getViewLink={(row) => `/app/service-visits/${row.id}/wip`}
    />
  )
}

export function PurchaseRequisitionLivePage() {
  return (
    <LiveTablePage
      title="Purchase Requisition"
      description="Auto-generated from low-stock parts"
      icon={ShoppingCart}
      gradient="from-blue-600 to-cyan-700"
      emoji="📝"
      columns={[
        { key: 'partNumber', label: 'Part #' },
        { key: 'description', label: 'Description' },
        { key: 'available', label: 'Available' },
        { key: 'reorderLevel', label: 'Required Qty' },
      ]}
      loadRows={async (token, branchId) => {
        const stock = await partsApi.stock(token, {}, branchId)
        return stock.items.filter((s) => s.lowStock) as unknown as Record<string, unknown>[]
      }}
    />
  )
}

export function OutstandingLivePage() {
  return (
    <LiveTablePage
      title="Outstanding"
      description="Service visits with pending payment"
      icon={CreditCard}
      gradient="from-emerald-600 to-green-700"
      emoji="💳"
      columns={[
        { key: 'visitNumber', label: 'Visit #' },
        { key: 'registrationNumber', label: 'Registration' },
        { key: 'customerName', label: 'Customer' },
        { key: 'outstanding', label: 'Outstanding', render: (v) => formatCurrency(Number(v ?? 0)) },
        { key: 'currentStage', label: 'Stage' },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await serviceVisitsApi.list(token, { search, outstandingOnly: true }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
      getViewLink={(row) => `/app/service-visits/${row.id}/invoice`}
    />
  )
}

export function ReportsLivePage() {
  return (
    <LiveTablePage
      title="Report Centre"
      description="Live KPI snapshot from dashboard API"
      icon={BarChart3}
      gradient="from-brand-charcoal to-slate-800"
      emoji="📊"
      columns={[
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' },
      ]}
      loadRows={async (token, branchId) => {
        const dash = await dashboardApi.get(token, branchId)
        return Object.entries(dash.kpis).map(([metric, value]) => ({
          id: metric,
          metric: metric.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          value: typeof value === 'number' && metric.toLowerCase().includes('revenue')
            ? formatCurrency(value)
            : value,
        }))
      }}
    />
  )
}

export function AdminLivePage() {
  return (
    <LiveTablePage
      title="Administration"
      description="Tenant users and roles"
      icon={Settings}
      gradient="from-zinc-700 to-neutral-900"
      emoji="🔐"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
      ]}
      loadRows={async (token, branchId) => {
        const users = await usersApi.list(token, branchId)
        return users as unknown as Record<string, unknown>[]
      }}
    />
  )
}

export function SettingsLivePage() {
  return (
    <LiveTablePage
      title="Settings"
      description="Branch configuration"
      icon={Settings}
      gradient="from-gray-600 to-slate-800"
      emoji="🎛️"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Branch Name' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
      ]}
      loadRows={async (token, branchId) => {
        const branches = await branchesApi.list(token, branchId)
        return branches as unknown as Record<string, unknown>[]
      }}
    />
  )
}

export function BillingInvoicesLivePage() {
  return (
    <LiveTablePage
      title="Invoices"
      description="Vehicles at invoice stage"
      icon={Receipt}
      gradient="from-emerald-600 to-green-700"
      emoji="🧾"
      columns={[
        { key: 'visitNumber', label: 'Visit #' },
        { key: 'registrationNumber', label: 'Registration' },
        { key: 'customerName', label: 'Customer' },
        { key: 'outstanding', label: 'Amount', render: (v) => formatCurrency(Number(v ?? 0)) },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await serviceVisitsApi.list(token, { stage: 'INVOICE', search }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
      getViewLink={(row) => `/app/service-visits/${row.id}/invoice`}
    />
  )
}

export function BillingReceiptsLivePage() {
  return (
    <LiveTablePage
      title="Receipts"
      description="Vehicles at payment stage"
      icon={Receipt}
      gradient="from-teal-600 to-emerald-700"
      emoji="💳"
      columns={[
        { key: 'visitNumber', label: 'Visit #' },
        { key: 'registrationNumber', label: 'Registration' },
        { key: 'customerName', label: 'Customer' },
        { key: 'status', label: 'Status' },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await serviceVisitsApi.list(token, { stage: 'PAYMENT', search }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
      getViewLink={(row) => `/app/service-visits/${row.id}/payment`}
    />
  )
}

export function GenericPartsModulePage({ title, description }: { title: string; description: string }) {
  return (
    <LiveTablePage
      title={title}
      description={description}
      icon={Package}
      gradient="from-blue-600 to-cyan-700"
      emoji="📦"
      columns={[
        { key: 'partNumber', label: 'Part #' },
        { key: 'description', label: 'Description' },
        { key: 'available', label: 'Qty' },
        { key: 'warehouse', label: 'Warehouse' },
      ]}
      loadRows={async (token, branchId, search) => {
        const res = await partsApi.stock(token, { search }, branchId)
        return res.items as unknown as Record<string, unknown>[]
      }}
    />
  )
}

export function GenericPurchaseModulePage({ title, description }: { title: string; description: string }) {
  return (
    <LiveTablePage
      title={title}
      description={description}
      icon={ShoppingCart}
      gradient="from-violet-600 to-purple-700"
      emoji="🛒"
      columns={[
        { key: 'partNumber', label: 'Item' },
        { key: 'description', label: 'Description' },
        { key: 'available', label: 'Qty Needed' },
      ]}
      loadRows={async (token, branchId) => {
        const stock = await partsApi.stock(token, {}, branchId)
        return stock.items.filter((s) => s.lowStock) as unknown as Record<string, unknown>[]
      }}
    />
  )
}
