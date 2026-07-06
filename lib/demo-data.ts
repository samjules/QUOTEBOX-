// Fake data for the sales-demo dashboard (app/(admin)/admin/demo).
// Nothing here touches Supabase — it's purely for click-through demos.

export const DEMO_BUSINESS_NAME = 'Summit Pressure Washing'

export const DEMO_STATS = {
  totalLeads: 128,
  newLeads: 14,
  bookedLeads: 47,
  contactedLeads: 22,
  lostLeads: 9,
  conversionRate: 36.7,
  pipelineValue: 28450,
  periodLabel: 'This Month',
}

export const DEMO_LEADS = [
  { id: '1', name: 'Karen Mitchell', email: 'karen.m@gmail.com', phone: '(555) 201-3344', status: 'booked', service: 'Driveway + Walkway', quote: 320, created_at: '2026-07-03T14:20:00Z' },
  { id: '2', name: 'Derek Sanford', email: 'dsanford@yahoo.com', phone: '(555) 887-1290', status: 'new', service: 'House Wash (2-story)', quote: 480, created_at: '2026-07-04T09:12:00Z' },
  { id: '3', name: 'Priya Anand', email: 'priya.anand@outlook.com', phone: '(555) 442-9981', status: 'contacted', service: 'Deck Restoration', quote: 610, created_at: '2026-07-04T16:45:00Z' },
  { id: '4', name: 'Tom Reyes', email: 'treyes88@gmail.com', phone: '(555) 330-7712', status: 'booked', service: 'Roof Soft Wash', quote: 890, created_at: '2026-07-02T11:05:00Z' },
  { id: '5', name: 'Angela Duffy', email: 'aduffy@icloud.com', phone: '(555) 654-2201', status: 'lost', service: 'Driveway Only', quote: 180, created_at: '2026-07-01T08:30:00Z' },
  { id: '6', name: 'Marcus Webb', email: 'mwebb@gmail.com', phone: '(555) 998-4471', status: 'new', service: 'Fence + Deck Combo', quote: 720, created_at: '2026-07-05T07:52:00Z' },
] as const

export const STATUS_COLORS: Record<string, string> = {
  new: '#5b5bd6',
  contacted: '#d97706',
  booked: '#16a34a',
  lost: '#9ca3af',
}

interface DemoFormField { id: string; type: string; label: string }
interface DemoForm {
  id: string
  form_name: string
  is_active: boolean
  created_at: string
  leads: number
  instant: boolean
  form_config: {
    slug: string
    brand_color: 'yellow' | 'blue'
    currency: string
    fields: DemoFormField[]
  }
}

export const DEMO_FORMS: DemoForm[] = [
  {
    id: 'f1',
    form_name: 'Instant Pressure Wash Quote',
    is_active: true,
    created_at: '2026-05-12T00:00:00Z',
    leads: 31,
    instant: true,
    form_config: {
      slug: 'summit-instant-quote',
      brand_color: 'yellow',
      currency: '$',
      fields: [
        { id: '1', type: 'radio', label: 'Service' },
        { id: '2', type: 'number', label: 'Sqft' },
        { id: '3', type: 'checkbox', label: 'Add-ons' },
        { id: '4', type: 'textarea', label: 'Notes' },
      ],
    },
  },
  {
    id: 'f2',
    form_name: 'Roof Cleaning Estimate',
    is_active: true,
    created_at: '2026-05-28T00:00:00Z',
    leads: 9,
    instant: false,
    form_config: {
      slug: 'summit-roof-clean',
      brand_color: 'blue',
      currency: '$',
      fields: [
        { id: '1', type: 'dropdown', label: 'Roof Type' },
        { id: '2', type: 'number', label: 'Sqft' },
        { id: '3', type: 'image', label: 'Photos' },
      ],
    },
  },
  {
    id: 'f3',
    form_name: 'Commercial Property Inquiry',
    is_active: false,
    created_at: '2026-06-10T00:00:00Z',
    leads: 7,
    instant: false,
    form_config: {
      slug: 'summit-commercial',
      brand_color: 'yellow',
      currency: '$',
      fields: [
        { id: '1', type: 'radio', label: 'Property Type' },
        { id: '2', type: 'route', label: 'Address' },
        { id: '3', type: 'draw_area', label: 'Lot Size' },
        { id: '4', type: 'number', label: 'Quantity' },
        { id: '5', type: 'textarea', label: 'Details' },
      ],
    },
  },
]
