import { Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PrintActionsProps {
  label?: string
}

export function PrintActions({ label = 'Print / Save as PDF' }: PrintActionsProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="no-print flex items-center justify-end gap-2 mb-4">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4" />
        {label}
      </Button>
      <p className="text-xs text-brand-muted hidden sm:block">
        <Download className="h-3 w-3 inline mr-1" />
        Choose &quot;Save as PDF&quot; in the print dialog
      </p>
    </div>
  )
}
