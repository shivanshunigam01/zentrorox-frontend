import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Sparkles, Phone } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { PUBLIC_NAV } from '@/lib/constants'

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border/60 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8">
          {PUBLIC_NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-brand-muted hover:text-brand-charcoal transition-colors relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-yellow transition-all group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/#contact" className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Book a Demo
            </Link>
          </Button>
        </div>

        <button
          className="lg:hidden p-2 rounded-lg hover:bg-brand-grey"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-brand-border bg-white px-4 py-4 space-y-3 animate-slide-up">
          {PUBLIC_NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block text-sm font-medium text-brand-muted py-2 hover:text-brand-charcoal"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3 border-t border-brand-border">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link to="/#contact">
                <Phone className="h-4 w-4" /> Book Demo
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
