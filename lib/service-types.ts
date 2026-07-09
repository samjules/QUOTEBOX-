import type { FormField } from './types'

export type ServiceId = 'moving' | 'junk_removal' | 'pressure_washing' | 'car_detailing'

export interface ServiceTypeConfig {
  id: ServiceId
  label: string
  desc: string
  color: string
  sizeFieldLabel: string
  tierLabels: [string, string, string]
  defaultTierHours: [number, number, number]
  defaultHourlyRate: number
  rateHint: string
  routeFieldLabel: string
  extras: { label: string; price: string }[]
  formDescription: string
}

export const SERVICE_TYPES: ServiceTypeConfig[] = [
  {
    id: 'moving',
    label: 'Moving',
    desc: 'Local & long-distance residential moves',
    color: '#F97316',
    sizeFieldLabel: 'Home Size',
    tierLabels: ['Studio / 1 Bedroom', '2–3 Bedrooms', '4+ Bedrooms'],
    defaultTierHours: [3, 5, 8],
    defaultHourlyRate: 120,
    rateHint: 'Most moving companies charge $80–$150/hr.',
    routeFieldLabel: 'Moving Route',
    extras: [
      { label: 'Packing & Unpacking', price: '150' },
      { label: 'Piano / Heavy Items', price: '100' },
      { label: 'Long Carry (>75 ft)', price: '75' },
    ],
    formDescription: 'Get an instant quote for your moving job.',
  },
  {
    id: 'junk_removal',
    label: 'Junk Removal',
    desc: 'Furniture, appliance & property cleanouts',
    color: '#22C55E',
    sizeFieldLabel: 'Load Size',
    tierLabels: ['1/4 Truck Load', '1/2 Truck Load', 'Full Truck Load'],
    defaultTierHours: [1, 2, 3],
    defaultHourlyRate: 150,
    rateHint: 'Most junk removal companies charge $150–$250/hr for a 2-man crew.',
    routeFieldLabel: 'Pickup Location',
    extras: [
      { label: 'Mattress / Box Spring', price: '40' },
      { label: 'Appliance Disposal', price: '60' },
      { label: 'Heavy Item Fee (piano, safe, hot tub)', price: '100' },
    ],
    formDescription: 'Get an instant quote for your junk removal job.',
  },
  {
    id: 'pressure_washing',
    label: 'Pressure Washing',
    desc: 'Driveways, siding & exterior cleaning',
    color: '#3B82F6',
    sizeFieldLabel: 'Job Size',
    tierLabels: ['Driveway / Walkway', 'House Exterior', 'Full Property'],
    defaultTierHours: [1, 2, 4],
    defaultHourlyRate: 100,
    rateHint: 'Most pressure washing businesses charge $75–$125/hr.',
    routeFieldLabel: 'Service Address',
    extras: [
      { label: 'Gutter Cleaning', price: '75' },
      { label: 'Deck / Fence Staining', price: '150' },
      { label: 'Second Story / Extra Height', price: '50' },
    ],
    formDescription: 'Get an instant quote for your pressure washing job.',
  },
  {
    id: 'car_detailing',
    label: 'Car Detailing',
    desc: 'Mobile auto detailing & ceramic coating',
    color: '#8B5CF6',
    sizeFieldLabel: 'Vehicle Size',
    tierLabels: ['Sedan / Coupe', 'SUV / Truck', 'Van / Oversized'],
    defaultTierHours: [1.5, 2, 2.5],
    defaultHourlyRate: 90,
    rateHint: 'Most mobile detailers charge $70–$120/hr.',
    routeFieldLabel: 'Service Location',
    extras: [
      { label: 'Ceramic Coating', price: '200' },
      { label: 'Pet Hair Removal', price: '50' },
      { label: 'Engine Bay Cleaning', price: '40' },
    ],
    formDescription: 'Get an instant quote for your detailing job.',
  },
]

export function getServiceType(id: string | undefined | null): ServiceTypeConfig {
  return SERVICE_TYPES.find((s) => s.id === id) ?? SERVICE_TYPES[0]
}

function fid() { return Math.random().toString(36).slice(2, 9) }

// option.price is the hourly RATE, not the total — pricing.ts multiplies price × hours
// itself, so a pre-multiplied total here would double-charge.
export function sizeField(service: ServiceTypeConfig, hourlyRate: number, tierHours: number[]): FormField {
  return {
    id: fid(), type: 'radio', label: service.sizeFieldLabel, required: true, showPrices: true,
    options: service.tierLabels.map((label, i) => ({ id: fid(), label, price: hourlyRate, hours: tierHours[i] || 1 })),
  }
}

// Drive time is charged as (distance ÷ the business's average mph) hours × their
// drive-time rate — never a flat fee, since that ignores how far the job actually is.
export function routeField(service: ServiceTypeConfig, driveRatePerHour: number): FormField {
  return {
    id: fid(), type: 'route', label: service.routeFieldLabel, required: true,
    routeChargeType: 'drivetime',
    locationMode: 'point_to_point',
    ratePerMinute: driveRatePerHour / 60,
  } as FormField
}

export function addonsField(service: ServiceTypeConfig): FormField {
  return {
    id: fid(), type: 'checkbox', label: 'Add-ons', required: false,
    options: service.extras.map((e) => ({ id: fid(), label: e.label, price: parseFloat(e.price) || 0 })),
  }
}

export function notesField(): FormField {
  return { id: fid(), type: 'textarea', label: 'Additional Notes', required: false, placeholder: 'Any special instructions or details about the job…' }
}
