/**
 * Post-build: robots.txt, sitemap.xml, and prerendered HTML shells for public marketing URLs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, '..', 'dist')
const siteUrl = (process.env.VITE_PUBLIC_SITE_URL || 'https://zentrorox.zentroverse.com').replace(/\/$/, '')

const pages = [
  { path: '/', title: 'ZENTROROX | Automotive Workshop Management Software', description: 'Manage vehicle bookings, inspections, job cards, spare parts, workshop billing, payments and deliveries with ZENTROROX automotive workshop software.', h1: 'Automotive workshop management software' },
  { path: '/features', title: 'Workshop Software Features | ZENTROROX', description: 'Explore ZENTROROX features: digital job cards, vehicle inspection, spare parts inventory, billing, CRM, analytics and multi-branch workshop operations.', h1: 'Workshop software features' },
  { path: '/automotive-workshop-management-software', title: 'Automotive Workshop Management Software | ZENTROROX', description: 'Streamline workshop operations with bookings, vehicle inspections, job cards, technician assignments, quality checks and service tracking.', h1: 'Automotive workshop management software' },
  { path: '/job-card-management-software', title: 'Digital Job Card Management Software | ZENTROROX', description: 'Create digital job cards, assign technicians, track repair progress, manage additional work and maintain complete vehicle service records.', h1: 'Digital job card management' },
  { path: '/workshop-inventory-management', title: 'Workshop Spare Parts Inventory Software | ZENTROROX', description: 'Track spare parts stock, requisitions, issues, consumption, returns and inventory reconciliation across workshop operations.', h1: 'Workshop spare parts inventory' },
  { path: '/workshop-billing-software', title: 'Workshop Billing & GST Invoice Software | ZENTROROX', description: 'Prepare itemized workshop invoices, reconcile labour and parts charges, track payments and manage vehicle delivery documentation.', h1: 'Workshop billing and invoicing' },
  { path: '/vehicle-inspection-software', title: 'Digital Vehicle Inspection Software | ZENTROROX', description: 'Record customer complaints, conduct inspections, capture photos, document repair findings and manage final quality checks.', h1: 'Digital vehicle inspection' },
  { path: '/workshop-crm', title: 'Automotive Workshop CRM Software | ZENTROROX', description: 'Manage customer records, vehicle history, service communication, workshop follow-ups and customer feedback in one connected platform.', h1: 'Workshop CRM software' },
  { path: '/about', title: 'About ZENTROROX | Automotive Workshop ERP Platform', description: 'Learn about ZENTROROX and its connected approach to automotive workshop operations, vehicle service management and customer experience.', h1: 'About ZENTROROX' },
  { path: '/contact', title: 'Contact ZENTROROX | Automotive Workshop Software', description: 'Contact the ZENTROROX team to discuss workshop management, digital job cards, inventory, billing and vehicle service software.', h1: 'Contact ZENTROROX' },
  { path: '/pricing', title: 'ZENTROROX Pricing | Workshop Management Plans', description: 'Compare ZENTROROX workshop software plans for independent garages, growing workshops and multi-branch dealer groups.', h1: 'Workshop software pricing' },
]

const ogImage = `${siteUrl}/og/zentrorox-social-preview.svg`
const indexPath = join(dist, 'index.html')
if (!existsSync(indexPath)) {
  console.error('dist/index.html missing — run vite build first')
  process.exit(1)
}
const template = readFileSync(indexPath, 'utf8')

function injectHead(html, page) {
  const canonical = page.path === '/' ? siteUrl : `${siteUrl}${page.path}`
  const block = `
    <title>${page.title}</title>
    <meta name="description" content="${page.description}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="ZENTROROX" />
    <meta property="og:title" content="${page.title}" />
    <meta property="og:description" content="${page.description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${page.title}" />
    <meta name="twitter:description" content="${page.description}" />
    <meta name="twitter:image" content="${ogImage}" />
  `
  let out = html.replace(/<title>[\s\S]*?<\/title>/, '').replace('</head>', `${block}\n</head>`)
  const noscript = `
    <noscript>
      <div style="padding:2rem;font-family:system-ui,sans-serif;max-width:48rem;margin:0 auto">
        <h1>${page.h1}</h1>
        <p>${page.description}</p>
        <p><a href="${canonical}">Continue to ${page.path === '/' ? 'ZENTROROX' : page.path}</a></p>
      </div>
    </noscript>`
  out = out.replace('<div id="root"></div>', `<div id="root"></div>${noscript}`)
  return out
}

for (const page of pages) {
  const html = injectHead(template, page)
  if (page.path === '/') {
    writeFileSync(indexPath, html, 'utf8')
  } else {
    const dir = join(dist, page.path.slice(1))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), html, 'utf8')
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${p.path === '/' ? siteUrl : `${siteUrl}${p.path}`}</loc></url>`).join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), sitemap, 'utf8')

const robots = `User-agent: *
Allow: /
Disallow: /app/
Disallow: /login
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`
writeFileSync(join(dist, 'robots.txt'), robots, 'utf8')
console.log(`SEO artifacts written for ${siteUrl} (${pages.length} public URLs)`)
