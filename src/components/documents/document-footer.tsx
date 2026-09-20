import { BRAND } from '@/lib/brand'

interface DocumentFooterProps {
  copyType?: 'Customer Copy' | 'Office Copy' | 'Duplicate' | 'Internal Use'
  terms?: string[]
  showSignature?: boolean
}

export function DocumentFooter({
  copyType,
  terms,
  showSignature = true,
}: DocumentFooterProps) {
  const defaultTerms = [
    'All disputes subject to local jurisdiction only.',
    'Goods once sold / services rendered will not be taken back.',
    'This is a computer-generated document and valid without physical signature unless stamped.',
  ]

  return (
    <footer className="document-footer mt-8 pt-4 border-t-2 border-brand-charcoal/20 print:mt-3 print:pt-2">
      {(terms === undefined ? defaultTerms : terms).length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Terms & Conditions</p>
          <ul className="text-[10px] text-brand-muted space-y-0.5 list-disc list-inside">
            {(terms === undefined ? defaultTerms : terms).map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}

      {showSignature && (
        <div className="grid grid-cols-2 gap-8 items-end">
          <div>
            <div className="document-signature-line border-t border-brand-border pt-1 mt-12 print:mt-4 w-48">
              <p className="text-[10px] text-brand-muted">Customer Signature</p>
            </div>
          </div>
          <div className="text-right">
            <div className="document-signature-line border-t border-brand-border pt-1 mt-12 print:mt-4 ml-auto w-48">
              <p className="text-[10px] text-brand-muted">Authorised Signatory</p>
              <p className="text-xs font-semibold text-brand-charcoal">{BRAND.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[10px] text-brand-muted border-t border-brand-border pt-2">
        <span>{BRAND.pillars}</span>
        {copyType && <span className="font-semibold uppercase tracking-wide">{copyType}</span>}
        <span>{BRAND.website}</span>
      </div>
    </footer>
  )
}
