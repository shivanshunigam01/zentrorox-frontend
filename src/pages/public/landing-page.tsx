import { Link } from 'react-router-dom'
import {
  ArrowRight, Car, Wrench, Package, Receipt, Users, BarChart3,
  Shield, Building2, Smartphone, CheckCircle2, ChevronDown,
  AlertTriangle, Eye, Boxes, MessageSquare, Star, Zap, Clock,
  TrendingUp, Award, Headphones, Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StickerBadge } from '@/components/ui/sticker-badge'
import { IMAGES, GIFS, VIDEOS, AVATARS } from '@/lib/assets'
import { BRAND } from '@/lib/brand'

const stats = [
  { value: '500+', label: 'Workshops Connected', icon: Building2 },
  { value: '2M+', label: 'Service Visits Managed', icon: Car },
  { value: '98%', label: 'Customer Satisfaction', icon: Star },
  { value: '40%', label: 'Efficiency Improvement', icon: TrendingUp },
]

const challenges = [
  { icon: AlertTriangle, title: 'Disconnected Processes', desc: 'Bookings, job cards, parts and billing run on separate systems causing delays and errors.', color: 'bg-red-50 text-red-600' },
  { icon: Eye, title: 'No Real-Time Visibility', desc: 'Managers cannot see WIP status, bay utilization or technician productivity at a glance.', color: 'bg-blue-50 text-blue-600' },
  { icon: Boxes, title: 'Inventory Mismatches', desc: 'Parts issued without proper tracking leads to stock discrepancies and revenue leakage.', color: 'bg-amber-50 text-amber-600' },
  { icon: MessageSquare, title: 'Customer Communication Gaps', desc: 'Estimates, approvals and delivery updates happen offline, frustrating customers.', color: 'bg-purple-50 text-purple-600' },
]

const features = [
  { icon: Wrench, title: 'Digital Job Cards', desc: 'End-to-end service visit tracking from booking to delivery with connected workflow stages.', image: IMAGES.mechanicWorking },
  { icon: Car, title: 'Vehicle Inspection', desc: 'Configurable inspection templates with photo capture, severity ratings and estimate integration.', image: IMAGES.carService },
  { icon: Package, title: 'Spare Parts ERP', desc: 'Complete inventory management with ledger, requisitions, issues, transfers and OTC sales.', image: IMAGES.spareParts },
  { icon: Receipt, title: 'Billing & Payments', desc: 'Invoice generation from job cards, split payments, outstanding approvals and gatepass control.', image: IMAGES.garageInterior },
  { icon: Users, title: 'Customer CRM', desc: 'Lifetime vehicle history, feedback, PSF, service reminders and complaint management.', image: IMAGES.customerHappy },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'WIP ageing, technician productivity, bay utilization, revenue trends and inventory reports.', image: IMAGES.dashboardPreview },
  { icon: Building2, title: 'Multi-Branch Operations', desc: 'Manage multiple workshop locations with branch-level access control and consolidated reporting.', image: IMAGES.teamWorkshop },
  { icon: Smartphone, title: 'Mobile Operations', desc: 'Technician timers, pickup executive app, manager dashboards optimized for tablets and mobile.', image: IMAGES.heroWorkshop },
  { icon: Shield, title: 'Enterprise Security', desc: 'Multi-tenant isolation, configurable RBAC, audit trail and approval matrix for every action.', image: IMAGES.garageInterior },
]

const roles = [
  { role: 'Workshop Manager', emoji: '👔', items: ['WIP control tower', 'Bay board', 'Revenue dashboard', 'Approval overrides'] },
  { role: 'Service Advisor', emoji: '📋', items: ['Booking management', 'VOC & inspection', 'Estimate & approval', 'Customer communication'] },
  { role: 'Technician', emoji: '🔧', items: ['Job assignment', 'Start/Pause/Complete', 'Parts requisition', 'Work logging'] },
  { role: 'Parts Manager', emoji: '📦', items: ['Stock management', 'Material issue/return', 'Purchase requisition', 'OTC counter sales'] },
  { role: 'Cashier', emoji: '💰', items: ['Invoice generation', 'Payment collection', 'Outstanding approval', 'Gatepass verification'] },
  { role: 'CRM Executive', emoji: '📞', items: ['Customer follow-ups', 'Feedback & PSF', 'Service reminders', 'Complaint escalation'] },
]

const testimonials = [
  { name: 'Rajesh Kumar', role: 'Owner, Demo Motors', text: 'ZENTROROX transformed our workshop. WIP visibility alone saved us 3 hours daily.', avatar: AVATARS[0], rating: 5 },
  { name: 'Priya Sharma', role: 'Service Manager, AutoCare', text: 'Parts ERP integration with job cards eliminated our inventory mismatches completely.', avatar: AVATARS[1], rating: 5 },
  { name: 'Amit Patel', role: 'GM, Fleet Services', text: 'Multi-branch reporting gives us real-time control across 4 locations. Game changer.', avatar: AVATARS[2], rating: 5 },
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '₹4,999',
    period: '/month',
    desc: 'For single-location independent garages',
    emoji: '🚀',
    features: ['Workshop Management', 'Job Cards & WIP', 'Basic Inventory', 'Billing & Invoices', 'Up to 5 users'],
  },
  {
    name: 'Professional',
    price: '₹9,999',
    period: '/month',
    desc: 'For growing workshops with parts store',
    emoji: '⭐',
    features: ['Everything in Starter', 'Full Parts ERP', 'Procurement Module', 'CRM & PSF', 'Advanced Reports', 'Up to 20 users'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For multi-branch dealer groups & fleets',
    emoji: '🏆',
    features: ['Everything in Professional', 'Multi-Branch', 'Custom Integrations', 'API Access', 'Dedicated Support', 'Unlimited users'],
  },
]

const faqs = [
  { q: 'Is ZENTROROX suitable for multi-brand workshops?', a: 'Yes. ZENTROROX supports multi-brand, multi-location operations with branch-level data isolation and consolidated reporting.' },
  { q: 'Can I migrate from my existing system?', a: 'We provide data migration support for customers, vehicles, parts master and opening stock from Excel or your current ERP.' },
  { q: 'Does it work offline?', a: 'The core application requires connectivity. Mobile modules for technicians and pickup executives support limited offline capture with sync.' },
  { q: 'How is data secured between tenants?', a: 'Every database record is tenant-scoped with strict isolation enforced at the API and database level. RBAC controls access within each tenant.' },
]

const workflowSteps = [
  { step: '01', title: 'Booking', icon: Clock, desc: 'Customer schedules service' },
  { step: '02', title: 'Inspection', icon: Eye, desc: 'Digital vehicle check' },
  { step: '03', title: 'Job Card', icon: Wrench, desc: 'Work authorization' },
  { step: '04', title: 'WIP', icon: Zap, desc: 'Bay & technician tracking' },
  { step: '05', title: 'Billing', icon: Receipt, desc: 'Invoice & payment' },
  { step: '06', title: 'Delivery', icon: Car, desc: 'Gatepass & handover' },
]

function HeroVideo() {
  return (
    <div className="relative w-full max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '150ms' }}>
      <StickerBadge emoji="🔥" label="Live Demo" className="absolute -top-3 -left-4 z-10" delay={0} />
      <StickerBadge emoji="⚡" label="Full Workflow" className="absolute -bottom-2 -left-2 z-10" delay={1000} />

      <div className="absolute -inset-4 bg-brand-yellow/10 rounded-3xl blur-2xl animate-pulse-soft" />
      <div className="relative rounded-2xl border border-brand-border bg-white shadow-2xl overflow-hidden">
        <div className="bg-brand-charcoal px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400 shrink-0" />
            <div className="h-2.5 w-2.5 rounded-full bg-brand-yellow shrink-0" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400 shrink-0" />
            <span className="ml-2 text-xs text-white/60 truncate">{BRAND.name} — Product Walkthrough</span>
          </div>
          <Badge variant="default" className="shrink-0 text-[10px] px-2 py-0.5">
            <Play className="h-3 w-3 mr-1" /> HD
          </Badge>
        </div>
        <video
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
          poster={IMAGES.heroWorkshop}
          aria-label={`${BRAND.name} workshop management software demo video`}
          className="w-full aspect-video object-cover bg-brand-charcoal"
        >
          <source src={VIDEOS.heroWorkshop} type="video/mp4" />
          Your browser does not support embedded video playback.
        </video>
      </div>

      <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-2xl overflow-hidden border-2 border-white shadow-xl hidden sm:block animate-wiggle">
        <img src={GIFS.wrenchSpin} alt="" className="h-full w-full object-cover" />
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-grey to-white hero-pattern">
        <div className="absolute inset-0 opacity-[0.03]">
          <img src={IMAGES.heroWorkshop} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-14 lg:pt-10 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-start">
            <div className="animate-slide-up">
              <Badge variant="default" className="mb-4">
                <Zap className="h-3 w-3 mr-1" /> {BRAND.tagline}
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-brand-charcoal leading-tight tracking-tight">
                Run Your Workshop{' '}
                <span className="text-brand-yellow">Smarter</span> with {BRAND.name}
              </h1>
              <p className="mt-6 text-lg text-brand-muted leading-relaxed max-w-xl">
                One connected automotive service ERP for bookings, job cards, workshop operations,
                spare parts, inventory, billing, customer engagement and management analytics.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['🚗 Multi-brand', '🔧 Job Cards', '📊 Analytics', '📱 Mobile Ready'].map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-white border border-brand-border px-3 py-1 text-xs font-medium text-brand-muted shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <a href="#contact">Book a Demo <ArrowRight className="h-4 w-4" /></a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features" className="flex items-center gap-2">
                    <Play className="h-4 w-4" /> Explore Features
                  </a>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {AVATARS.map((avatar, i) => (
                    <img key={i} src={avatar} alt="" className="h-8 w-8 rounded-full border-2 border-white shadow-sm" />
                  ))}
                </div>
                <p className="text-sm text-brand-muted">
                  Trusted by <strong className="text-brand-charcoal">500+ workshops</strong> across India
                </p>
              </div>
            </div>
            <HeroVideo />
          </div>
        </div>
        <div className="flex justify-center pb-8">
          <ChevronDown className="h-5 w-5 text-brand-muted animate-bounce" />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-brand-border bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center group">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow/10 mb-3 group-hover:bg-brand-yellow/20 transition-colors">
                <s.icon className="h-6 w-6 text-brand-charcoal" />
              </div>
              <p className="text-3xl font-bold text-brand-charcoal">{s.value}</p>
              <p className="text-sm text-brand-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 bg-brand-charcoal text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={IMAGES.garageInterior} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="default" className="mb-4 bg-brand-yellow text-brand-charcoal">Connected Journey</Badge>
            <h2 className="text-3xl font-bold">One Vehicle. One Service Visit.</h2>
            <p className="mt-3 text-white/60 max-w-xl mx-auto">Every stage connected through a single service visit record — no data silos.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {workflowSteps.map((ws, i) => (
              <div key={ws.step} className="text-center group">
                <div className="relative mx-auto mb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow/15 mx-auto group-hover:bg-brand-yellow/25 transition-all group-hover:scale-110">
                    <ws.icon className="h-6 w-6 text-brand-yellow" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow text-[10px] font-bold text-brand-charcoal">
                    {ws.step}
                  </span>
                </div>
                <h3 className="font-semibold text-sm">{ws.title}</h3>
                <p className="text-xs text-white/50 mt-1">{ws.desc}</p>
                {i < workflowSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-brand-yellow/40 mx-auto mt-2 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section id="solutions" className="py-20 bg-brand-grey">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-14">
            <div>
              <h2 className="text-3xl font-bold text-brand-charcoal">Workshop Challenges We Solve</h2>
              <p className="mt-4 text-brand-muted leading-relaxed">Modern workshops need more than spreadsheets. ZENTROROX connects every stage of the service journey.</p>
              <img
                src="/images/car-service.svg"
                alt="Car service illustration"
                className="mt-8 max-w-xs animate-float"
              />
            </div>
            <div className="grid gap-4">
              {challenges.map((c) => (
                <Card key={c.title} className="hover:shadow-[var(--shadow-card-hover)] transition-all hover:-translate-y-0.5">
                  <CardContent className="p-5 flex gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
                      <c.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-brand-charcoal">{c.title}</h3>
                      <p className="mt-1 text-sm text-brand-muted leading-relaxed">{c.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-brand-charcoal">Complete Workshop Lifecycle</h2>
            <p className="mt-4 text-brand-muted">From the first booking to post-service follow-up — every transaction connected through one service visit.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="group hover:shadow-[var(--shadow-card-hover)] transition-all hover:-translate-y-1 overflow-hidden">
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={f.image}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-yellow/90 backdrop-blur-sm">
                    <f.icon className="h-5 w-5 text-brand-charcoal" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-brand-charcoal">{f.title}</h3>
                  <p className="mt-2 text-sm text-brand-muted leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo GIF Section */}
      <section className="py-16 bg-brand-grey">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-brand-border">
              <img src={GIFS.carRepair} alt="Workshop in action" className="w-full h-64 object-cover" />
            </div>
            <div>
              <Badge variant="default" className="mb-4">
                <Award className="h-3 w-3 mr-1" /> Industry Leading
              </Badge>
              <h2 className="text-2xl font-bold text-brand-charcoal">Built for the Indian Aftermarket</h2>
              <p className="mt-4 text-brand-muted leading-relaxed">
                From independent garages to multi-location dealer groups — ZENTROROX adapts to your workflow.
                Real-time WIP tracking, integrated parts ERP, and customer engagement tools in one platform.
              </p>
              <ul className="mt-6 space-y-3">
                {['GST-compliant billing', 'Multi-language support', 'WhatsApp notifications', 'DMS integrations'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-brand-muted">
                    <CheckCircle2 className="h-4 w-4 text-brand-success shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Role Use Cases */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-brand-charcoal">Built for Every Role</h2>
            <p className="mt-4 text-brand-muted">Configurable permissions ensure each team member sees exactly what they need.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((r) => (
              <Card key={r.role} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{r.emoji}</span>
                    <h3 className="font-semibold text-brand-charcoal">{r.role}</h3>
                  </div>
                  <ul className="space-y-2">
                    {r.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-brand-muted">
                        <CheckCircle2 className="h-4 w-4 text-brand-success shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-brand-grey">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-charcoal">What Workshop Owners Say</h2>
            <p className="mt-3 text-brand-muted">Real results from real workshops across India</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-brand-yellow text-brand-yellow" />
                    ))}
                  </div>
                  <p className="text-sm text-brand-muted leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-yellow/30" />
                    <div>
                      <p className="text-sm font-semibold text-brand-charcoal">{t.name}</p>
                      <p className="text-xs text-brand-muted">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-brand-charcoal">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-brand-muted">Choose the plan that fits your workshop. Upgrade as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className={plan.popular ? 'ring-2 ring-brand-yellow relative md:scale-105 shadow-xl' : 'hover:shadow-[var(--shadow-card-hover)] transition-shadow'}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plan.emoji}</span>
                    <h3 className="font-semibold text-brand-charcoal">{plan.name}</h3>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-brand-muted">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-brand-muted">{plan.desc}</p>
                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-brand-muted">
                        <CheckCircle2 className="h-4 w-4 text-brand-success shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant={plan.popular ? 'default' : 'outline'} asChild>
                    <a href="#contact">{plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-brand-grey">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-brand-charcoal text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-brand-charcoal flex items-start gap-2">
                    <Headphones className="h-5 w-5 text-brand-yellow shrink-0 mt-0.5" />
                    {faq.q}
                  </h3>
                  <p className="mt-2 text-sm text-brand-muted leading-relaxed ml-7">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMAGES.teamWorkshop} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-brand-charcoal/80" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center text-white">
          <span className="text-4xl mb-4 block">🚀</span>
          <h2 className="text-3xl font-bold">Ready to Transform Your Workshop?</h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Book a personalized demo and see how ZENTROROX can streamline your entire service operation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
                <a href="mailto:demo@zentrorox.com">
                <Headphones className="h-4 w-4" /> Book a Demo
              </a>
            </Button>
            <Button size="lg" variant="dark" asChild>
              <Link to="/login">Login to App</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 border-t border-brand-border">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <img
              src={IMAGES.heroWorkshop}
              alt="Workshop"
              className="rounded-2xl shadow-lg object-cover h-64 w-full"
            />
            <div>
              <h2 className="text-2xl font-bold text-brand-charcoal">About ZENTROROX</h2>
              <p className="mt-4 text-brand-muted leading-relaxed">
                ZENTROROX is built for the Indian automotive aftermarket — independent garages, authorized workshops,
                dealer service centres, fleet operators and multi-location service chains. Our mission is to digitize
                the complete service journey with one connected platform.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {['🇮🇳 Made for India', '🏭 500+ Workshops', '🔒 Enterprise Security', '📱 Mobile First'].map((badge) => (
                  <span key={badge} className="inline-flex items-center rounded-full bg-brand-grey px-3 py-1.5 text-xs font-medium text-brand-muted">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
