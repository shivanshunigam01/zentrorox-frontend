import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authStorage } from '@/lib/auth-storage'
import { authApi } from '@/lib/api'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = authStorage.getToken()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!token) {
      setReady(true)
      return
    }
    let cancelled = false
    authApi
      .me(token)
      .then((user) => {
        if (cancelled) return
        const existing = authStorage.getUser()
        authStorage.setUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          roleCode: user.roleCode,
          permissions: user.permissions ?? [],
          tenant: user.tenant,
          branches: user.branches,
          defaultBranchId: user.defaultBranchId ?? existing?.defaultBranchId ?? null,
        })
      })
      .catch((err) => {
        console.warn('Could not refresh profile from API:', err instanceof Error ? err.message : err)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-grey text-sm text-brand-muted">
        Loading your workspace…
      </div>
    )
  }

  return <>{children}</>
}
