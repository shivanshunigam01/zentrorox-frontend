import { BRAND } from '@/lib/brand'
import { formatAddress } from '@/lib/document-utils'
import type { TenantProfile } from '@/lib/api'

interface DocumentHeaderProps {
  title: string
  subtitle?: string
  documentNo?: string
  date?: string
  profile?: TenantProfile | null
  copyType?: string
}

export function DocumentHeader({
  title,
  subtitle,
  documentNo,
  date,
  profile,
  copyType,
}: DocumentHeaderProps) {
  const org = profile?.tenant
  const branch = profile?.branch

  return (
    <div className="document-header border-b-2 border-brand-charcoal pb-4 mb-5 print:pb-2 print:mb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <img
            src={BRAND.logo}
            alt={BRAND.logoAlt}
            className="h-[72px] w-auto object-contain shrink-0 print:h-[44px]"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-charcoal leading-tight">
              {org?.legalName ?? org?.name ?? BRAND.name}
            </p>
            <p className="text-[10px] text-brand-muted mt-0.5">{BRAND.tagline}</p>
            {branch && (
              <p className="text-xs font-medium mt-1.5">{branch.name} ({branch.code})</p>
            )}
            <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
              {formatAddress([
                branch?.address || org?.address,
                branch?.city || org?.city,
                branch?.state || org?.state,
                branch?.pin || org?.pin,
              ])}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-brand-muted">
              {org?.gstin && <span><strong className="text-brand-charcoal">GSTIN:</strong> {org.gstin}</span>}
              {org?.phone && <span><strong className="text-brand-charcoal">Ph:</strong> {org.phone}</span>}
              {org?.email && <span><strong className="text-brand-charcoal">Email:</strong> {org.email}</span>}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          {copyType && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/60 mb-1">{copyType}</p>
          )}
          <h1 className="text-lg font-bold text-brand-charcoal uppercase tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-brand-muted mt-0.5">{subtitle}</p>}
          {documentNo && (
            <p className="text-xs font-mono mt-2 bg-brand-grey/80 inline-block px-2 py-0.5 rounded">
              {documentNo}
            </p>
          )}
          {date && <p className="text-xs mt-1 text-brand-muted">Date: {date}</p>}
        </div>
      </div>
    </div>
  )
}
