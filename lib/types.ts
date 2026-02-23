export interface Account {
  id: string
  owner_id: string
  business_name: string
  created_at: string
  updated_at: string
}

export interface FieldOption {
  id: string
  label: string
  price: number
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
  imageHint?: string
  imageMaxMb?: number
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
  plan: 'base' | 'pro' | 'agency'
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
