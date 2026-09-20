import { Navigate, useLocation } from 'react-router-dom'
import { authStorage } from '@/lib/auth-storage'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = authStorage.getToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
