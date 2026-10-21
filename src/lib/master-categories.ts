export const MASTER_CATEGORIES = {
  SERVICE_TYPE: { label: 'Service Types', description: 'Used in bookings and job cards', emoji: '🔧' },
  VEHICLE_MAKE: { label: 'Vehicle Makes', description: 'Used when registering vehicles', emoji: '🚗' },
  VEHICLE_MODEL: { label: 'Vehicle Models', description: 'Linked to vehicle make', emoji: '🏷️' },
  FUEL_TYPE: { label: 'Fuel Types', description: 'Petrol, diesel, electric', emoji: '⛽' },
  BAY_TYPE: { label: 'Bay Types', description: 'Workshop bay configuration', emoji: '🏭' },
  JOB_TYPE: { label: 'Job Types', description: 'Job card classification', emoji: '📋' },
  BOOKING_SOURCE: { label: 'Booking Sources', description: 'How the customer booked', emoji: '📞' },
  PAYMENT_MODE: { label: 'Payment Modes', description: 'Billing and receipts', emoji: '💳' },
  APPROVAL_SOURCE: { label: 'Approval Sources', description: 'How customer approval was obtained', emoji: '✅' },
  COMPLAINT_TYPE: { label: 'Complaint Types', description: 'Voice of customer capture', emoji: '⚠️' },
  INVENTORY_DOCUMENT: { label: 'Receiving — Documents', description: 'Inventory checklist at gate-in', emoji: '📄' },
  INVENTORY_KEY: { label: 'Receiving — Keys', description: 'Keys checklist at gate-in', emoji: '🔑' },
  INVENTORY_TOOL: { label: 'Receiving — Tools', description: 'Tools checklist at gate-in', emoji: '🧰' },
  INVENTORY_ACCESSORY: { label: 'Receiving — Accessories', description: 'Accessories checklist at gate-in', emoji: '🎒' },
} as const

export type MasterCategory = keyof typeof MASTER_CATEGORIES
