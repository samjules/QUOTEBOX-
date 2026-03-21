export interface Account {
  id: string
  owner_id: string
  business_name: string
  phone?: string
  created_at: string
  updated_at: string
  meta_access_token?: string
  meta_ad_account_id?: string
  meta_user_id?: string
  meta_connected_at?: string
  stripe_connect_account_id?: string | null
  stripe_connect_completed_at?: string | null
}

export interface FieldOption {
  id: string
  label: string
  price: number
  // Per-option rate overrides applied to other fields when this option is selected
  rateOverrides?: Record<string, number>                              // fieldId → ratePerUnit (number fields)
  routeOverrides?: Record<string, { mile?: number; min?: number }>   // fieldId → route rates
}

export interface RuleCondition {
  id: string
  whenFieldId: string   // ID of the field to watch
  whenValue: string     // Option ID (or value) to match on the watched field
}

export interface ConditionalRule {
  id: string
  conditions: RuleCondition[]  // ALL must be true (AND logic)
  rate: number                 // Rate to use when all conditions are met
}

export interface FormField {
  id: string
  type: 'radio' | 'dropdown' | 'checkbox' | 'number' | 'textarea' | 'route' | 'image' | 'draw_area' | 'booking'
  label: string
  required: boolean
  options?: FieldOption[]
  showPrices?: boolean       // default true — show/hide price badges on options
  placeholder?: string
  ratePerUnit?: number
  // Route field
  routeChargeType?: 'mileage' | 'drivetime' | 'both' | 'none'
  locationMode?: 'point_to_point' | 'single'  // single = customer enters one address only
  ratePerMile?: number
  ratePerMinute?: number     // stored as per-minute; UI displays as per-hour
  baseAddress?: string       // optional fixed start location (business base)
  imageUrl?: string
  conditionalRules?: ConditionalRule[]
  // Draw Area field
  ratePerSqFt?: number
}

export interface FormConfig {
  slug: string
  description: string
  submit_label: string
  currency: string
  brand_color: string
  show_total: boolean
  quote_display?: 'live' | 'after_submit' | 'hidden'
  hero_image_url?: string
  fields: FormField[]
  meta_pixel_id?: string
  min_quote?: number
  email_template?: {
    subject?: string
    intro?: string
    outro?: string
    header_image?: string
    accent_color?: string
  }
}

export interface HostedForm {
  id: string
  account_id: string
  form_name: string
  form_type: string
  form_config: FormConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  account_id: string
  hosted_form_id: string | null
  name: string | null
  email: string | null
  phone: string | null
  form_type: string | null
  form_data: Record<string, unknown> | null
  status: 'new' | 'contacted' | 'booked' | 'lost' | 'held'
  created_at: string
  notes?: string | null
}

export interface Billing {
  id: string
  account_id: string
  credit_balance: number
  total_spent: number
  plan: 'starter' | 'growth' | 'fully_managed' | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface BillingTransaction {
  id: string
  account_id: string
  type: 'lead_charge' | 'credit_purchase'
  amount: number
  balance_after: number
  description: string
  created_at: string
}

export interface VSL {
  id: string
  account_id: string
  title: string
  file_name: string
  file_url: string
  storage_path: string
  file_size: number
  created_at: string
}

// ── Pay-Per-Lead Onboarding ──

export interface ServiceItem {
  id: string
  name: string
  price: number
  priceType: 'flat' | 'starting_at'
}

export interface AddOnItem {
  id: string
  name: string
  price: number
}

export interface OnboardingStep1Data {
  businessName: string
  tradeType: string
  serviceAreaType: 'radius' | 'zip_codes'
  serviceAreaRadius?: number
  serviceAreaAddress?: string
  serviceAreaZipCodes?: string[]
  businessDescription: string
}

export interface OnboardingStep2Data {
  hasPackages: boolean
  services: ServiceItem[]
  displayPreference: 'radio' | 'dropdown'
  addOns: AddOnItem[]
}

export interface OnboardingStep3Data {
  perSqft: boolean
  sqftRate?: number
  sqftMethod?: 'enter_number' | 'draw_on_map'
  travelCharges: boolean
  travelType?: 'mileage' | 'drivetime' | 'both'
  ratePerMile?: number
  ratePerMinute?: number
  baseLocation?: string
  byQuantity: boolean
  quantityLabel?: string
  ratePerUnit?: number
  minimumJobPrice?: number
}

export interface OnboardingStep4Data {
  maxLeadsPerDay?: number
  maxLeadsPerWeek?: number
  monthlyBudgetCap?: number
  preferredLeadTypes: string[]
  businessHours: Record<string, { enabled: boolean; start: string; end: string }>
  additionalNotes?: string
}

export type OnboardingStepData = {
  1?: OnboardingStep1Data
  2?: OnboardingStep2Data
  3?: OnboardingStep3Data
  4?: OnboardingStep4Data
}

export interface OnboardingSession {
  id: string
  account_id: string
  token: string
  status: 'pending' | 'in_progress' | 'completed' | 'form_built'
  step_data: OnboardingStepData
  current_step: number
  created_by: string | null
  created_at: string
  updated_at: string
}
