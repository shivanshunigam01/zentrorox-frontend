/**
 * Canonical public marketing site URL (not the API host).
 * Set VITE_PUBLIC_SITE_URL in Vercel/CI, e.g. https://zentrorox.zentroverse.com
 */
const env: ImportMetaEnv =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as ImportMetaEnv)
const rawSite =
  env.VITE_PUBLIC_SITE_URL?.trim() ||
  (env.PROD ? '' : 'http://localhost:5173')

export const SITE_URL = rawSite.replace(/\/$/, '')

export const SITE_NAME = 'ZENTROROX'
export const SITE_LOCALE = 'en_IN'
export const DEFAULT_OG_IMAGE_PATH = '/og/zentrorox-social-preview.svg'

export function absoluteUrl(path: string): string {
  const base = SITE_URL || 'http://localhost:5173'
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export function canonicalUrl(path: string): string {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '')
  return absoluteUrl(normalized === '/' ? '' : normalized)
}

export const STAGING_NOINDEX =
  env.VITE_SEO_STAGING === 'true' ||
  /localhost|127\.0\.0\.1|vercel\.app$/i.test(SITE_URL)
