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

export function getApiBaseUrl(): string {
  assertProductionApiConfig({
    PROD: import.meta.env.PROD,
    MODE: import.meta.env.MODE,
    VITE_USE_LOCAL_API: import.meta.env.VITE_USE_LOCAL_API,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  })
  const base = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!base && import.meta.env.PROD) {
    throw new Error('VITE_API_BASE_URL is not configured.')
  }
  return base ?? 'http://localhost:3000/api/v1'
}
