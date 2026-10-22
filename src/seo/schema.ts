import { absoluteUrl, SITE_LOCALE, SITE_NAME, SITE_URL } from './seo.config'
import type { SeoPageConfig } from './seo-pages'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL || undefined,
    logo: absoluteUrl('/favicon.png'),
    email: 'demo@zentrorox.com',
    description:
      'ZENTROROX is automotive workshop management software for bookings, job cards, inventory, billing and customer service operations.',
  }
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL || undefined,
    inLanguage: SITE_LOCALE,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  }
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Cloud workshop ERP for automotive service centres: bookings, inspections, job cards, WIP, parts inventory, billing and delivery.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Contact for plan pricing; indicative plans shown on the pricing page.',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  }
}

export function breadcrumbSchema(page: SeoPageConfig & { canonical: string }) {
  if (!page.breadcrumb?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: page.breadcrumb.map((name, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: i === 0 ? absoluteUrl('/') : page.canonical,
    })),
  }
}

export function jsonLdScript(graph: object | object[]) {
  const payload = Array.isArray(graph) ? { '@context': 'https://schema.org', '@graph': graph } : graph
  return JSON.stringify(payload)
}
