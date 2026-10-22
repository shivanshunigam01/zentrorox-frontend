import { canonicalUrl, DEFAULT_OG_IMAGE_PATH, SITE_NAME } from './seo.config'

export type SeoPageKey =
  | 'home'
  | 'features'
  | 'workshop'
  | 'job-cards'
  | 'inventory'
  | 'billing'
  | 'inspection'
  | 'crm'
  | 'about'
  | 'contact'
  | 'pricing'
  | 'login'
  | 'not-found'

export type SeoPageConfig = {
  key: SeoPageKey
  path: string
  title: string
  description: string
  robots: string
  ogType?: 'website' | 'article'
  keywords?: string[]
  h1: string
  includeInSitemap: boolean
  breadcrumb?: string[]
}

function page(
  partial: Omit<SeoPageConfig, 'ogImage'> & { ogImage?: string },
): SeoPageConfig & { ogImage: string; canonical: string; ogUrl: string } {
  const ogImage = partial.ogImage ?? DEFAULT_OG_IMAGE_PATH
  return {
    ...partial,
    ogImage,
    canonical: canonicalUrl(partial.path),
    ogUrl: canonicalUrl(partial.path),
  }
}

export const SEO_PAGES: Record<SeoPageKey, SeoPageConfig & { canonical: string; ogUrl: string; ogImage: string }> = {
  home: page({
    key: 'home',
    path: '/',
    title: 'ZENTROROX | Automotive Workshop Management Software',
    description:
      'Manage vehicle bookings, inspections, job cards, spare parts, workshop billing, payments and deliveries with ZENTROROX automotive workshop software.',
    robots: 'index,follow',
    h1: 'Automotive workshop management software',
    includeInSitemap: true,
    breadcrumb: ['Home'],
    keywords: [
      'automotive workshop management software',
      'garage management software',
      'vehicle service management software',
      'workshop ERP',
    ],
  }),
  features: page({
    key: 'features',
    path: '/features',
    title: 'Workshop Software Features | ZENTROROX',
    description:
      'Explore ZENTROROX features: digital job cards, vehicle inspection, spare parts inventory, billing, CRM, analytics and multi-branch workshop operations.',
    robots: 'index,follow',
    h1: 'Workshop software features',
    includeInSitemap: true,
    breadcrumb: ['Home', 'Features'],
  }),
  workshop: page({
    key: 'workshop',
    path: '/automotive-workshop-management-software',
    title: 'Automotive Workshop Management Software | ZENTROROX',
    description:
      'Streamline workshop operations with bookings, vehicle inspections, job cards, technician assignments, quality checks and service tracking.',
    robots: 'index,follow',
    h1: 'Automotive workshop management software',
    includeInSitemap: true,
    breadcrumb: ['Home', 'Workshop Management'],
    keywords: ['automotive workshop ERP', 'workshop management software', 'garage operations software'],
  }),
  'job-cards': page({
    key: 'job-cards',
    path: '/job-card-management-software',
    title: 'Digital Job Card Management Software | ZENTROROX',
    description:
      'Create digital job cards, assign technicians, track repair progress, manage additional work and maintain complete vehicle service records.',
    robots: 'index,follow',
    h1: 'Digital job card management',
    includeInSitemap: true,
    breadcrumb: ['Home', 'Job Cards'],
    keywords: ['job card management software', 'garage job card software', 'digital workshop job cards'],
  }),
  inventory: page({
    key: 'inventory',
    path: '/workshop-inventory-management',
    title: 'Workshop Spare Parts Inventory Software | ZENTROROX',
    description:
      'Track spare parts stock, requisitions, issues, consumption, returns and inventory reconciliation across workshop operations.',
    robots: 'index,follow',
    h1: 'Workshop spare parts inventory',
    includeInSitemap: true,
    breadcrumb: ['Home', 'Inventory'],
    keywords: ['auto parts inventory software', 'workshop inventory management', 'spare parts management system'],
  }),
  billing: page({
    key: 'billing',
    path: '/workshop-billing-software',
    title: 'Workshop Billing & GST Invoice Software | ZENTROROX',
    description:
      'Prepare itemized workshop invoices, reconcile labour and parts charges, track payments and manage vehicle delivery documentation.',
    robots: 'index,follow',
    h1: 'Workshop billing and invoicing',
    includeInSitemap: true,
    breadcrumb: ['Home', 'Billing'],
    keywords: ['garage billing software', 'workshop invoicing software', 'automotive GST invoice software'],
  }),
  inspection: page({
    key: 'inspection',
    path: '/vehicle-inspection-software',
    title: 'Digital Vehicle Inspection Software | ZENTROROX',
    description:
      'Record customer complaints, conduct inspections, capture photos, document repair findings and manage final quality checks.',
    robots: 'index,follow',
    h1: 'Digital vehicle inspection',
    includeInSitemap: true,
    breadcrumb: ['Home', 'Vehicle Inspection'],
    keywords: ['vehicle inspection software', 'workshop inspection checklist', 'automotive quality control software'],
  }),
  crm: page({
    key: 'crm',
    path: '/workshop-crm',
    title: 'Automotive Workshop CRM Software | ZENTROROX',
    description:
      'Manage customer records, vehicle history, service communication, workshop follow-ups and customer feedback in one connected platform.',
    robots: 'index,follow',
    h1: 'Workshop CRM software',
    includeInSitemap: true,
    breadcrumb: ['Home', 'CRM'],
    keywords: ['workshop CRM software', 'garage CRM', 'automotive customer management'],
  }),
  about: page({
    key: 'about',
    path: '/about',
    title: 'About ZENTROROX | Automotive Workshop ERP Platform',
    description:
      'Learn about ZENTROROX and its connected approach to automotive workshop operations, vehicle service management and customer experience.',
    robots: 'index,follow',
    h1: 'About ZENTROROX',
    includeInSitemap: true,
    breadcrumb: ['Home', 'About'],
  }),
  contact: page({
    key: 'contact',
    path: '/contact',
    title: 'Contact ZENTROROX | Automotive Workshop Software',
    description:
      'Contact the ZENTROROX team to discuss workshop management, digital job cards, inventory, billing and vehicle service software.',
    robots: 'index,follow',
    h1: 'Contact ZENTROROX',
    includeInSitemap: true,
    breadcrumb: ['Home', 'Contact'],
  }),
  pricing: page({
    key: 'pricing',
    path: '/pricing',
    title: 'ZENTROROX Pricing | Workshop Management Plans',
    description:
      'Compare ZENTROROX workshop software plans for independent garages, growing workshops and multi-branch dealer groups. Request a demo for custom pricing.',
    robots: 'index,follow',
    h1: 'Workshop software pricing',
    includeInSitemap: true,
    breadcrumb: ['Home', 'Pricing'],
  }),
  login: page({
    key: 'login',
    path: '/login',
    title: `Sign In | ${SITE_NAME}`,
    description: 'Secure sign in to your ZENTROROX workshop account.',
    robots: 'noindex,nofollow',
    h1: 'Sign in',
    includeInSitemap: false,
  }),
  'not-found': page({
    key: 'not-found',
    path: '/404',
    title: `Page Not Found | ${SITE_NAME}`,
    description: 'The page you requested could not be found.',
    robots: 'noindex,nofollow',
    h1: 'Page not found',
    includeInSitemap: false,
  }),
}

export const SITEMAP_PATHS = Object.values(SEO_PAGES)
  .filter((p) => p.includeInSitemap)
  .map((p) => p.path)

export function seoByPath(pathname: string): (typeof SEO_PAGES)[SeoPageKey] | undefined {
  const clean = pathname.split('?')[0].replace(/\/$/, '') || '/'
  return Object.values(SEO_PAGES).find((p) => {
    const pPath = p.path.replace(/\/$/, '') || '/'
    return pPath === clean
  })
}
