import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, Plus, HelpCircle, ChevronDown, LogOut, User, Building2,
  Settings, Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AVATARS } from '@/lib/assets'
import { authStorage, type StoredUser } from '@/lib/auth-storage'
import { authApi, dashboardApi, searchApi, type SearchResultItem } from '@/lib/api'

export function TopBar() {
  const navigate = useNavigate()
  const [user, setUser] = useState<StoredUser | null>(authStorage.getUser())
  const [branchId, setBranchId] = useState(authStorage.getBranchId())
  const [showProfile, setShowProfile] = useState(false)
  const [showBranch, setShowBranch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; emoji: string; path: string }>>([])

  const branches = user?.branches ?? []
  const activeBranch = branches.find((b) => b.id === branchId) ?? branches[0]

  useEffect(() => {
    const token = authStorage.getToken()
    if (!token) return
    authApi.me(token).then((me) => {
      const stored: StoredUser = {
        id: me.id,
        email: me.email,
        firstName: me.firstName,
        lastName: me.lastName,
        role: me.role,
        tenant: me.tenant,
        branches: me.branches,
        defaultBranchId: me.defaultBranchId,
      }
      authStorage.setUser(stored)
      setUser(stored)
      if (!branchId && me.defaultBranchId) {
        authStorage.setBranchId(me.defaultBranchId)
        setBranchId(me.defaultBranchId)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const token = authStorage.getToken()
    if (!token) return
    dashboardApi.get(token, branchId ?? undefined).then((data) => {
      const items = [
        ...data.wipVehicles.slice(0, 2).map((v) => ({
          id: v.id,
          text: `${v.registration} in ${v.status.replace(/_/g, ' ')}`,
          time: 'Live',
          emoji: '🔧',
          path: `/app/service-visits/${v.id}/wip`,
        })),
        ...data.bookingsToday.slice(0, 2).map((b) => ({
          id: b.id,
          text: `Booking ${b.bookingNumber} — ${b.customer}`,
          time: b.time,
          emoji: '📅',
          path: '/app/workshop/bookings',
        })),
      ]
      setNotifications(items)
    }).catch(() => {})
  }, [branchId])

  useEffect(() => {
    const token = authStorage.getToken()
    if (!token || searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      searchApi.global(token, searchQuery, branchId ?? undefined).then((res) => {
        const all = [
          ...res.serviceVisits,
          ...res.vehicles,
          ...res.customers,
          ...res.bookings,
          ...res.jobCards,
        ]
        setSearchResults(all)
        setShowSearch(true)
      }).catch(() => setSearchResults([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, branchId])

  const displayName = user ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'User'

  return (
    <header className="topbar sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-brand-border bg-white/95 backdrop-blur-sm px-6">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          placeholder="Search registration, VIN, job card, invoice, customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowSearch(true)}
          onBlur={() => setTimeout(() => setShowSearch(false), 200)}
          className="h-10 w-full rounded-xl border border-brand-border bg-brand-grey/50 pl-10 pr-4 text-sm placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all"
        />
        {showSearch && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-brand-border bg-white shadow-xl z-50 max-h-80 overflow-y-auto">
            {searchResults.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => { navigate(r.path); setShowSearch(false); setSearchQuery('') }}
                className="flex w-full items-start gap-3 px-4 py-3 text-sm hover:bg-brand-grey text-left"
              >
                <Badge variant="secondary" className="shrink-0">{r.type}</Badge>
                <div>
                  <p className="font-medium text-brand-charcoal">{r.label}</p>
                  <p className="text-xs text-brand-muted">{r.sublabel}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowBranch(!showBranch)}
          className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-sm hover:bg-brand-grey transition-colors"
        >
          <Building2 className="h-4 w-4 text-brand-yellow" />
          <span className="hidden md:inline font-medium">{activeBranch?.name ?? 'Branch'}</span>
          <ChevronDown className="h-3.5 w-3.5 text-brand-muted" />
        </button>
        {showBranch && (
          <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border border-brand-border bg-white shadow-xl py-1 z-50">
            {branches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  authStorage.setBranchId(b.id)
                  setBranchId(b.id)
                  setShowBranch(false)
                  window.location.reload()
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-grey transition-colors"
              >
                <Building2 className="h-4 w-4 text-brand-muted" />
                <span className="font-medium">{b.name}</span>
                <span className="text-xs text-brand-muted ml-auto">{b.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" className="hidden lg:flex rounded-xl" onClick={() => navigate('/app/workshop/bookings')}>
        <Plus className="h-4 w-4" />
        Quick Create
      </Button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative rounded-xl p-2 hover:bg-brand-grey transition-colors"
        >
          <Bell className="h-5 w-5 text-brand-muted" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-yellow text-[9px] font-bold text-brand-charcoal">
              {notifications.length}
            </span>
          )}
        </button>
        {showNotifications && (
          <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-brand-border bg-white shadow-xl z-50">
            <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
              <p className="text-sm font-semibold">Live Activity</p>
              <Badge variant="default">{notifications.length}</Badge>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-brand-muted text-center">No active alerts</p>
              ) : notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { navigate(n.path); setShowNotifications(false) }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-sm hover:bg-brand-grey transition-colors text-left"
                >
                  <span className="text-lg">{n.emoji}</span>
                  <div>
                    <p className="text-brand-charcoal">{n.text}</p>
                    <p className="text-xs text-brand-muted mt-0.5">{n.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button type="button" className="rounded-xl p-2 hover:bg-brand-grey transition-colors hidden sm:block">
        <HelpCircle className="h-5 w-5 text-brand-muted" />
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-brand-grey transition-colors"
        >
          <img src={AVATARS[0]} alt={displayName} className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-yellow/30" />
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium leading-tight">{displayName}</p>
            <p className="text-[11px] text-brand-muted">{user?.role ?? '—'}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-brand-muted hidden md:block" />
        </button>
        {showProfile && (
          <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-brand-border bg-white shadow-xl py-1 z-50">
            <div className="px-4 py-3 border-b border-brand-border flex items-center gap-3">
              <img src={AVATARS[0]} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-brand-muted">{user?.email}</p>
              </div>
            </div>
            <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-grey">
              <User className="h-4 w-4" /> My Profile
            </button>
            <button type="button" onClick={() => navigate('/app/settings')} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-grey">
              <Settings className="h-4 w-4" /> Settings
            </button>
            <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-grey">
              <Moon className="h-4 w-4" /> Dark Mode
            </button>
            <div className="border-t border-brand-border mt-1 pt-1">
              <button
                type="button"
                onClick={async () => {
                  const token = authStorage.getToken()
                  if (token) { try { await authApi.logout(token) } catch { /* ignore */ } }
                  authStorage.clear()
                  navigate('/login')
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-brand-danger hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
