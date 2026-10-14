/** When true, all API calls are served from browser cache (localStorage) — no backend. */
export function isLocalApiEnabled(): boolean {
  const flag = import.meta.env.VITE_USE_LOCAL_API
  if (flag === 'false') return false
  if (flag === 'true') return true
  return import.meta.env.DEV
}
