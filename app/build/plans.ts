export type PlanId = 'software_99' | 'ad_setup_350' | 'fully_managed_750'

export const PLAN_DEFS: Record<PlanId, { name: string; priceLabel: string; dueToday: string; checkoutNote: string }> = {
  software_99: { name: 'Software', priceLabel: '$99/mo', dueToday: '$99', checkoutNote: 'Renews monthly at $99 · Cancel anytime' },
  ad_setup_350: { name: 'Paid Ad Campaign Setup', priceLabel: '$350 one-time', dueToday: '$350', checkoutNote: 'One-time payment · No subscription' },
  fully_managed_750: { name: 'Fully Managed', priceLabel: '$750/mo', dueToday: '$750', checkoutNote: 'Renews monthly at $750 · Cancel anytime' },
}

export function resolvePlan(value: string | null): PlanId {
  return value === 'ad_setup_350' || value === 'fully_managed_750' ? value : 'software_99'
}
