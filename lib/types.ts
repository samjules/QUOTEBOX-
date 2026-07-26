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
  meta_page_id?: string
  meta_allowed_form_ids?: string[]
  stripe_connect_account_id?: string | null
  stripe_connect_completed_at?: string | null
  agreement_template_url?: string | null
  logo_url?: string | null
  upsell_purchased_at?: string | null
  avg_driving_mph?: number | null
  signup_source?: string | null
  monthly_booking_goal?: number | null
}

export interface FieldOption {
  id: string
  label: string
  price: number
  hours?: number                                                      // optional hours — total = price × hours
  // Per-option rate overrides applied to other fields when this option is selected
  rateOverrides?: Record<string, number>                              // fieldId → ratePerUnit (number fields)
  routeOverrides?: Record<string, { mile?: number; min?: number }>   // fieldId → route rates
  sliderValue?: number  // slider (stops mode): track position for this stop
}

export interface RampPoint {
  value: number  // raw slider value
  hours: number  // hours billed at that value — piecewise-linear between points, clamped flat beyond the first/last
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

export interface RadiusTier {
  id: string
  maxMiles: number | null  // null = unlimited / catch-all tier
  driveCharge: number      // flat dollar drive charge for this distance band
  driveTimeHours?: number  // deprecated — kept only for backward compat with old saved forms
}

export interface FormField {
  id: string
  type: 'radio' | 'dropdown' | 'checkbox' | 'number' | 'textarea' | 'route' | 'image' | 'draw_area' | 'booking' | 'slider'
  label: string
  required: boolean
  options?: FieldOption[]
  showPrices?: boolean       // default true — show/hide price badges on options
  placeholder?: string
  ratePerUnit?: number
  // Route field
  routeChargeType?: 'mileage' | 'drivetime' | 'both' | 'none' | 'radius_tiers'
  locationMode?: 'point_to_point' | 'single'  // single = customer enters one address only
  ratePerMile?: number
  ratePerMinute?: number     // stored as per-minute; UI displays as per-hour
  freeMiles?: number         // don't charge mileage until this many miles
  freeMinutes?: number       // don't charge drive time until this many minutes (stored as minutes; UI shows hours)
  baseAddress?: string       // optional fixed start location (business base)
  radiusTiers?: RadiusTier[] // distance tiers — each adds a flat drive charge
  baseRateFieldId?: string   // radius_tiers: field whose selected option.price is the hourly rate
  jobHoursFieldId?: string   // radius_tiers: field whose selected option.hours is the job hours
  imageUrl?: string
  conditionalRules?: ConditionalRule[]
  // Draw Area field
  ratePerSqFt?: number
  // Slider field
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  sliderUnitLabel?: string             // e.g. "boxes", "large items"
  sliderMode?: 'stops' | 'continuous'  // stops: snaps to `options` (priced like radio); continuous: raw numeric value fed through continuousRamp
  continuousRateFieldId?: string       // continuous mode: field whose selected option's price is the $/hr to bill the ramp's hours against
  continuousRamp?: RampPoint[]         // continuous mode: value → hours mapping (≥2 points, sorted by value)
}

export interface QuizAnswer {
  id: string
  label: string
  next: string  // node id or 'result_XXX'
}

export interface QuizNode {
  id: string
  question: string
  answers: QuizAnswer[]
}

export interface QuizResult {
  id: string
  headline: string
  body: string
  discount: string
  cta_label: string
  image_url?: string
}

export interface QuizConfig {
  start: string
  nodes: Record<string, QuizNode>
  results: Record<string, QuizResult>
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
  range_buffer_hours?: number  // hours assumed for the high end of the estimate range (default 5)
  range_reason?: string        // custom explanation for why there's a range (e.g. "bigger truck may be needed") — overrides the default buffer-hours message
  open_ended_estimate?: boolean  // show the total as a minimum only, no upper range, regardless of range_buffer_hours
  open_ended_text?: string       // note shown under the total when open_ended_estimate is true (e.g. "This is a minimum — there's no maximum")
  disclaimer_enabled?: boolean
  disclaimer_text?: string
  send_email_estimate?: boolean
  confirm_title?: string
  confirm_message?: string
  next_step_label?: string
  total_label?: string
  phone_number?: string
  email_template?: {
    subject?: string
    intro?: string
    outro?: string
    header_image?: string
    accent_color?: string
  }
  quiz?: QuizConfig
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
  plan: 'pro' | 'starter' | 'growth' | 'fully_managed' | 'pay_per_lead' | 'trial' | null
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

// ── Pay-Per-Lead Onboarding (v2) ──

export interface PPLServiceArea {
  type: 'radius' | 'zipcodes'
  location: string
  locationResolved: string
  radiusMiles: number | null
  zipCodes: string[]
}

export interface PPLBusiness {
  name: string
  trade: string
  tradeOther: string | null
  serviceArea: PPLServiceArea
}

export interface PPLService {
  id: string
  name: string
  pricingMethod: 'hourly' | 'sqft' | 'flat' | 'perunit' | null
  pricingRate: number | null
  pricingUnit: string | null
  description: string | null
  photoUploadEnabled: boolean
  photoUploadPrompt: string | null
}

export interface PPLTravel {
  chargesForTravel: boolean
  travelFrom: string | null
  travelFromResolved: string | null
  travelMethod: 'drivetime' | 'mileage' | null
  travelRate: number | null
}

export interface PPLDayHours {
  open: boolean
  from: string
  to: string
}

export interface PPLAvailability {
  hours: Record<string, PPLDayHours>
  maxLeadsPerDay: number | null
  maxLeadsPerWeek: number | null
  customerNote: string | null
}

export interface PPLOnboardingData {
  business: PPLBusiness
  services: PPLService[]
  travel: PPLTravel
  minimumJobPrice: number | null
  availability: PPLAvailability
}

// Step-keyed version for API persistence
export type OnboardingStepData = {
  1?: PPLBusiness
  2?: { services: PPLService[] }
  3?: { travel: PPLTravel; minimumJobPrice: number | null }
  4?: PPLAvailability
  5?: { metaConnected: boolean; metaSkipped?: boolean }
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

// ── Employee / Team ──

export interface AccountMember {
  id: string
  account_id: string
  user_id: string | null
  email: string
  name: string | null
  role: 'owner' | 'employee'
  invite_token: string | null
  invited_at: string
  accepted_at: string | null
  created_at: string
}

// ── Time Clock ──

export interface TimeEntry {
  id: string
  account_id: string
  user_id: string
  lead_id: string | null
  clock_in: string
  clock_out: string | null
  notes: string | null
  created_at: string
}

// ── Agreements (built-in e-signature) ──

export interface Agreement {
  id: string
  account_id: string
  lead_id: string
  title: string
  document_url: string | null
  token: string
  status: 'sent' | 'viewed' | 'signed'
  signer_name: string | null
  signer_email: string | null
  signature_data: string | null
  signed_at: string | null
  signer_ip: string | null
  created_at: string
}
