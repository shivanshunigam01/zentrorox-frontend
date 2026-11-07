import { useRef, useState } from 'react'
import { AlertCircle, Camera, Loader2, RefreshCw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImage, type UploadResult } from '@/lib/api'

export type ImageCategory =
  | 'GATE_IN' | 'INVENTORY' | 'VOC' | 'DAMAGE' | 'ODOMETER' | 'ENGINE' | 'CHASSIS' | 'PICKUP' | 'BOOKING' | 'TRIAL' | 'INSPECTION' | 'FINDING' | 'RECEIVING'

type FileRow = {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  result?: UploadResult
}

type ExistingImage = { url?: string; imageCategory?: string; id?: string }

interface MultiImageUploadProps {
  token: string
  visitId: string
  category: ImageCategory
  label?: string
  folder?: string
  autoUpload?: boolean
  disabled?: boolean
  /** Already saved on this visit (from API). */
  existingImages?: ExistingImage[]
  onUploaded?: (results: UploadResult[]) => void
}

export function MultiImageUpload({
  token,
  visitId,
  category,
  label,
  folder = 'receiving',
  autoUpload = true,
  disabled = false,
  existingImages = [],
  onUploaded,
}: MultiImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [remarks, setRemarks] = useState('')
  const [rows, setRows] = useState<FileRow[]>([])
  const [batchUploading, setBatchUploading] = useState(false)

  const savedForCategory = existingImages.filter(
    (m) => m.url && (!m.imageCategory || m.imageCategory === category),
  )
  const totalCount = savedForCategory.length + rows.filter((r) => r.status === 'done').length

  const rowKey = (row: FileRow) => `${row.preview}-${row.file.name}-${row.file.size}`

  const uploadRow = async (row: FileRow) => {
    const key = rowKey(row)
    setRows((prev) => prev.map((r) => (rowKey(r) === key ? { ...r, status: 'uploading', error: undefined } : r)))
    try {
      const result = await uploadImage(token, row.file, {
        entityType: 'service_visit',
        entityId: visitId,
        folder,
        imageCategory: category,
        remarks: remarks || undefined,
      })
      setRows((prev) => prev.map((r) => (rowKey(r) === key ? { ...r, status: 'done', result } : r)))
      return result
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed'
      setRows((prev) => prev.map((r) => (rowKey(r) === key ? { ...r, status: 'error', error: message } : r)))
      return null
    }
  }

  const uploadOne = async (index: number) => {
    const row = rows[index]
    if (!row || row.status === 'uploading' || row.status === 'done') return
    const result = await uploadRow(row)
    if (result) onUploaded?.([result])
  }

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return
    const next: FileRow[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }))
    setRows((prev) => [...prev, ...next])

    if (autoUpload) {
      setBatchUploading(true)
      const uploaded: UploadResult[] = []
      try {
        for (const row of next) {
          const result = await uploadRow(row)
          if (result) uploaded.push(result)
        }
        if (uploaded.length) onUploaded?.(uploaded)
      } finally {
        setBatchUploading(false)
      }
    }

    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const uploadAll = async () => {
    const uploaded: UploadResult[] = []
    for (const row of rows) {
      if (row.status === 'pending' || row.status === 'error') {
        const result = await uploadRow(row)
        if (result) uploaded.push(result)
      }
    }
    if (uploaded.length) onUploaded?.(uploaded)
  }

  const busy = disabled || batchUploading

  return (
    <div className="space-y-3 rounded-xl border border-brand-border bg-brand-grey/20 p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{label ?? 'Vehicle images'}</p>
          <p className="text-xs text-muted-foreground">
            Add unlimited photos — tap Camera again or pick multiple from Gallery · {category}
            {totalCount > 0 ? ` · ${totalCount} saved` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => cameraRef.current?.click()}>
            <Camera className="w-4 h-4 mr-1" />
            {batchUploading ? 'Uploading…' : 'Camera'}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" />
            Gallery (multi)
          </Button>
        </div>
      </div>
      <Input
        label="Caption / remarks (optional)"
        placeholder="Applied to the next upload(s)"
        value={remarks}
        disabled={busy}
        onChange={(e) => setRemarks(e.target.value)}
      />
      {!autoUpload && rows.some((r) => r.status === 'pending' || r.status === 'error') && (
        <Button type="button" size="sm" disabled={busy} onClick={uploadAll}>
          Upload selected
        </Button>
      )}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void pickFiles(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void pickFiles(e.target.files)}
      />

      {(savedForCategory.length > 0 || rows.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {savedForCategory.map((m, i) => (
            <a
              key={m.id ?? `saved-${i}-${m.url}`}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border overflow-hidden bg-white block"
            >
              <img src={m.url} alt="" className="h-24 w-full object-cover" />
              <p className="p-1 text-[10px] text-green-700 truncate">Saved</p>
            </a>
          ))}
          {rows.map((row, index) => (
            <div key={`${row.file.name}-${row.file.lastModified}-${index}`} className="rounded-lg border overflow-hidden bg-white">
              <img src={row.preview} alt="" className="h-24 w-full object-cover" />
              <div className="p-2 space-y-1 text-xs">
                {row.status === 'uploading' && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                  </span>
                )}
                {row.status === 'done' && <span className="text-green-700">Saved</span>}
                {row.status === 'error' && (
                  <span className="flex items-start gap-1 text-red-600">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    {row.error}
                  </span>
                )}
                {(row.status === 'pending' || row.status === 'error') && !autoUpload && (
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => void uploadOne(index)}>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {row.status === 'error' ? 'Retry' : 'Upload'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
