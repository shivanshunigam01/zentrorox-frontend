import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SEOHead } from '@/seo/SEOHead'

export function NotFoundPage() {
  return (
    <>
      <SEOHead pageKey="not-found" />
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-6xl font-bold text-brand-yellow">404</p>
        <h1 className="mt-4 text-2xl font-bold text-brand-charcoal">Page not found</h1>
        <p className="mt-2 text-brand-muted max-w-md">
          The URL may be incorrect or the page may have moved. Workshop app routes require sign in.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button asChild>
            <Link to="/">Back to homepage</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
