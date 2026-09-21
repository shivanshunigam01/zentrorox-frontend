import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'
import { SidebarProvider, useSidebar } from './sidebar-context'

function AppShellContent() {
  const { isOpen, close } = useSidebar()

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className="app-shell min-h-screen bg-brand-grey relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.35]">
        <div className="absolute inset-0 hero-pattern" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.04) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={close}
        />
      )}

      <Sidebar />
      <div className="relative lg:pl-64">
        <TopBar />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AppShell() {
  return (
    <SidebarProvider>
      <AppShellContent />
    </SidebarProvider>
  )
}
