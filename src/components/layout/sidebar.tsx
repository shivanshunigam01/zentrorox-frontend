import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wrench, Package, ShoppingCart, Receipt, Users,
  BarChart3, Database, Settings, SlidersHorizontal, ChevronDown, ChevronRight,
  Sparkles, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SIDEBAR_NAV } from '@/lib/constants'
import { Logo } from '@/components/ui/logo'
import { authStorage } from '@/lib/auth-storage'
import { useSidebar } from './sidebar-context'
import type { NavItem } from '@/types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Wrench, Package, ShoppingCart, Receipt, Users,
  BarChart3, Database, Settings, SlidersHorizontal,
}

function NavLinkItem({
  item,
  depth = 0,
  onNavigate,
}: {
  item: NavItem
  depth?: number
  onNavigate?: () => void
}) {
  const location = useLocation()
  const [open, setOpen] = useState(() => {
    if (!item.children) return false
    return item.children.some((child) => child.path && location.pathname.startsWith(child.path))
  })

  const Icon = item.icon ? iconMap[item.icon] : null

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-brand-muted hover:bg-brand-grey hover:text-brand-text',
          )}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {open && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-brand-border pl-3">
            {item.children.map((child) => (
              <NavLinkItem key={child.label} item={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path!}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          depth > 0 ? 'py-1.5' : 'py-2.5',
          isActive
            ? 'bg-brand-yellow/15 text-brand-charcoal font-semibold shadow-sm border-l-2 border-brand-yellow'
            : 'text-brand-muted hover:bg-brand-grey hover:text-brand-text',
        )
      }
    >
      {depth === 0 && Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span>{item.label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { isOpen, close } = useSidebar()
  const user = authStorage.getUser()
  const branchId = authStorage.getBranchId()
  const branch = user?.branches.find((b) => b.id === branchId) ?? user?.branches[0]

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen w-64 max-w-[85vw] flex-col border-r border-brand-border bg-white transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-brand-border px-4 sm:px-5">
        <Logo size="md" to="/app/dashboard" />
        <button
          type="button"
          aria-label="Close menu"
          className="rounded-lg p-2 text-brand-muted hover:bg-brand-grey lg:hidden"
          onClick={close}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-thin">
        {SIDEBAR_NAV.map((item) => (
          <NavLinkItem key={item.label} item={item} onNavigate={close} />
        ))}
      </nav>
      <div className="border-t border-brand-border p-4 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 p-3 border border-brand-yellow/20 hidden sm:block">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-brand-yellow" />
            <p className="text-xs font-semibold text-brand-charcoal">Pro Tip</p>
          </div>
          <p className="text-[11px] text-brand-muted leading-relaxed">
            Press <kbd className="px-1 py-0.5 rounded bg-white text-[10px] font-mono border">⌘K</kbd> for quick search
          </p>
        </div>
        <div className="rounded-xl bg-brand-grey p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-charcoal text-white text-xs font-bold">
            {(user?.tenant.name ?? 'ZS').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-brand-charcoal truncate">{user?.tenant.name ?? 'Workshop'}</p>
            <p className="text-[11px] text-brand-muted truncate">{branch?.name ?? 'Branch'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
