import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  assertProductionApiConfig,
  resolveApiBaseUrl,
  resolveLocalApiEnabled,
} from './local-mode.ts'

describe('local mode guards', () => {
  it('disables local API in production', () => {
    assert.equal(
      resolveLocalApiEnabled({ PROD: true, MODE: 'production', VITE_USE_LOCAL_API: 'true' }),
      false,
    )
  })

  it('allows local API only in dev when explicitly set', () => {
    assert.equal(
      resolveLocalApiEnabled({ PROD: false, MODE: 'development', VITE_USE_LOCAL_API: 'true' }),
      true,
    )
  })

  it('throws when production requests local API', () => {
    assert.throws(
      () =>
        assertProductionApiConfig({
          PROD: true,
          MODE: 'production',
          VITE_USE_LOCAL_API: 'true',
        }),
      /cannot be enabled/,
    )
  })

  it('maps relative API path on known production host', () => {
    assert.equal(
      resolveApiBaseUrl('/api/v1', { prod: true, hostname: 'zentrorox.zentroverse.com' }),
      'https://zentroroxapi.zentroverse.com/api/v1',
    )
  })

  it('throws when production missing API base URL', () => {
    assert.throws(
      () =>
        assertProductionApiConfig({
          PROD: true,
          MODE: 'production',
          VITE_API_BASE_URL: '',
        }),
      /VITE_API_BASE_URL/,
    )
  })
})
