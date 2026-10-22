import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { STAGING_NOINDEX, absoluteUrl } from './seo.config'
import { SEO_PAGES, seoByPath, type SeoPageKey } from './seo-pages'
import { breadcrumbSchema, jsonLdScript, organizationSchema, softwareApplicationSchema, webSiteSchema } from './schema'

type Props = {
  pageKey?: SeoPageKey
  title?: string
  description?: string
  robots?: string
  canonicalPath?: string
  ogImage?: string
  noSchema?: boolean
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertJsonLd(id: string, data: object | null) {
  const existing = document.getElementById(id)
  if (!data) {
    existing?.remove()
    return
  }
  const script = (existing ?? document.createElement('script')) as HTMLScriptElement
  script.id = id
  script.type = 'application/ld+json'
  script.textContent = jsonLdScript(data)
  if (!existing) document.head.appendChild(script)
}

export function SEOHead({
  pageKey,
  title,
  description,
  robots,
  canonicalPath,
  ogImage,
  noSchema,
}: Props) {
  const location = useLocation()
  const fromPath = seoByPath(canonicalPath ?? location.pathname)
  const config = pageKey ? SEO_PAGES[pageKey] : fromPath

  const finalTitle = title ?? config?.title ?? SEO_PAGES.home.title
  const finalDescription = description ?? config?.description ?? SEO_PAGES.home.description
  let finalRobots = robots ?? config?.robots ?? 'index,follow'
  if (STAGING_NOINDEX && !finalRobots.includes('noindex')) {
    finalRobots = 'noindex,nofollow'
  }
  const canonical = config?.canonical ?? absoluteUrl(canonicalPath ?? location.pathname)
  const image = absoluteUrl(ogImage ?? config?.ogImage ?? SEO_PAGES.home.ogImage)

  useEffect(() => {
    document.title = finalTitle
    document.documentElement.lang = 'en'

    upsertMeta('name', 'description', finalDescription)
    upsertMeta('name', 'robots', finalRobots)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', finalTitle)
    upsertMeta('name', 'twitter:description', finalDescription)
    upsertMeta('name', 'twitter:image', image)

    upsertMeta('property', 'og:type', config?.ogType ?? 'website')
    upsertMeta('property', 'og:site_name', 'ZENTROROX')
    upsertMeta('property', 'og:locale', 'en_IN')
    upsertMeta('property', 'og:title', finalTitle)
    upsertMeta('property', 'og:description', finalDescription)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', image)

    upsertLink('canonical', canonical)

    if (noSchema) {
      upsertJsonLd('seo-jsonld', null)
      return
    }

    const graph: object[] = [organizationSchema(), webSiteSchema(), softwareApplicationSchema()]
    const crumbs = config ? breadcrumbSchema(config) : null
    if (crumbs) graph.push(crumbs)
    upsertJsonLd('seo-jsonld', graph)
  }, [finalTitle, finalDescription, finalRobots, canonical, image, config, noSchema])

  return null
}

/** ERP / authenticated surfaces — never index. */
export function PrivateAppSEOHead() {
  return <SEOHead pageKey="login" robots="noindex,nofollow" noSchema title="ZENTROROX App" description="Private workshop application" />
}
