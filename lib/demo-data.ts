// Fake data for the sales-demo dashboard (app/(admin)/admin/demo).
// Nothing here touches Supabase — it's purely for click-through demos.

export const DEMO_BUSINESS_NAME = 'Summit Pressure Washing'

export const DEMO_STATS = {
  leadsThisMonth: 47,
  revenueThisMonth: 8420,
  conversionRate: 34,
  creditBalance: 182.5,
}

export const DEMO_LEADS = [
  { id: '1', name: 'Karen Mitchell', email: 'karen.m@gmail.com', phone: '(555) 201-3344', status: 'booked', service: 'Driveway + Walkway', quote: 320, created_at: '2026-07-03T14:20:00Z' },
  { id: '2', name: 'Derek Sanford', email: 'dsanford@yahoo.com', phone: '(555) 887-1290', status: 'new', service: 'House Wash (2-story)', quote: 480, created_at: '2026-07-04T09:12:00Z' },
  { id: '3', name: 'Priya Anand', email: 'priya.anand@outlook.com', phone: '(555) 442-9981', status: 'contacted', service: 'Deck Restoration', quote: 610, created_at: '2026-07-04T16:45:00Z' },
  { id: '4', name: 'Tom Reyes', email: 'treyes88@gmail.com', phone: '(555) 330-7712', status: 'booked', service: 'Roof Soft Wash', quote: 890, created_at: '2026-07-02T11:05:00Z' },
  { id: '5', name: 'Angela Duffy', email: 'aduffy@icloud.com', phone: '(555) 654-2201', status: 'lost', service: 'Driveway Only', quote: 180, created_at: '2026-07-01T08:30:00Z' },
  { id: '6', name: 'Marcus Webb', email: 'mwebb@gmail.com', phone: '(555) 998-4471', status: 'new', service: 'Fence + Deck Combo', quote: 720, created_at: '2026-07-05T07:52:00Z' },
] as const

export const DEMO_FORMS = [
  { id: 'f1', form_name: 'Instant Pressure Wash Quote', slug: 'summit-instant-quote', leads: 31, steps: 4, is_active: true, created_at: '2026-05-12T00:00:00Z', instant: true },
  { id: 'f2', form_name: 'Roof Cleaning Estimate', slug: 'summit-roof-clean', leads: 9, steps: 3, is_active: true, created_at: '2026-05-28T00:00:00Z', instant: false },
  { id: 'f3', form_name: 'Commercial Property Inquiry', slug: 'summit-commercial', leads: 7, steps: 5, is_active: false, created_at: '2026-06-10T00:00:00Z', instant: false },
] as const

export const STATUS_COLORS: Record<string, string> = {
  new: '#2563eb',
  contacted: '#d97706',
  booked: '#16a34a',
  lost: '#dc2626',
}
