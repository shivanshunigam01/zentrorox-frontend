export function normalizeTenantCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s_]+/g, '-')
}
