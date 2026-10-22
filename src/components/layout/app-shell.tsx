import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'
import { SidebarProvider, useSidebar } from './sidebar-context'
import { WorkshopJourneyGuide } from '@/components/workshop/workshop-journey-guide'
import { getWorkshopJourneyStepForPath } from '@/lib/workshop-journey'
import { PrivateAppSEOHead } from '@/seo/SEOHead'

function AppShellContent() {
  const { isOpen, close } = useSidebar()
  const location = useLocation()

  useEffect(() => {
    close()
    window.scrollTo(0, 0)
  }, [location.pathname, close])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className="app-shell min-h-screen bg-brand-grey relative">
      <PrivateAppSEOHead />
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
        <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
          {(() => {
            const journey = getWorkshopJourneyStepForPath(location.pathname)
            return journey ? (
              <div className="mb-4">
                <WorkshopJourneyGuide stepId={journey.id} />
              </div>
            ) : null
          })()}
          <Outlet key={location.pathname} />
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
