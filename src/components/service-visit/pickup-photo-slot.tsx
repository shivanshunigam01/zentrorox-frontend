import { useRef, useState } from 'react'
import { Camera, Loader2, MapPin, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadImage, serviceVisitsApi, type PickupImageRecord, type PickupImageType, type ServiceVisitDetail } from '@/lib/api'
import { captureGeoLocation } from '@/lib/geolocation'
import { authStorage } from '@/lib/auth-storage'

interface PickupPhotoSlotProps {
  type: PickupImageType
  label: string
  required?: boolean
  visitId: string
  image?: PickupImageRecord
  onUploaded: (visit: ServiceVisitDetail) => void
}

export function PickupPhotoSlot({
  type,
  label,
  required,
  visitId,
  image,
  onUploaded,
}: PickupPhotoSlotProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const token = authStorage.getToken()
    if (!token) {
      setError('Please sign in again')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const [geo, upload] = await Promise.all([
        captureGeoLocation(),
        uploadImage(token, file, { entityType: 'pickup', entityId: visitId, folder: 'pickup' }),
      ])
      const capturedAt = new Date().toISOString()

      const updated = await serviceVisitsApi.addPickupImage(token, visitId, {
        type,
        url: upload.url,
        publicId: upload.publicId,
        latitude: geo?.latitude,
        longitude: geo?.longitude,
        capturedAt,
      }, authStorage.getBranchId() ?? undefined)

      onUploaded(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (cameraRef.current) cameraRef.current.value = ''
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="rounded-xl border border-brand-border bg-white p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {label}
          {required && <span className="text-brand-danger ml-0.5">*</span>}
        </p>
        {!required && <span className="text-[10px] text-brand-muted uppercase">Optional</span>}
      </div>

      {image ? (
        <div className="space-y-2">
          <img src={image.url} alt={label} className="h-28 w-full rounded-lg object-cover border border-brand-border" />
          <div className="text-[11px] text-brand-muted space-y-0.5">
            <p>Captured: {new Date(image.capturedAt).toLocaleString('en-IN')}</p>
            {(image.latitude != null && image.longitude != null) && (
              <p className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {image.latitude.toFixed(5)}, {image.longitude.toFixed(5)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => cameraRef.current?.click()}>
              Retake
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-3">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
          ) : (
            <>
              <Button type="button" size="sm" onClick={() => cameraRef.current?.click()}>
                <Camera className="h-4 w-4" /> Camera
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> File
              </Button>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-brand-danger">{error}</p>}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  )
}
