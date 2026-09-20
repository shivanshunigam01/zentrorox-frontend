import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Share2, Globe, MessageCircle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export function PublicFooter() {
  return (
    <footer className="bg-brand-charcoal text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <Logo variant="light" size="lg" to="/" />
            <p className="mt-4 text-sm text-white/60 leading-relaxed">
              One connected automotive service ERP for workshops, garages, and service centres across India.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Share2, label: 'LinkedIn' },
                { icon: Globe, label: 'Website' },
                { icon: MessageCircle, label: 'Support' },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-brand-yellow hover:text-brand-charcoal transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              📦 Product
            </h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="/#features" className="hover:text-brand-yellow transition-colors">Features</a></li>
              <li><a href="/#solutions" className="hover:text-brand-yellow transition-colors">Solutions</a></li>
              <li><a href="/#pricing" className="hover:text-brand-yellow transition-colors">Pricing</a></li>
              <li><a href="/#integrations" className="hover:text-brand-yellow transition-colors">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              🔧 Modules
            </h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>Workshop Management</li>
              <li>Spare Parts & Inventory</li>
              <li>Billing & Payments</li>
              <li>CRM & PSF</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              📞 Contact
            </h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-yellow shrink-0" />
                <a href="mailto:demo@zentrorox.com" className="hover:text-brand-yellow">demo@zentrorox.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-yellow shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                <span>Patna, Bihar, India</span>
              </li>
              <li className="pt-2">
                <Link to="/login" className="inline-flex items-center gap-1 text-brand-yellow hover:text-brand-yellow-hover font-medium">
                  Login to App →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} ZENTROROX. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-white/60">Privacy Policy</a>
            <a href="#" className="hover:text-white/60">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
