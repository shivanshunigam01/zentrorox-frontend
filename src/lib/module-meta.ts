import type { LucideIcon } from 'lucide-react'
import {
  Calendar, Truck, DoorOpen, ClipboardCheck, MessageSquare, Search,
  Stethoscope, FileText, CheckSquare, Wrench, LayoutGrid, Users,
  Activity, ShieldCheck, Car, Package, Database, ShoppingCart, Receipt,
  CreditCard, BarChart3, Settings, SlidersHorizontal, Inbox,
} from 'lucide-react'
import { ILLUSTRATIONS } from './assets'

export interface ModuleMeta {
  icon: LucideIcon
  gradient: string
  emoji: string
  illustration?: string
}

const defaultMeta: ModuleMeta = {
  icon: Inbox,
  gradient: 'from-slate-700 to-slate-900',
  emoji: '📋',
  illustration: ILLUSTRATIONS.emptyWorkshop,
}

const metaByPath: Record<string, Partial<ModuleMeta>> = {
  bookings: { icon: Calendar, gradient: 'from-blue-600 to-indigo-700', emoji: '📅', illustration: ILLUSTRATIONS.workshop },
  pickup: { icon: Truck, gradient: 'from-emerald-600 to-teal-700', emoji: '🚚' },
  'gate-in': { icon: DoorOpen, gradient: 'from-slate-600 to-zinc-800', emoji: '🚧' },
  receiving: { icon: ClipboardCheck, gradient: 'from-cyan-600 to-blue-700', emoji: '📋' },
  voc: { icon: MessageSquare, gradient: 'from-violet-600 to-purple-700', emoji: '💬' },
  inspection: { icon: Search, gradient: 'from-amber-600 to-orange-700', emoji: '🔍' },
  diagnosis: { icon: Stethoscope, gradient: 'from-rose-600 to-pink-700', emoji: '🩺' },
  estimates: { icon: FileText, gradient: 'from-yellow-500 to-amber-600', emoji: '💰' },
  approvals: { icon: CheckSquare, gradient: 'from-green-600 to-emerald-700', emoji: '✅' },
  'job-cards': { icon: Wrench, gradient: 'from-brand-charcoal to-brand-charcoal-light', emoji: '🔧', illustration: ILLUSTRATIONS.workshop },
  floor: { icon: LayoutGrid, gradient: 'from-indigo-600 to-violet-700', emoji: '🏭' },
  'bay-board': { icon: LayoutGrid, gradient: 'from-teal-600 to-cyan-700', emoji: '🅿️' },
  'technician-board': { icon: Users, gradient: 'from-orange-600 to-red-600', emoji: '👷' },
  wip: { icon: Activity, gradient: 'from-brand-charcoal to-brand-charcoal-light', emoji: '⚡', illustration: ILLUSTRATIONS.carService },
  qc: { icon: ShieldCheck, gradient: 'from-green-600 to-teal-700', emoji: '🛡️' },
  'road-test': { icon: Car, gradient: 'from-sky-600 to-blue-700', emoji: '🛣️' },
  delivery: { icon: Truck, gradient: 'from-lime-600 to-green-700', emoji: '🎉' },
  dashboard: { icon: Package, gradient: 'from-amber-600 to-yellow-600', emoji: '📦', illustration: ILLUSTRATIONS.parts },
  master: { icon: Database, gradient: 'from-purple-600 to-indigo-700', emoji: '🗂️' },
  stock: { icon: Package, gradient: 'from-orange-600 to-amber-700', emoji: '📦', illustration: ILLUSTRATIONS.parts },
  requisition: { icon: FileText, gradient: 'from-blue-600 to-cyan-700', emoji: '📝' },
  issue: { icon: Package, gradient: 'from-red-600 to-orange-700', emoji: '📤' },
  'otc-sales': { icon: ShoppingCart, gradient: 'from-green-600 to-lime-700', emoji: '🛒' },
  invoice: { icon: Receipt, gradient: 'from-emerald-600 to-green-700', emoji: '🧾', illustration: ILLUSTRATIONS.billing },
  receipts: { icon: CreditCard, gradient: 'from-teal-600 to-emerald-700', emoji: '💳' },
  customers: { icon: Users, gradient: 'from-blue-600 to-indigo-700', emoji: '👥', illustration: ILLUSTRATIONS.crm },
  leads: { icon: Users, gradient: 'from-violet-600 to-purple-700', emoji: '🎯' },
  reports: { icon: BarChart3, gradient: 'from-brand-charcoal to-slate-800', emoji: '📊' },
  masters: { icon: Database, gradient: 'from-slate-600 to-gray-800', emoji: '⚙️' },
  administration: { icon: Settings, gradient: 'from-zinc-700 to-neutral-900', emoji: '🔐' },
  settings: { icon: SlidersHorizontal, gradient: 'from-gray-600 to-slate-800', emoji: '🎛️' },
}

export function getModuleMeta(pathname: string): ModuleMeta {
  const segment = pathname.split('/').filter(Boolean).pop() ?? ''
  const partial = metaByPath[segment]
  return { ...defaultMeta, ...partial }
}
