import type { StoredUser } from '@/lib/auth-storage'

export function getUserPermissions(user: StoredUser | null): string[] {
  return user?.permissions ?? []
}

export function hasPermission(user: StoredUser | null, code: string): boolean {
  const perms = getUserPermissions(user)
  if (perms.includes('*')) return true
  return perms.includes(code)
}

export function hasAnyPermission(user: StoredUser | null, codes: string[]): boolean {
  return codes.some((c) => hasPermission(user, c))
}
