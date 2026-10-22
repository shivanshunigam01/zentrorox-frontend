import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SITEMAP_PATHS, SEO_PAGES, seoByPath } from './seo-pages.ts'

describe('SEO pages config', () => {
  it('includes unique titles for sitemap entries', () => {
    const titles = SITEMAP_PATHS.map((p) => seoByPath(p)?.title)
    assert.equal(new Set(titles).size, titles.length)
  })

  it('marks ERP login as noindex', () => {
    assert.match(SEO_PAGES.login.robots, /noindex/)
  })

  it('resolves marketing paths', () => {
    assert.equal(seoByPath('/features')?.key, 'features')
    assert.equal(seoByPath('/workshop-crm')?.key, 'crm')
  })
})
