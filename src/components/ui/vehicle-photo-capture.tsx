import { useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadImage } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

interface VehiclePhotoCaptureProps {
  imageUrl?: string
  onUploaded: (result: { url: string; publicId: string }) => void
  onCleared?: () => void
  entityType?: string
  entityId?: string
  className?: string
  label?: string
}

export function VehiclePhotoCapture({
  imageUrl,
  onUploaded,
  onCleared,
  entityType = 'vehicle',
  entityId,
  className,
  label = 'Vehicle Photo',
}: VehiclePhotoCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const token = authStorage.getToken()
    if (!token) {
      setError('Please sign in again to upload photos')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(token, file, {
        entityType,
        entityId,
        folder: 'vehicles',
      })
      onUploaded({ url: result.url, publicId: result.publicId })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (cameraRef.current) cameraRef.current.value = ''
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2 sm:col-span-2', className)}>
      <label className="text-sm font-medium">{label}</label>
      <div className="rounded-xl border border-dashed border-brand-border bg-brand-grey/40 p-4">
        {imageUrl ? (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <img
              src={imageUrl}
              alt="Vehicle"
              className="h-36 w-full sm:w-48 rounded-lg object-cover border border-brand-border"
            />
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => cameraRef.current?.click()}>
                <Camera className="h-4 w-4" /> Retake
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Replace
              </Button>
              {onCleared && (
                <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={onCleared}>
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-brand-border">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-brand-muted" /> : <ImagePlus className="h-5 w-5 text-brand-muted" />}
            </div>
            <p className="text-sm text-brand-muted">
              {uploading ? 'Uploading photo...' : 'Capture with camera or choose from gallery / files'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" disabled={uploading} onClick={() => cameraRef.current?.click()}>
                <Camera className="h-4 w-4" /> Use Camera
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Choose File
              </Button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-brand-danger">{error}</p>}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
