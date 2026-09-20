import { useEffect, useState } from 'react'
import { tenantApi, type TenantProfile } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'

export function useOrganization() {
  const [profile, setProfile] = useState<TenantProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authStorage.getToken()
    const branchId = authStorage.getBranchId() ?? undefined
    if (!token) {
      setLoading(false)
      return
    }
    tenantApi.profile(token, branchId)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  return { profile, loading }
}
