/**
 * Frontend-only mode: all data from localStorage unless you explicitly set
 * VITE_USE_LOCAL_API=false when wiring a real backend later.
 */
export function isLocalApiEnabled(): boolean {
  return import.meta.env.VITE_USE_LOCAL_API !== 'false'
}
