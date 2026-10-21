import { useCallback, useEffect, useState } from 'react'

import { mastersApi, type DropdownOption } from '@/lib/api'

import { authStorage } from '@/lib/auth-storage'

import type { MasterCategory } from '@/lib/master-categories'



export function useMasterDropdown(category: MasterCategory, parentCode?: string) {

  const [options, setOptions] = useState<DropdownOption[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)



  const refetch = useCallback(() => {

    const token = authStorage.getToken()

    if (!token) {

      setOptions([])

      setLoading(false)

      return Promise.resolve()

    }



    setLoading(true)

    return mastersApi

      .dropdown(token, category, parentCode)

      .then((data) => {

        setOptions(data)

        setError(null)

      })

      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))

      .finally(() => setLoading(false))

  }, [category, parentCode])



  useEffect(() => {

    refetch()

  }, [refetch])



  return { options, loading, error, refetch }

}


