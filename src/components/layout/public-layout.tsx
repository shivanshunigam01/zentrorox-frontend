import { Outlet } from 'react-router-dom'
import { PublicHeader } from './public-header'
import { PublicFooter } from './public-footer'

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
