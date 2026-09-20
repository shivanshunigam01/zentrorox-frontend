import { useEffect, useState } from 'react'
import { mastersApi, type DropdownOption } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import type { MasterCategory } from '@/lib/master-categories'

export function useMasterDropdown(category: MasterCategory, parentCode?: string) {
  const [options, setOptions] = useState<DropdownOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = authStorage.getToken()
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    mastersApi
      .dropdown(token, category, parentCode)
      .then(setOptions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [category, parentCode])

  return { options, loading, error }
}
