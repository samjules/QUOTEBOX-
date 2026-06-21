# QUOTEBOX — `/build` Wizard: Complete Logic Reference

This file is the source-of-truth for the public signup wizard at `/build`.
An iOS Claude bot (or any automation) building a quote form via this wizard must
understand every step and the pricing/distance logic fully before generating
`formConfig` JSON for `hosted_forms`.

---

## Files

| File | Purpose |
|---|---|
| `app/build/page.tsx` | Server component — fetches global booked revenue, renders shell + header |
| `app/build/PublicWizard.tsx` | 8-step client wizard — collects all inputs, creates account + form on submit |
| `app/[slug]/QuoteForm.tsx` | How the saved form is rendered to customers (read this to understand what you're building *toward*) |
| `lib/types.ts` | All TypeScript interfaces (`FormField`, `RadiusTier`, `FormConfig`, etc.) |
| `lib/pricing.ts` | `computeTotal()` and `computeBreakdown()` — the canonical pricing engine |

---

## Wizard Overview — 8 Steps

| Step | State collected | Can advance when |
|---|---|---|
| 1 | `businessName`, `serviceType`, `brandColor` | `businessName.trim().length > 1` AND `serviceType !== null` |
| 2 | `hourlyRate` | `hourlyRate` present and `> 0` |
| 3 | `hasTrucks`, `tiers[]` | `hasTrucks !== null` |
| 4 | `chargeDrive`, `radiusTiers[]` | `chargeDrive !== null` |
| 5 | `extras[]` | Always (extras are optional) |
| 6 | `hasMinimum`, `minQuote` | `hasMinimum !== null` |
| 7 | `heroFile` (optional) | Always (can skip) |
| 8 | `email`, `password` | `email` non-empty AND `password.length >= 6` |

---

## Step 1 — Business Name, Service Type, Brand Color

### Service types
Only two options exist:

```ts
const SERVICE_TYPES = [
  { id: 'moving',       label: 'Moving',      desc: 'Local & long-distance residential moves', color: '#F97316' },
  { id: 'junk_removal', label: 'Junk Removal', desc: 'Haul-away, cleanouts & debris removal',  color: '#374151' },
]
```

Selecting a service type also:
- Sets `brandColor` to that service's default color
- Seeds `tiers` with `DEFAULT_TIERS[serviceType]`
- Seeds `extras` with `DEFAULT_EXTRAS[serviceType]`

### Default tiers seeded at Step 1 selection

```ts
DEFAULT_TIERS = {
  moving: [
    { label: 'Studio / 1 Bedroom', rate: '120', hours: '3' },
    { label: '2–3 Bedrooms',       rate: '120', hours: '5' },
    { label: '4+ Bedrooms',        rate: '150', hours: '8' },
  ],
  junk_removal: [
    { label: '1/4 Truck Load',  rate: '100', hours: '2' },
    { label: '1/2 Truck Load',  rate: '100', hours: '3' },
    { label: 'Full Truck Load', rate: '120', hours: '4' },
  ],
}
```

### Default extras seeded at Step 1 selection

```ts
DEFAULT_EXTRAS = {
  moving: [
    { label: 'Packing & Unpacking', price: '150' },
    { label: 'Piano / Heavy Items', price: '100' },
    { label: 'Long Carry (>75 ft)', price: '75'  },
  ],
  junk_removal: [
    { label: 'Same-day service',    price: '50' },
    { label: 'Heavy items (piano)', price: '75' },
    { label: 'Appliance removal',   price: '50' },
  ],
}
```

### Brand color presets

```ts
const COLOR_PRESETS = ['#F97316', '#374151', '#0e0020', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#0EA5E9']
```
User can also pick a custom hex via `<input type="color">`.

---

## Step 2 — Base Hourly Rate

Single number field. When changed via `updateBaseRate()`:
- Updates `hourlyRate` state
- If `hasTrucks === null` OR `hasTrucks === false`, propagates the new rate to **all tiers** (`tiers.map(t => ({ ...t, rate: val }))`)
- Does NOT override tier rates if `hasTrucks === true` (each tier already has its own rate)

---

## Step 3 — Tier Pricing (Variable Job Rates)

Question: "Do any of your jobs cost more than others?"

### `hasTrucks === false` (same rate for all jobs)
All tiers get `rate = hourlyRate`. Tiers still exist — they define job sizes and estimated hours — but every tier's price-per-hour is the same.

### `hasTrucks === true` (different rates)
Each tier can have its own `rate` ($/hr) and `hours` (estimated job duration).

### Tier data shape
```ts
interface ServiceTier {
  id: string    // random slug, e.g. "abc1234"
  label: string // e.g. "2–3 Bedrooms"
  rate: string  // $/hr as string, e.g. "120"
  hours: string // estimated hours as string, e.g. "5"
}
```

### How tiers become FormField options
In `generateFields()`, tiers become options on a `radio` field:
```ts
{
  id: fid(), type: 'radio',
  label: serviceType === 'moving' ? 'Home Size' : 'Load Size',
  required: true,
  showPrices: true,
  options: tiers.map(t => ({
    id: fid(),
    label: t.label,
    price: parseFloat(t.rate) || 0,   // price per hour
    hours: parseFloat(t.hours) || 1,  // estimated hours
  }))
}
```

### How this drives the quote total
In `computeBreakdown()` (`lib/pricing.ts`):
```ts
// For radio/dropdown options that have hours:
amount = opt.price * opt.hours   // e.g. $120/hr × 5hr = $600
```
So the displayed "minimum estimate" = `rate × hours` per selected tier.

---

## Step 4 — Distance / Drive Time Charging

This is the most complex step. Question: "Do you charge extra for drive time?"

### `chargeDrive === false`
No route field added to the form. Distance is irrelevant.

### `chargeDrive === true`
A `route` field is added in `generateFields()`:

```ts
{
  id: fid(),
  type: 'route',
  label: serviceType === 'moving' ? 'Moving Route' : 'Pickup Location',
  required: true,
  routeChargeType: 'radius_tiers',
  locationMode: serviceType === 'junk_removal' ? 'single' : 'point_to_point',
  radiusTiers: radiusTiers.map(r => ({
    id: r.id,
    maxMiles: r.maxMiles,
    driveCharge: r.driveCharge,
  })),
}
```

### `locationMode` — two modes

| Mode | Who enters addresses | Distance measured |
|---|---|---|
| `'point_to_point'` | Customer enters **start AND end** address | Haversine (straight-line) between start and end |
| `'single'` | Customer enters **one** address (their location) | Haversine from business `baseAddress` to customer |

**Moving** always uses `point_to_point` (from address → to address).
**Junk removal** uses `single` (just the pickup/service address).

### Radius tiers — the distance pricing engine

```ts
interface RadiusTier {
  id: string
  maxMiles: number | null   // null = catch-all / unlimited
  driveCharge: number       // flat $ fee added to quote for this distance band
}
```

Default tiers seeded in the wizard:
```ts
DEFAULT_RADIUS_TIERS = [
  { maxMiles: 20,   driveCharge: 50  },
  { maxMiles: 40,   driveCharge: 100 },
  { maxMiles: null, driveCharge: 175 },  // catch-all: any distance beyond 40 miles
]
```

### How radius tiers are matched at quote time

In `lib/pricing.ts` → `computeBreakdown()` and in `QuoteForm.tsx`:

```ts
const tiers = f.radiusTiers ?? []
const sorted = [...tiers].sort((a, b) =>
  a.maxMiles === null ? 1 : b.maxMiles === null ? -1 : a.maxMiles - b.maxMiles
)
// Use jobLegMiles if present (point_to_point with base address), else distanceMiles
const billableMiles = rd.jobLegMiles ?? rd.distanceMiles
const match = sorted.find(t => t.maxMiles === null || billableMiles <= t.maxMiles)
const driveCharge = match?.driveCharge ?? 0
```

**Sort order matters**: tiers are sorted ascending by `maxMiles` (nulls last). The first matching tier wins.

**Out-of-range behaviour**: If no tier matches (no catch-all tier and distance exceeds all `maxMiles`), the form blocks advance with:
> "Your distance is outside our online quote range — Please call us for a custom quote."

The `canAdvance()` function in `QuoteForm.tsx` returns `false` when `tiers.length > 0 && !match`.

### Distance calculation — always haversine, never routing API

Despite calling the Mapbox Directions API (to draw the route line on the map), the **billable distance is always haversine (straight-line)**:

```ts
// haversineMiles([lng1, lat1], [lng2, lat2]) → miles
function haversineMiles(a: [number, number], b: [number, number]): number {
  const R = 3958.8
  const lat1 = a[1] * Math.PI / 180, lat2 = b[1] * Math.PI / 180
  const dLat = lat2 - lat1, dLon = (b[0] - a[0]) * Math.PI / 180
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2
  return R * 2 * Math.asin(Math.sqrt(h))
}
```

The `getDirections()` function in `QuoteForm.tsx` explicitly overrides the Directions API mileage with haversine:
```ts
return {
  distanceMiles: haversineMiles(start, end),  // ← billing distance
  durationMinutes: 0,                          // ← always 0, unused
  geometry: route.geometry,                    // ← only used for map line drawing
}
```

### `jobLegMiles` — what's billable in point_to_point with a base address

When `field.baseAddress` is set AND `locationMode === 'point_to_point'`, the system fetches **3 legs**:
- Leg 0: base → customer start (travel to job)
- Leg 1: customer start → customer end (the actual move)
- Leg 2: customer end → base (return trip)

`routeResult.distanceMiles` = sum of all 3 legs  
`routeResult.jobLegMiles` = leg 1 only (customer start → end)

**Only `jobLegMiles` is used for billing** (`billableMiles = rd.jobLegMiles ?? rd.distanceMiles`). The base travel legs are tracked internally but never shown to the customer and never used to match a radius tier.

When `baseAddress` is NOT set, `jobLegMiles` is undefined and `distanceMiles` (direct start→end) is used for billing.

### Mapbox environment variable required
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
```
Without this, the map renders a fallback error state ("Map unavailable") but geocoding and distance calculation also fail. The form still functions but route steps show no map.

### Geocoding
Address autocomplete uses Mapbox Geocoding v5:
```
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json
  ?access_token={MAPBOX_TOKEN}
  &limit=5
  &types=address,place,locality,neighborhood
```
Debounced 300ms. Returns `{ place_name: string, center: [lng, lat] }[]`.
Input turns green-bordered when a suggestion is selected (confirming `coords` is set).

### Route field sub-steps
A single `route` field in `formConfig.fields` expands into **2 or 3 customer-facing steps** inside `QuoteForm.tsx`:

| `locationMode` | Sub-step 0 | Sub-step 1 | Sub-step 2 |
|---|---|---|---|
| `point_to_point` | Enter start address | Enter end address | Map + route summary |
| `single` | Enter service address | *(skipped)* | Map + location summary |

The expansion happens in `expandedSteps` (`useMemo` in `QuoteForm.tsx`):
```ts
if (field.type === 'route') {
  result.push({ field, routeSubStep: 0 })
  if (field.locationMode !== 'single') result.push({ field, routeSubStep: 1 })
  result.push({ field, routeSubStep: 2 })
}
```

---

## Step 5 — Add-on Extras (Checkbox Options)

Extras become a single `checkbox` field in the form:
```ts
{
  id: fid(), type: 'checkbox', label: 'Add-ons', required: false,
  options: validExtras
    .filter(e => e.label.trim())
    .map(e => ({ id: fid(), label: e.label, price: parseFloat(e.price) || 0 }))
}
```
Only extras with a non-empty label are included. If all labels are empty, the field is omitted entirely.

Pricing: each selected extra adds its flat `price` to the total (no `hours` multiplication).

---

## Step 6 — Minimum Quote

If `hasMinimum === true` and `minQuote` is set, the `formConfig` gets:
```ts
min_quote: parseFloat(minQuote) || 0
total_label: `Starts at $${minVal} — minimum estimate`
```

In `QuoteForm.tsx` the display logic is:
```ts
const displayTotal = minQuote > 0 ? Math.max(computedTotal, minQuote) : computedTotal
const minApplied = minQuote > 0 && computedTotal < minQuote
```
The customer always sees the higher of the computed total or the minimum.

If `hasMinimum === false`:
```ts
min_quote: 0
total_label: 'Minimum estimate'
```

---

## Step 7 — Hero Photo Upload (Optional)

- Accepted: JPG, PNG, WebP, max 5 MB (copy only — no code enforcement)
- File is held in memory as an object URL until Step 8 claim
- On claim, uploaded to Supabase Storage bucket `vsls` at path: `<accountId>/<timestamp>-<random>.<ext>`
- A row is inserted into the `vsls` table with `title: 'Hero image'`
- The public URL is stored as `formConfig.hero_image_url`
- If the user skips Step 7, `heroImageUrl = ''` and the form has no hero image

---

## Step 8 — Account Creation (`handleClaim`)

Full sequence on "Claim my form →" button press:

### Validation
- `serviceType` must be set, `businessName` must be non-empty
- `email` must be non-empty
- `password.length >= 6`

### Creation sequence (all errors abort with `setSaveError`)

```
1. supabase.auth.signUp({ email, password })
   → creates auth user, returns authData.user.id

2. INSERT INTO accounts (business_name, owner_id)
   → returns newAccount.id (= accountId)

3. INSERT INTO billing (account_id, credit_balance: 0, total_spent: 0)
   → seeds billing row (no plan, no Stripe yet)

4. [if heroFile] Upload to vsls storage bucket
   → INSERT INTO vsls table with file metadata
   → set heroImageUrl = publicUrl

5. generateFields() → build FormField[]

6. Resolve slug:
   - baseSlug = toSlug(businessName)  // lowercase, max 40 chars, spaces→hyphens
   - Check hosted_forms WHERE form_config->>'slug' = baseSlug
   - If conflict: slug = baseSlug + '-' + random(3 chars)

7. INSERT INTO hosted_forms ({
     account_id, form_name, form_type: 'quote',
     form_config, is_active: true, updated_at: now
   })

8. router.push('/dashboard?new=1')
```

---

## `generateFields()` — Complete Output

Called with: `(serviceType, tiers, chargeDrive, radiusTiers, extras)`

```ts
fields = [
  // 1. Always — job size / load size picker
  {
    id, type: 'radio',
    label: serviceType === 'moving' ? 'Home Size' : 'Load Size',
    required: true, showPrices: true,
    options: tiers.map(t => ({
      id, label: t.label,
      price: parseFloat(t.rate) || 0,
      hours: parseFloat(t.hours) || 1,
    }))
  },

  // 2. Only if chargeDrive === true — distance field
  {
    id, type: 'route',
    label: serviceType === 'moving' ? 'Moving Route' : 'Pickup Location',
    required: true,
    routeChargeType: 'radius_tiers',
    locationMode: serviceType === 'junk_removal' ? 'single' : 'point_to_point',
    radiusTiers: radiusTiers.map(r => ({ id: r.id, maxMiles: r.maxMiles, driveCharge: r.driveCharge }))
  },

  // 3. Only if any extras have a non-empty label
  {
    id, type: 'checkbox', label: 'Add-ons', required: false,
    options: validExtras.map(e => ({ id, label: e.label, price: parseFloat(e.price) || 0 }))
  },

  // 4. Always — free text notes
  {
    id, type: 'textarea', label: 'Additional Notes', required: false,
    placeholder: 'Any special instructions or details about the job…'
  }
]
```

---

## Complete `formConfig` Shape

```ts
{
  slug: string,                      // URL-safe business name slug
  description: `Get an instant quote for your ${service} job.`,
  submit_label: 'Get My Instant Quote',
  currency: '$',
  brand_color: brandColor,           // hex string from Step 1
  show_total: true,
  quote_display: 'live',             // prices shown in real-time as customer fills form
  hero_image_url: heroImageUrl,      // '' if skipped
  fields: FormField[],               // from generateFields()
  min_quote: number,                 // 0 if no minimum
  disclaimer_enabled: true,
  disclaimer_text: 'This is a minimum estimate. Final price is confirmed once our crew assesses the job on-site.',
  send_email_estimate: true,         // sends quote to customer email on submit
  confirm_title: "You're all set!",
  confirm_message: "We've received your details and will be in touch shortly.",
  next_step_label: 'Next Step',
  total_label: string,               // 'Minimum estimate' or 'Starts at $X — minimum estimate'
  email_template: {
    subject: '',
    intro: '',
    outro: '',
    header_image: '',
    accent_color: brandColor,
  }
}
```

---

## Pricing Engine Reference (`lib/pricing.ts`)

### `computeTotal(fields, answers, routeData, drawAreaData) → number`
Sum of all `computeBreakdown()` line amounts.

### Radio / Dropdown options
```ts
amount = opt.hours ? opt.price * opt.hours : opt.price
// e.g. $120/hr × 5hr = $600, or flat $150
```

### Checkbox options
```ts
amount = opt.hours ? opt.price * opt.hours : opt.price
// same formula, each selected option adds independently
```

### Route field (radius_tiers)
```ts
billableMiles = rd.jobLegMiles ?? rd.distanceMiles
match = tiers.sort(ascending by maxMiles, nulls last).find(t => t.maxMiles === null || billableMiles <= t.maxMiles)
amount = match.driveCharge  // flat fee, not per-mile
```

### Minimum quote
```ts
displayTotal = Math.max(computedTotal, min_quote)
```

---

## Database Tables Written During Claim

| Table | Columns written |
|---|---|
| `auth.users` | `id`, `email` (via Supabase Auth) |
| `accounts` | `business_name`, `owner_id` |
| `billing` | `account_id`, `credit_balance: 0`, `total_spent: 0` |
| `vsls` | `account_id`, `title`, `file_name`, `file_url`, `storage_path`, `file_size` (if hero uploaded) |
| `hosted_forms` | `account_id`, `form_name`, `form_type`, `form_config`, `is_active`, `updated_at` |

Supabase Storage bucket: `vsls`, path: `<accountId>/<timestamp>-<random>.<ext>`

---

## Common Tasks / Edge Cases

### Adding a new service type
1. Add entry to `SERVICE_TYPES` (with `id`, `label`, `desc`, `color`)
2. Add entry to `DEFAULT_TIERS[newId]`
3. Add entry to `DEFAULT_EXTRAS[newId]`
4. Update `generateFields()` — update the `label` logic for the radio field and the `locationMode` for the route field

### Changing distance measurement from haversine to road miles
In `QuoteForm.tsx` → `getDirections()` and `getWaypointRoute()`, replace:
```ts
distanceMiles: haversineMiles(start, end)
```
with:
```ts
distanceMiles: route.distance / 1609.344  // Directions API returns meters
```
Do this in ALL 3 directions calls (base leg, job leg, return leg).

### Adding a catch-all radius tier that covers any distance
Set `maxMiles: null` on one tier. It must be the last after sorting. Without a catch-all, customers beyond your farthest `maxMiles` get the "call for quote" block screen.

### Changing `locationMode` after form creation
The field's `locationMode` is baked into the saved `form_config` JSON. Changing it requires updating the `hosted_forms.form_config` column directly or rebuilding the form.

### `baseAddress` — gating billable miles to job-leg only
The wizard does NOT expose a `baseAddress` UI — it's only configurable via the form builder (`app/(protected)/form-builder/page.tsx`). When `baseAddress` is set:
- The map draws 3 route legs (gray dashed = base travel, colored = job leg)
- Only the job leg (start→end) is used for tier matching
- Base travel legs are intentionally hidden from the customer's UI
- `routeResult.jobLegMiles` carries the billable distance

### Slug conflicts
If two businesses have the same name, the second gets a 3-char random suffix:
```ts
if (conflicts.length > 0) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`
```
Only one conflict check is done. If the suffixed slug also conflicts (extremely rare), the insert will fail with a unique constraint error.

### `toSlug()` function
```ts
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // strip non-alphanumeric except spaces/hyphens
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}
```

### Account member row
The wizard does NOT create an `account_members` row. Role assignment is handled by a Supabase trigger or the onboarding flow. The `accounts.owner_id` column links the auth user to their account.

---

## Environment Variables Required

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...   # Required for geocoding + map display
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase anon key
```

Without `NEXT_PUBLIC_MAPBOX_TOKEN`:
- Address autocomplete returns no suggestions
- Map shows "Map unavailable" fallback
- Route calculation silently returns `null`
- Form can still be submitted but route step produces no distance data

---

## What the iOS Bot Must Send to Replicate This Flow

When an iOS Claude bot completes this wizard on behalf of a user, it must produce a `formConfig` JSON matching the shape above and write it via the Supabase client or REST API. The minimum viable payload:

```json
{
  "account_id": "<uuid>",
  "form_name": "<businessName> Quote",
  "form_type": "quote",
  "is_active": true,
  "form_config": {
    "slug": "<toSlug(businessName)>",
    "description": "Get an instant quote for your moving job.",
    "submit_label": "Get My Instant Quote",
    "currency": "$",
    "brand_color": "#F97316",
    "show_total": true,
    "quote_display": "live",
    "hero_image_url": "",
    "min_quote": 0,
    "disclaimer_enabled": true,
    "disclaimer_text": "This is a minimum estimate. Final price is confirmed once our crew assesses the job on-site.",
    "send_email_estimate": true,
    "confirm_title": "You're all set!",
    "confirm_message": "We've received your details and will be in touch shortly.",
    "next_step_label": "Next Step",
    "total_label": "Minimum estimate",
    "email_template": { "subject": "", "intro": "", "outro": "", "header_image": "", "accent_color": "#F97316" },
    "fields": [
      {
        "id": "<random>",
        "type": "radio",
        "label": "Home Size",
        "required": true,
        "showPrices": true,
        "options": [
          { "id": "<random>", "label": "Studio / 1 Bedroom", "price": 120, "hours": 3 },
          { "id": "<random>", "label": "2–3 Bedrooms",       "price": 120, "hours": 5 },
          { "id": "<random>", "label": "4+ Bedrooms",        "price": 150, "hours": 8 }
        ]
      },
      {
        "id": "<random>",
        "type": "route",
        "label": "Moving Route",
        "required": true,
        "routeChargeType": "radius_tiers",
        "locationMode": "point_to_point",
        "radiusTiers": [
          { "id": "<random>", "maxMiles": 20,   "driveCharge": 50  },
          { "id": "<random>", "maxMiles": 40,   "driveCharge": 100 },
          { "id": "<random>", "maxMiles": null, "driveCharge": 175 }
        ]
      },
      {
        "id": "<random>",
        "type": "checkbox",
        "label": "Add-ons",
        "required": false,
        "options": [
          { "id": "<random>", "label": "Packing & Unpacking", "price": 150 },
          { "id": "<random>", "label": "Piano / Heavy Items", "price": 100 },
          { "id": "<random>", "label": "Long Carry (>75 ft)", "price": 75  }
        ]
      },
      {
        "id": "<random>",
        "type": "textarea",
        "label": "Additional Notes",
        "required": false,
        "placeholder": "Any special instructions or details about the job…"
      }
    ]
  }
}
```

Key rules for IDs:
- Every `id` (field IDs and option IDs) must be a unique 7-char alphanumeric string
- IDs are never reused across fields or options within the same form
- Safe generation: `Math.random().toString(36).slice(2, 9)`
