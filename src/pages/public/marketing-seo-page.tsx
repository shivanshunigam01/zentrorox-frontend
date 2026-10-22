import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SEOHead } from '@/seo/SEOHead'
import { SEO_PAGES, type SeoPageKey } from '@/seo/seo-pages'
import { MARKETING_COPY } from '@/content/seo-marketing-copy'

type Props = { pageKey: SeoPageKey }

export function MarketingSeoPage({ pageKey }: Props) {
  const seo = SEO_PAGES[pageKey]
  const copy = MARKETING_COPY[pageKey]

  if (!copy) return null

  return (
    <>
      <SEOHead pageKey={pageKey} />
      <article className="bg-gradient-to-b from-brand-grey to-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-brand-muted mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-brand-charcoal">Home</Link>
            {seo.breadcrumb?.slice(1).map((crumb) => (
              <span key={crumb}>
                {' / '}
                <span className="text-brand-charcoal">{crumb}</span>
              </span>
            ))}
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-charcoal tracking-tight">{seo.h1}</h1>
          <p className="mt-4 text-lg text-brand-muted leading-relaxed">{copy.intro}</p>
          <ul className="mt-8 space-y-3">
            {copy.bullets.map((item) => (
              <li key={item} className="flex gap-3 text-brand-text">
                <CheckCircle2 className="h-5 w-5 text-brand-yellow shrink-0 mt-0.5" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link to={copy.ctaHref}>{copy.ctaLabel} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Customer login</Link>
            </Button>
          </div>
          <section className="mt-14" aria-labelledby="related-topics">
            <h2 id="related-topics" className="text-xl font-semibold text-brand-charcoal mb-4">Related topics</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {copy.relatedLinks.map((link) => (
                <Card key={link.href} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                  <CardContent className="p-4">
                    <Link to={link.href} className="font-medium text-brand-charcoal hover:text-brand-yellow">
                      {link.label} →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </article>
    </>
  )
}
