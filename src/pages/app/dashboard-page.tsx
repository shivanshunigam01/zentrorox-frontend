import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Car, Calendar, Wrench, Clock, Package, CheckCircle, Truck, IndianRupee,
  TrendingUp, ArrowRight, Sparkles, User, MapPin, BarChart3,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { dashboardApi, type DashboardData } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { IMAGES, AVATARS } from '@/lib/assets'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car, Calendar, Wrench, Clock, Package, CheckCircle, Truck, IndianRupee,
}

const kpiGradients = [
  'from-yellow-50 to-amber-50',
  'from-blue-50 to-indigo-50',
  'from-green-50 to-emerald-50',
  'from-purple-50 to-violet-50',
  'from-orange-50 to-red-50',
  'from-cyan-50 to-teal-50',
  'from-pink-50 to-rose-50',
  'from-slate-50 to-gray-50',
]

const KPI_CONFIG = [
  { key: 'vehiclesIn', label: 'Vehicles In', icon: 'Car' },
  { key: 'todaysBookings', label: "Today's Bookings", icon: 'Calendar' },
  { key: 'wip', label: 'WIP', icon: 'Wrench' },
  { key: 'awaitingApproval', label: 'Awaiting Approval', icon: 'Clock' },
  { key: 'partsPending', label: 'Parts Pending', icon: 'Package' },
  { key: 'qcPending', label: 'QC Pending', icon: 'CheckCircle' },
  { key: 'readyForDelivery', label: 'Ready for Delivery', icon: 'Truck' },
  { key: 'revenueToday', label: 'Revenue Today', icon: 'IndianRupee', format: 'currency' },
] as const

const PIE_COLORS = ['#FFC400', '#171717', '#6B7280']

function formatKpiValue(key: string, value: number) {
  if (key === 'revenueToday' || key === 'mtdRevenue') {
    return value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : `₹${value.toLocaleString('en-IN')}`
  }
  return value
}

export function DashboardPage() {
  const user = authStorage.getUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authStorage.getToken()
    const branchId = authStorage.getBranchId() ?? undefined
    if (!token) return
    dashboardApi.get(token, branchId).then(setData).finally(() => setLoading(false))
  }, [])

  const revenueTrend = data?.charts.revenueTrend ?? []
  const partsVsLabour = (data?.charts.partsVsLabour ?? []).map((item, i) => ({
    ...item,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))
  const wipVehicles = data?.wipVehicles ?? []
  const bookingsToday = data?.bookingsToday ?? []
  const branchName = user?.branches.find((b) => b.id === authStorage.getBranchId())?.name ?? user?.branches[0]?.name

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-charcoal to-brand-charcoal-light p-6 text-white">
        <img
          src={IMAGES.heroWorkshop}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-brand-yellow" />
              <span className="text-sm text-brand-yellow font-medium">Good morning, {user?.firstName ?? 'User'}!</span>
            </div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-white/60 mt-0.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {branchName ?? 'Workshop'} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <Button asChild className="shadow-lg">
            <Link to="/app/workshop/bookings">
              <Calendar className="h-4 w-4" /> + New Booking
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CONFIG.map((kpi, i) => {
          const Icon = iconMap[kpi.icon]
          const raw = data?.kpis[kpi.key] ?? 0
          const value = 'format' in kpi && kpi.format === 'currency' ? formatKpiValue(kpi.key, Number(raw)) : raw
          return (
            <Card key={kpi.label} className={`hover:shadow-[var(--shadow-card-hover)] transition-all hover:-translate-y-0.5 bg-gradient-to-br ${kpiGradients[i % kpiGradients.length]} border-0`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-brand-muted">{kpi.label}</p>
                    <p className="text-2xl font-bold text-brand-charcoal mt-1">{loading ? '—' : value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                    <Icon className="h-5 w-5 text-brand-charcoal" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-yellow" />
              Revenue Trend
            </CardTitle>
            <Badge variant="success">+12% vs last month</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC400" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFC400" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#FFC400" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-brand-yellow" />
              Parts vs Labour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={partsVsLabour}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {partsVsLabour.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {partsVsLabour.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-brand-muted">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WIP + Bookings */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-brand-yellow" />
              WIP Control Tower
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/workshop/wip">View All <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-grey/50">
                    <th className="text-left px-5 py-3 font-medium text-brand-muted">Registration</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Model</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Status</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Bay</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Ageing</th>
                    <th className="text-left px-3 py-3 font-medium text-brand-muted">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {wipVehicles.map((v) => (
                    <tr key={v.id} className="border-b border-brand-border hover:bg-brand-grey/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/app/service-visits/${v.id}/wip`} className="flex items-center gap-2 font-medium text-brand-charcoal hover:text-brand-yellow">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-yellow/15">
                            <Car className="h-4 w-4" />
                          </div>
                          {v.registration}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-brand-muted">{v.model}</td>
                      <td className="px-3 py-3"><Badge variant={
                        v.status === 'WIP' ? 'default' : v.status.includes('Pending') ? 'warning' : 'info'
                      }>{v.status}</Badge></td>
                      <td className="px-3 py-3 text-brand-muted">—</td>
                      <td className="px-3 py-3 text-brand-muted">{v.ageing ?? '—'}</td>
                      <td className="px-3 py-3 text-brand-muted">{v.reason ?? v.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-yellow" />
              Today&apos;s Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookingsToday.map((b, i) => (
              <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl bg-brand-grey/50 hover:bg-brand-yellow/10 transition-colors">
                <img
                  src={AVATARS[i % AVATARS.length]}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-charcoal truncate flex items-center gap-1.5">
                    <User className="h-3 w-3 text-brand-muted" />
                    {b.customer}
                  </p>
                  <p className="text-xs text-brand-muted flex items-center gap-1 mt-0.5">
                    <Car className="h-3 w-3" /> {b.vehicle} — {b.service ?? 'Service'}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {b.time}
                  </p>
                </div>
                <Badge variant={b.status === 'CONFIRMED' ? 'success' : b.status === 'RESCHEDULED' ? 'warning' : 'secondary'}>
                  {b.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'New Booking', emoji: '📅', path: '/app/workshop/bookings', color: 'from-blue-500 to-indigo-600' },
          { label: 'WIP Board', emoji: '⚡', path: '/app/workshop/wip', color: 'from-brand-charcoal to-slate-700' },
          { label: 'Add Customer', emoji: '👤', path: '/app/crm/customers', color: 'from-violet-500 to-purple-600' },
          { label: 'Parts Stock', emoji: '📦', path: '/app/parts/stock', color: 'from-amber-500 to-orange-600' },
        ].map((action) => (
          <Link key={action.label} to={action.path}>
            <Card className="group card-shine hover:shadow-[var(--shadow-card-hover)] transition-all hover:-translate-y-0.5 overflow-hidden border-0">
              <CardContent className={`p-4 bg-gradient-to-br ${action.color} text-white relative`}>
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">{action.emoji}</span>
                <p className="font-semibold text-sm">{action.label}</p>
                <ArrowRight className="h-4 w-4 mt-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Job Cards Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-yellow" />
            Monthly Job Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="jobCards" fill="#171717" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
