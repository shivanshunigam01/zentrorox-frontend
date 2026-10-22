import type { SeoPageKey } from '@/seo/seo-pages'

export type MarketingBlock = {
  intro: string
  bullets: string[]
  ctaLabel: string
  ctaHref: string
  relatedLinks: { label: string; href: string }[]
}

export const MARKETING_COPY: Partial<Record<SeoPageKey, MarketingBlock>> = {
  features: {
    intro:
      'ZENTROROX connects every stage of the workshop journey — from booking and gate-in to inspection, job cards, parts, billing and delivery — in one multi-tenant platform.',
    bullets: [
      'Digital job cards with WIP, bay and technician visibility',
      'Vehicle inspection with photos, checklists and findings',
      'Spare parts inventory, requisitions and issue tracking',
      'Billing, payments, gate pass and delivery handover',
      'CRM, service history and post-service follow-up',
      'Role-based access and audit trail for every action',
    ],
    ctaLabel: 'Book a demo',
    ctaHref: '/contact',
    relatedLinks: [
      { label: 'Workshop management', href: '/automotive-workshop-management-software' },
      { label: 'Job cards', href: '/job-card-management-software' },
      { label: 'Inventory', href: '/workshop-inventory-management' },
    ],
  },
  workshop: {
    intro:
      'Run daily workshop operations with connected queues for bookings, receiving, inspections, estimates, approvals and floor execution.',
    bullets: [
      'Service visit hub with stage-based workflow',
      'Advisor and manager dashboards',
      'Multi-branch access with tenant isolation',
      'Real-time WIP and ageing visibility',
    ],
    ctaLabel: 'See all features',
    ctaHref: '/features',
    relatedLinks: [
      { label: 'Vehicle inspection', href: '/vehicle-inspection-software' },
      { label: 'Job card software', href: '/job-card-management-software' },
    ],
  },
  'job-cards': {
    intro:
      'Replace paper job cards with digital work authorization, technician assignment, additional work requests and progress tracking tied to each vehicle visit.',
    bullets: [
      'Create job cards from approved estimates',
      'Assign bays and technicians',
      'Track labour and parts against the job',
      'Print or share job card PDFs when configured',
    ],
    ctaLabel: 'Talk to sales',
    ctaHref: '/contact',
    relatedLinks: [{ label: 'WIP & floor', href: '/automotive-workshop-management-software' }],
  },
  inventory: {
    intro:
      'Manage spare parts master, stock balances, material requisitions, issues to job cards, returns and purchase workflows without leaving the workshop ERP.',
    bullets: [
      'Stock ledger with available and reserved quantities',
      'Low-stock and reorder visibility',
      'Parts issue and return linked to job cards',
      'OTC counter sales from parts desk',
    ],
    ctaLabel: 'View pricing',
    ctaHref: '/pricing',
    relatedLinks: [{ label: 'Billing', href: '/workshop-billing-software' }],
  },
  billing: {
    intro:
      'Generate itemized invoices from completed work, record payments, manage outstanding balances and control vehicle delivery with gate pass rules.',
    bullets: [
      'Invoice lines from labour and parts consumption',
      'Payment recording and reconciliation',
      'Credit notes and outstanding tracking',
      'Delivery and gate pass coordination',
    ],
    ctaLabel: 'Contact us',
    ctaHref: '/contact',
    relatedLinks: [{ label: 'CRM', href: '/workshop-crm' }],
  },
  inspection: {
    intro:
      'Capture customer complaints (VOC), structured inspection checklists, trial findings and QC steps before estimates and job cards are created.',
    bullets: [
      'Advisor VOC and customer acknowledgment',
      'Configurable inspection templates',
      'Photo evidence on service visits',
      'QC and road-test workflow hooks',
    ],
    ctaLabel: 'Explore features',
    ctaHref: '/features',
    relatedLinks: [{ label: 'Job cards', href: '/job-card-management-software' }],
  },
  crm: {
    intro:
      'Keep customers, vehicles and service history in one place with follow-ups, feedback and complaint queues aligned to workshop stages.',
    bullets: [
      'Customer and vehicle master records',
      'Service visit history per vehicle',
      'CRM queues for PSF and complaints',
      'Communication context for advisors',
    ],
    ctaLabel: 'Book a demo',
    ctaHref: '/contact',
    relatedLinks: [{ label: 'Workshop CRM journeys', href: '/features' }],
  },
  about: {
    intro:
      'ZENTROROX is built for Indian automotive workshops and service centres that need one connected system instead of disconnected spreadsheets and legacy tools.',
    bullets: [
      'Multi-tenant SaaS with strict data isolation',
      'Configurable roles and permissions',
      'Designed around real workshop stages',
      'Continuous delivery with secure cloud hosting',
    ],
    ctaLabel: 'Get in touch',
    ctaHref: '/contact',
    relatedLinks: [{ label: 'Features', href: '/features' }],
  },
  contact: {
    intro:
      'Request a demo or ask about deployment, data migration, training and multi-branch rollout for your workshop.',
    bullets: [
      'Email: demo@zentrorox.com',
      'Workshop software demos for managers and advisors',
      'Implementation planning for parts and billing modules',
    ],
    ctaLabel: 'Sign in (existing customers)',
    ctaHref: '/login',
    relatedLinks: [{ label: 'Pricing', href: '/pricing' }],
  },
  pricing: {
    intro:
      'Indicative plans are shown on the homepage for Starter, Professional and Enterprise tiers. Final pricing depends on users, branches and modules — contact us for a quote.',
    bullets: [
      'Starter — core workshop, job cards and billing',
      'Professional — full parts ERP and CRM',
      'Enterprise — multi-branch and custom integrations',
    ],
    ctaLabel: 'Book a demo',
    ctaHref: '/contact',
    relatedLinks: [{ label: 'Features', href: '/features' }],
  },
}
