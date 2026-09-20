/** GST & document helpers for production print/PDF output */

export interface InvoiceLineItem {
  sr: number
  description: string
  hsnSac: string
  qty: number
  uom: string
  rate: number
  taxable: number
  gstPercent: number
  cgst: number
  sgst: number
  amount: number
}

export interface GstSummary {
  lines: InvoiceLineItem[]
  subtotal: number
  cgstTotal: number
  sgstTotal: number
  grandTotal: number
  roundOff: number
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n: number): string {
  if (n < 20) return ONES[n]
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`.trim()
}

function convertHundreds(n: number): string {
  if (n === 0) return ''
  if (n < 100) return twoDigits(n)
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${twoDigits(n % 100)}` : ''}`.trim()
}

/** Indian numbering — rupees in words for invoices */
export function amountInWords(amount: number): string {
  const n = Math.round(amount)
  if (n === 0) return 'Zero Rupees Only'

  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const rest = n % 1000

  const parts: string[] = []
  if (crore) parts.push(`${convertHundreds(crore)} Crore`)
  if (lakh) parts.push(`${convertHundreds(lakh)} Lakh`)
  if (thousand) parts.push(`${convertHundreds(thousand)} Thousand`)
  if (rest) parts.push(convertHundreds(rest))

  return `${parts.join(' ')} Rupees Only`
}

export function buildInvoiceLines(totalAmount: number, jobType?: string): GstSummary {
  const labourShare = Math.round(totalAmount * 0.55)
  const partsShare = totalAmount - labourShare
  const gstRate = 18

  const makeLine = (
    sr: number,
    description: string,
    hsnSac: string,
    taxable: number,
    uom: string,
  ): InvoiceLineItem => {
    const gst = Math.round(taxable * gstRate / 100)
    const half = Math.round(gst / 2)
    return {
      sr,
      description,
      hsnSac,
      qty: 1,
      uom,
      rate: taxable,
      taxable,
      gstPercent: gstRate,
      cgst: half,
      sgst: half,
      amount: taxable + gst,
    }
  }

  const lines = [
    makeLine(1, `Labour — ${jobType ?? 'Workshop Service'}`, '9987', labourShare, 'Job'),
    makeLine(2, 'Parts & Materials', '8708', partsShare, 'Lot'),
  ]

  const subtotal = lines.reduce((s, l) => s + l.taxable, 0)
  const cgstTotal = lines.reduce((s, l) => s + l.cgst, 0)
  const sgstTotal = lines.reduce((s, l) => s + l.sgst, 0)
  const rawTotal = subtotal + cgstTotal + sgstTotal
  const grandTotal = Math.round(rawTotal)
  const roundOff = grandTotal - rawTotal

  return { lines, subtotal, cgstTotal, sgstTotal, grandTotal, roundOff }
}

export function formatAddress(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(', ')
}

/** Turn master codes like PERIODIC_SERVICE into readable labels */
export function formatCodeLabel(value?: string | null): string {
  if (!value) return '—'
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function generateInvoiceNumber(visitNumber: string): string {
  const fy = new Date().getMonth() >= 3
    ? `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`
    : `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`
  const suffix = visitNumber.split('-').pop() ?? '000001'
  return `INV/${fy}/${suffix}`
}
