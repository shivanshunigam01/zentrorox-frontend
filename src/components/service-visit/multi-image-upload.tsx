import { useState } from 'react'
import { AlertCircle, Loader2, RefreshCw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImage, type UploadResult } from '@/lib/api'

export type ImageCategory =
  | 'GATE_IN' | 'INVENTORY' | 'VOC' | 'DAMAGE' | 'ODOMETER' | 'ENGINE' | 'CHASSIS' | 'PICKUP' | 'BOOKING' | 'TRIAL' | 'INSPECTION' | 'FINDING'

type FileRow = {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  result?: UploadResult
}

interface MultiImageUploadProps {
  token: string
  visitId: string
  category: ImageCategory
  label?: string
  onUploaded?: (results: UploadResult[]) => void
}

export function MultiImageUpload({ token, visitId, category, label, onUploaded }: MultiImageUploadProps) {
  const [remarks, setRemarks] = useState('')
  const [rows, setRows] = useState<FileRow[]>([])

  const pickFiles = (files: FileList | null) => {
    if (!files?.length) return
    const next = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
    }))
    setRows((prev) => [...prev, ...next])
  }

  const uploadOne = async (index: number) => {
    const row = rows[index]
    if (!row || row.status === 'uploading') return
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, status: 'uploading', error: undefined } : r)))
    try {
      const result = await uploadImage(token, row.file, {
        entityType: 'service_visit',
        entityId: visitId,
        imageCategory: category,
        remarks: remarks || undefined,
      })
      setRows((prev) => prev.map((r, i) => (i === index ? { ...r, status: 'done', result } : r)))
      onUploaded?.([result])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed'
      setRows((prev) => prev.map((r, i) => (i === index ? { ...r, status: 'error', error: message } : r)))
    }
  }

  const uploadAll = async () => {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === 'pending' || rows[i].status === 'error') {
        await uploadOne(i)
      }
    }
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{label ?? 'Vehicle images'}</p>
          <p className="text-xs text-muted-foreground">Category: {category}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById(`file-${visitId}-${category}`)?.click()}>
          <Upload className="w-4 h-4 mr-1" />Add photos
        </Button>
        <input
          id={`file-${visitId}-${category}`}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => pickFiles(e.target.files)}
        />
      </div>
      <Input
        label="Remarks (applied to uploads)"
        placeholder="Optional caption for this batch"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
      />
      {rows.length > 0 && (
        <Button type="button" size="sm" onClick={uploadAll}>Upload all</Button>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rows.map((row, index) => (
          <div key={`${row.file.name}-${index}`} className="rounded-lg border overflow-hidden">
            <img src={row.preview} alt="" className="h-24 w-full object-cover" />
            <div className="p-2 space-y-1 text-xs">
              {row.status === 'uploading' && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                </span>
              )}
              {row.status === 'done' && <span className="text-green-700">Uploaded</span>}
              {row.status === 'error' && (
                <span className="flex items-start gap-1 text-red-600">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  {row.error}
                </span>
              )}
              {(row.status === 'pending' || row.status === 'error') && (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => uploadOne(index)}>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {row.status === 'error' ? 'Retry' : 'Upload'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
