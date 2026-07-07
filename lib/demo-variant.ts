export type DemoVariant = 'quote_form' | 'ios_app'

export const DEMO_VARIANT_COOKIE = 'qb_demo_variant'

export function isDemoVariant(value: string | undefined | null): value is DemoVariant {
  return value === 'quote_form' || value === 'ios_app'
}

export function pickDemoVariant(): DemoVariant {
  return Math.random() < 0.5 ? 'quote_form' : 'ios_app'
}
