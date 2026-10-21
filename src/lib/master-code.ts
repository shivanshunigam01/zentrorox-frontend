/** Derive master `code` from a human-readable label (matches backend normalization). */
export function masterCodeFromLabel(label: string): string {
  const code = label
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
  return code || 'CUSTOM'
}
