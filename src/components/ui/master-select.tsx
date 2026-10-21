import { useMemo, useState } from 'react'

import { useMasterDropdown } from '@/hooks/use-master-data'

import type { MasterCategory } from '@/lib/master-categories'

import { MASTER_CATEGORIES } from '@/lib/master-categories'

import { cn } from '@/lib/utils'

import { mastersApi } from '@/lib/api'

import { authStorage } from '@/lib/auth-storage'

import { masterCodeFromLabel } from '@/lib/master-code'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'



const ADD_NEW_VALUE = '__add_master_option__'



interface MasterSelectProps {

  category: MasterCategory

  value?: string

  onChange: (value: string) => void

  parentCode?: string

  placeholder?: string

  label?: string

  required?: boolean

  className?: string

  disabled?: boolean

  /** Allow inline create → saved to tenant master data (default on). */

  allowAddNew?: boolean

}



export function MasterSelect({

  category,

  value,

  onChange,

  parentCode,

  placeholder = 'Select...',

  label,

  required,

  className,

  disabled,

  allowAddNew = true,

}: MasterSelectProps) {

  const { options, loading, refetch } = useMasterDropdown(category, parentCode)

  const [addingNew, setAddingNew] = useState(false)

  const [newLabel, setNewLabel] = useState('')

  const [addError, setAddError] = useState<string | null>(null)

  const [savingNew, setSavingNew] = useState(false)



  const token = authStorage.getToken()

  const branchId = authStorage.getBranchId() ?? undefined

  const categoryLabel = MASTER_CATEGORIES[category]?.label ?? category



  const displayOptions = useMemo(() => {

    if (value && !options.some((o) => o.value === value)) {

      const existing = options.find((o) => o.label === value)

      if (existing) return options

      return [...options, { value, label: value.replace(/_/g, ' ') }]

    }

    return options

  }, [options, value])



  const selectDisabled =

    disabled || loading || (category === 'VEHICLE_MODEL' && !parentCode)



  const canAddNew =

    allowAddNew &&

    !selectDisabled &&

    !addingNew



  const handleSelectChange = (next: string) => {

    if (next === ADD_NEW_VALUE) {

      setAddingNew(true)

      setNewLabel('')

      setAddError(null)

      return

    }

    onChange(next)

  }



  const saveNewToMaster = async () => {

    if (!token) {

      setAddError('Sign in required')

      return

    }

    const trimmed = newLabel.trim()

    if (!trimmed) return

    if (category === 'VEHICLE_MODEL' && !parentCode) {

      setAddError('Select vehicle make first')

      return

    }



    setSavingNew(true)

    setAddError(null)

    const code = masterCodeFromLabel(trimmed)

    try {

      await mastersApi.create(

        token,

        {

          category,

          code,

          label: trimmed,

          parentCode: parentCode || undefined,

        },

        branchId,

      )

      await refetch()

      onChange(code)

      setAddingNew(false)

      setNewLabel('')

    } catch (e) {

      const msg = e instanceof Error ? e.message : 'Could not save'

      if (msg.toLowerCase().includes('already exists')) {

        await refetch()

        onChange(code)

        setAddingNew(false)

        setNewLabel('')

      } else {

        setAddError(msg)

      }

    } finally {

      setSavingNew(false)

    }

  }



  if (addingNew) {

    return (

      <div className={cn('space-y-1.5', className)}>

        {label && (

          <label className="text-sm font-medium text-brand-text">

            {label}

            {required && <span className="text-brand-danger ml-0.5">*</span>}

          </label>

        )}

        <Input

          placeholder={`e.g. New ${categoryLabel.toLowerCase()}`}

          value={newLabel}

          onChange={(e) => setNewLabel(e.target.value)}

          onKeyDown={(e) => {

            if (e.key === 'Enter') {

              e.preventDefault()

              void saveNewToMaster()

            }

          }}

        />

        {addError && <p className="text-xs text-red-600">{addError}</p>}

        <p className="text-xs text-brand-muted">

          Adds to <strong>Masters → {categoryLabel}</strong> for your workshop.

        </p>

        <div className="flex flex-wrap gap-2">

          <Button type="button" size="sm" variant="outline" onClick={() => setAddingNew(false)}>

            Back to list

          </Button>

          <Button type="button" size="sm" disabled={savingNew || !newLabel.trim()} onClick={() => void saveNewToMaster()}>

            {savingNew ? 'Saving…' : 'Save to master'}

          </Button>

        </div>

      </div>

    )

  }



  return (

    <div className={cn('space-y-1.5', className)}>

      {label && (

        <label className="text-sm font-medium text-brand-text">

          {label}

          {required && <span className="text-brand-danger ml-0.5">*</span>}

        </label>

      )}

      <select

        value={value ?? ''}

        onChange={(e) => handleSelectChange(e.target.value)}

        disabled={selectDisabled}

        required={required}

        className="flex h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow disabled:opacity-50"

      >

        <option value="">

          {loading ? 'Loading...' : category === 'VEHICLE_MODEL' && !parentCode ? 'Select make first' : placeholder}

        </option>

        {displayOptions.map((opt) => (

          <option key={opt.value} value={opt.value}>{opt.label}</option>

        ))}

        {canAddNew && (

          <option value={ADD_NEW_VALUE}>+ Add new option (saved to master)</option>

        )}

      </select>

    </div>

  )

}


