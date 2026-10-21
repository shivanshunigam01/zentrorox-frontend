/** Parse stored preferred slot (12h or 24h) to `HH:mm` for <input type="time"> */
export function preferredSlotToTimeValue(slot: string | undefined | null): string {
  const raw = slot?.trim()
  if (!raw) return ''

  const m24 = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw)
  if (m24 && !/\s*(AM|PM)/i.test(raw)) {
    const h = Math.min(23, Math.max(0, parseInt(m24[1], 10)))
    const min = m24[2]
    return `${String(h).padStart(2, '0')}:${min}`
  }

  const m12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(raw)
  if (m12) {
    let h = parseInt(m12[1], 10)
    const min = m12[2]
    const ap = m12[3].toUpperCase()
    if (ap === 'PM' && h !== 12) h += 12
    if (ap === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${min}`
  }

  return ''
}

/** Format `HH:mm` from time picker to workshop-friendly 12h label for API / print */
export function timeValueToPreferredSlot(hhmm: string): string {
  if (!hhmm.trim()) return ''
  const [hStr, min] = hhmm.split(':')
  let h = parseInt(hStr, 10)
  if (Number.isNaN(h) || !min) return hhmm.trim()
  const ap = h >= 12 ? 'PM' : 'AM'
  h %= 12
  if (h === 0) h = 12
  return `${h}:${min} ${ap}`
}

export function formatPreferredSlotDisplay(slot: string | undefined | null): string {
  if (!slot?.trim()) return '—'
  const as24 = preferredSlotToTimeValue(slot)
  return as24 ? timeValueToPreferredSlot(as24) : slot
}
