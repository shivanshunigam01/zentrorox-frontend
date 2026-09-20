import type { ReactNode } from 'react'

interface DocumentLayoutProps {
  children: ReactNode
  className?: string
}

/** A4 print wrapper — use inside pages for consistent PDF output */
export function DocumentLayout({ children, className = '' }: DocumentLayoutProps) {
  return (
    <div className={`printable-document ${className}`}>
      <div className="document-page bg-white rounded-xl border border-brand-border p-6 sm:p-8 print:border-0 print:rounded-none print:p-0 print:shadow-none max-w-[210mm] mx-auto">
        {children}
      </div>
    </div>
  )
}
