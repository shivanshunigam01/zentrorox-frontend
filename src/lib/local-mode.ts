/**
 * Offline demo mode — never active in production builds.
 * Set VITE_USE_LOCAL_API=true only for explicit local UI demos without MongoDB.
 */
export type LocalModeEnv = {
  PROD: boolean
  MODE: string
  VITE_USE_LOCAL_API?: string
  VITE_API_BASE_URL?: string
}

export function resolveLocalApiEnabled(env: LocalModeEnv): boolean {
  if (env.PROD || env.MODE === 'production') return false
  return env.VITE_USE_LOCAL_API === 'true'
}

export function assertProductionApiConfig(env: LocalModeEnv): void {
  if (!env.PROD && env.MODE !== 'production') return
  if (env.VITE_USE_LOCAL_API === 'true') {
    throw new Error('VITE_USE_LOCAL_API cannot be enabled in production builds.')
  }
  const base = env.VITE_API_BASE_URL?.trim()
  if (!base) {
    throw new Error('VITE_API_BASE_URL is required for production builds.')
  }
}

export function isLocalApiEnabled(): boolean {
  return resolveLocalApiEnabled({
    PROD: import.meta.env.PROD,
    MODE: import.meta.env.MODE,
    VITE_USE_LOCAL_API: import.meta.env.VITE_USE_LOCAL_API,
  })
}

/** When the SPA is built with relative /api/v1, map known hosts to the real API (Vercel cannot serve POST /api). */
const PRODUCTION_API_BY_HOST: Record<string, string> = {
  'zentrorox.zentroverse.com': 'https://zentroroxapi.zentroverse.com/api/v1',
  'www.zentrorox.zentroverse.com': 'https://zentroroxapi.zentroverse.com/api/v1',
}

export function resolveApiBaseUrl(
  envBase: string | undefined,
  opts: { prod: boolean; hostname?: string },
): string {
  const trimmed = envBase?.trim()
  const devFallback = 'http://localhost:3000/api/v1'
  if (!trimmed) return opts.prod ? '' : devFallback

  const isRelativeApi = trimmed === '/api/v1' || trimmed.startsWith('/api/')
  if (opts.prod && opts.hostname && isRelativeApi) {
    const mapped = PRODUCTION_API_BY_HOST[opts.hostname]
    if (mapped) return mapped
  }

  return trimmed
}

export function getApiBaseUrl(): string {
  assertProductionApiConfig({
    PROD: import.meta.env.PROD,
    MODE: import.meta.env.MODE,
    VITE_USE_LOCAL_API: import.meta.env.VITE_USE_LOCAL_API,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  })
  const resolved = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, {
    prod: import.meta.env.PROD,
    hostname: typeof window !== 'undefined' ? window.location.hostname : undefined,
  })
  if (!resolved && import.meta.env.PROD) {
    throw new Error('VITE_API_BASE_URL is not configured.')
  }
  return resolved || 'http://localhost:3000/api/v1'
}
