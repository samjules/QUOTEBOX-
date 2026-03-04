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
  type: 'radio' | 'dropdown' | 'checkbox' | 'number' | 'textarea' | 'route' | 'image'
  label: string
  required: boolean
  options?: FieldOption[]
  placeholder?: string
  ratePerUnit?: number
  // Route field
  routeChargeType?: 'mileage' | 'drivetime' | 'both' | 'none'
  ratePerMile?: number
  ratePerMinute?: number
  imageUrl?: string
  conditionalRules?: ConditionalRule[]
}

export interface FormConfig {
  slug: string
  description: string
  submit_label: string
  currency: string
  brand_color: 'yellow' | 'blue'
  show_total: boolean
  quote_display?: 'live' | 'after_submit' | 'hidden'
  hero_image_url?: string
  fields: FormField[]
  meta_pixel_id?: string
  min_quote?: number
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
