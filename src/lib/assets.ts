/** Curated visual assets for ZentroSure UI */
export const IMAGES = {
  heroWorkshop:
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&q=80&auto=format&fit=crop',
  mechanicWorking:
    'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80&auto=format&fit=crop',
  carService:
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80&auto=format&fit=crop',
  garageInterior:
    'https://images.unsplash.com/photo-1487754180451-c78737614573?w=800&q=80&auto=format&fit=crop',
  dashboardPreview:
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80&auto=format&fit=crop',
  teamWorkshop:
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80&auto=format&fit=crop',
  spareParts:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop',
  customerHappy:
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80&auto=format&fit=crop',
  carHonda:
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80&auto=format&fit=crop',
  carHyundai:
    'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600&q=80&auto=format&fit=crop',
  carMaruti:
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80&auto=format&fit=crop',
  carToyota:
    'https://images.unsplash.com/photo-1621007947382-bcb705c16607?w=600&q=80&auto=format&fit=crop',
  carTata:
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80&auto=format&fit=crop',
  bayFloor:
    'https://images.unsplash.com/photo-1487754180451-c78737614573?w=800&q=80&auto=format&fit=crop',
} as const

export const VIDEOS = {
  heroWorkshop: '/videos/hero-workshop.mp4',
} as const

export const GIFS = {
  carRepair: 'https://media.giphy.com/media/l0MYC0LajboP0N7WM/giphy.gif',
  wrenchSpin: 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif',
  dashboardAnim: 'https://media.giphy.com/media/26BRvS0sVtK6DB658/giphy.gif',
  mechanicWorking: 'https://media.giphy.com/media/3o6Zt481isNVnfBI20/giphy.gif',
  carDrive: 'https://media.giphy.com/media/l0HlBO7yoX6IOHJzG/giphy.gif',
  checkDone: 'https://media.giphy.com/media/8tSyv2nd0Ddqw/giphy.gif',
} as const

export const STICKERS = {
  live: '🔥',
  verified: '✅',
  fast: '⚡',
  new: '🆕',
  hot: '🏆',
  secure: '🔒',
  mobile: '📱',
  money: '💰',
  parts: '📦',
  car: '🚗',
  wrench: '🔧',
  star: '⭐',
  rocket: '🚀',
  chart: '📊',
  phone: '📞',
} as const

export const AVATARS = [
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=33',
  'https://i.pravatar.cc/150?img=45',
  'https://i.pravatar.cc/150?img=68',
  'https://i.pravatar.cc/150?img=51',
  'https://i.pravatar.cc/150?img=27',
] as const

export const ILLUSTRATIONS = {
  carService: '/images/car-service.svg',
  emptyWorkshop: '/images/empty-workshop.svg',
  parts: '/images/parts-inventory.svg',
  billing: '/images/billing.svg',
  workshop: '/images/workshop.svg',
  crm: '/images/crm.svg',
} as const

const makeImageMap: Record<string, string> = {
  Honda: IMAGES.carHonda,
  Hyundai: IMAGES.carHyundai,
  Maruti: IMAGES.carMaruti,
  Toyota: IMAGES.carToyota,
  Tata: IMAGES.carTata,
}

export function getVehicleImage(make: string): string {
  return makeImageMap[make] ?? IMAGES.carService
}
