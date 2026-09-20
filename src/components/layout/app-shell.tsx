import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'

export function AppShell() {
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

      <Sidebar />
      <div className="pl-64 relative">
        <TopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
