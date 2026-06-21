# QUOTEBOX — iOS Claude Bot Page Instructions

This file is the source-of-truth for configuring the four core app pages.
All pages live under `app/(protected)/` and require an authenticated session.

---

## Map Page

**Files:** `app/(protected)/map/page.tsx`, `app/(protected)/map/LeadMap.tsx`

### What it does
Renders a full-viewport Mapbox map that plots lead pickup/dropoff locations extracted from `form_data`. Leads that contain a `RouteResult` shape (fields: `endCoords [lng, lat]`, `endAddress`) are shown as pins. Clicking a pin opens a popup with the lead's name, status badge, address, and a link to the lead detail page.

### Environment variable required
```
NEXT_PUBLIC_MAPBOX_TOKEN=<your Mapbox public token>
```
The token is passed directly to `mapboxgl.accessToken` in `LeadMap.tsx:9`. Without it, the map will be blank.

### Key configuration points

| Thing to change | Where |
|---|---|
| Map style (satellite, streets, etc.) | `LeadMap.tsx` — change the `style:` option in the `new mapboxgl.Map(...)` call |
| Default center / zoom | Same `new mapboxgl.Map(...)` call — `center` and `zoom` options |
| Which lead statuses get plotted | `extractLeadLocations()` in `LeadMap.tsx` — add a status filter if needed |
| Pin color per status | `statusColor()` function in `LeadMap.tsx` — returns Tailwind color classes |
| Fields read from `form_data` | `isRouteResult()` type guard — add/remove required fields here |

### Data flow
`MapPage` (server) → queries `leads` table for the account → passes array to `LeadMap` (client-only, `ssr: false`). No API routes involved.

### Common tasks
- **Add a new pin style** — edit the marker JSX rendered inside `LeadMap` where `new mapboxgl.Marker()` is called.
- **Filter to only booked leads on the map** — in `page.tsx`, add `.in('status', ['booked'])` to the Supabase query.
- **Add a search/filter UI** — add client state in `LeadMap.tsx`; filter `locations` before rendering markers.

---

## Time Clock Page

**Files:** `app/(protected)/time-clock/page.tsx`, `app/(protected)/time-clock/EmployeeTimeClock.tsx`, `app/(protected)/time-clock/OwnerTimeView.tsx`, `app/(protected)/time-clock/actions.ts`

### What it does
Role-split page. Owners see all employee time entries with export capability (`OwnerTimeView`). Employees see a clock-in / clock-out card with a live running timer and a dropdown to associate the shift with a lead (`EmployeeTimeClock`).

### Role detection
`getAccountForUser()` returns `ctx.role`. If `'owner'`, the owner branch renders; otherwise the employee branch renders. Role is stored in the `account_members` table.

### Database tables used
- `time_entries` — columns: `id`, `account_id`, `user_id`, `clock_in` (timestamptz), `clock_out` (timestamptz nullable), `lead_id` (nullable), `notes` (nullable)
- `account_members` — columns: `user_id`, `name`, `email`

### Key configuration points

| Thing to change | Where |
|---|---|
| How many recent entries employees see | `page.tsx:66` — `.limit(50)` |
| How many entries owners see | `page.tsx:28` — `.limit(200)` |
| Which lead statuses appear in the job dropdown | `page.tsx:74` — `.in('status', ['new', 'contacted', 'booked'])` |
| Max leads shown in job dropdown | `page.tsx:75` — `.limit(100)` |
| Live timer tick rate | `EmployeeTimeClock.tsx` — `setInterval(tick, 1000)` |
| Clock-in / clock-out server actions | `actions.ts` — `clockIn(leadId, notes)` and `clockOut(entryId)` |

### Common tasks
- **Add a break / pause feature** — add a `paused_at` column to `time_entries` and update `actions.ts`.
- **Export to CSV (owner view)** — add an export button in `OwnerTimeView.tsx` that maps entries to CSV rows.
- **Show total hours per employee** — aggregate in `OwnerTimeView.tsx` by grouping entries on `user_id`.
- **Prevent clock-in without selecting a job** — in `EmployeeTimeClock.tsx`, disable the clock-in button when `selectedLead === ''`.

---

## Billing Page

**File:** `app/(protected)/billing/page.tsx`

### What it does
Client-side page that shows the current subscription status, trial countdown, usage stats (total leads, total spent, this month's leads), billing history, and the Stripe checkout / portal flows.

### Environment variables required
```
NEXT_PUBLIC_SUBSCRIPTION_FUNCTION_URL=<Supabase Edge Function URL for creating Stripe checkout sessions>
NEXT_PUBLIC_PORTAL_FUNCTION_URL=<Supabase Edge Function URL for opening the Stripe billing portal>
NEXT_PUBLIC_VERIFY_SESSION_FUNCTION_URL=<Supabase Edge Function URL called after a successful checkout>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
```

### Database tables used
- `billing` — columns: `account_id`, `plan` (nullable string), `blessed` (boolean), `stripe_customer_id`, `trial_ends_at`, `total_spent`, `credit_balance`
- `billing_transactions` — columns: `id`, `account_id`, `type` (`'credit_purchase'` | other), `description`, `amount`, `balance_after`, `created_at`
- `leads` — read to count total and monthly leads

### Subscription logic

| Condition | What the user sees |
|---|---|
| `blessed === true` | Green "Blessed Account — Free Access" banner |
| `plan !== null` | Purple "Pro — $350/month" banner + Manage Subscription button |
| Neither | Pro plan card with Get Started button → Stripe checkout |

### Key configuration points

| Thing to change | Where |
|---|---|
| Price displayed | `billing/page.tsx:206` ("Pro — $350/month") and `:248` ("$350") and `:287` button label |
| Pro features list | Array at `:253` — add/remove strings |
| Transaction history limit | `:72` — `.limit(50)` |
| Redirect path after cancel | `:108` — `'/billing'` |
| Trial badge color/copy | `:211–218` — the `trialEndsAt` block |

### Common tasks
- **Change the price** — update the three display strings noted above; the actual price lives in your Stripe product/price configuration.
- **Add a free tier** — add a `plan === 'free'` branch in the JSX before the "not subscribed" card.
- **Show invoice PDFs** — add an `invoice_url` column to `billing_transactions` and render a link in the table row.
- **Add a credit balance display** — `credit_balance` is already fetched from `billing` but not currently displayed; add a stat card for it.

---

## Settings Page

**File:** `app/(protected)/settings/page.tsx`

### What it does
Owner-only settings hub. Sections: Logo upload, Dashboard Background, Business Name, Change Password, Meta Integration (Facebook), Stripe Payments (Connect), Team Members, Agreement Template, Account ID & Embed Script, Leaderboard Privacy, and Danger Zone (delete account).

### Environment variables required
```
NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID=<Stripe Connect OAuth client ID>
NEXT_PUBLIC_DELETE_ACCOUNT_FUNCTION_URL=<Supabase Edge Function URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
NEXT_PUBLIC_SITE_URL=<your production URL, e.g. https://quote-box.com>
```

### Database tables / storage used
- `accounts` — columns read/written: `business_name`, `logo_url`, `dashboard_bg_url`, `meta_access_token`, `meta_user_id`, `meta_ad_account_id`, `meta_page_id`, `stripe_connect_account_id`, `stripe_connect_completed_at`, `agreement_template_url`, `leaderboard_hidden`
- `account_members` — `id`, `email`, `name`, `role`, `accepted_at`
- Supabase Storage bucket: `vsls` — paths: `logos/<accountId>/`, `dashboard-bg/<accountId>/`, `agreements/<accountId>/`

### Required DB migrations (run in Supabase SQL editor once)
```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS stripe_connect_completed_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS leaderboard_hidden BOOLEAN NOT NULL DEFAULT FALSE;
```

### Section-by-section guide

#### Logo
- Upload via file input → stored in `vsls` bucket → URL saved to `accounts.logo_url`
- After upload, fires a `logoUpdated` CustomEvent on `window` so the sidebar can react without a page reload
- Accepted formats: PNG, JPG, SVG — max 2 MB enforced by copy (not code); add size check if needed

#### Dashboard Background
- Same flow as logo but stored at `dashboard-bg/<accountId>/`
- Accepted formats: JPG, PNG, WebP — max 5 MB (copy only; add a size guard if needed)
- Displayed behind dashboard cards in `app/(protected)/dashboard/page.tsx`

#### Business Information
- Simple form → `UPDATE accounts SET business_name = ...`

#### Change Password
- Uses `supabase.auth.updateUser({ password })` — minimum 8 characters, confirmed via second field

#### Meta Integration
- Connect flow: `/api/meta/connect` → Facebook OAuth → callback saves token to `accounts`
- Page selector: fetches `https://graph.facebook.com/v18.0/me/accounts` with stored token
- Ad account selector: fetches `https://graph.facebook.com/v18.0/me/adaccounts`
- Lead forms: `/api/meta/lead-forms?pageId=...` — requires `leads_retrieval` Meta App permission
- Sync past leads: POST `/api/meta/sync-leads`
- Disconnect: nulls out `meta_access_token`, `meta_user_id`, `meta_ad_account_id`

#### Stripe Payments (Connect)
- Connect link: Stripe OAuth URL with `NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID` + `redirect_uri` pointing to `/api/stripe/callback`
- After OAuth: callback saves `stripe_connect_account_id` to `accounts`
- Disconnect: nulls `stripe_connect_account_id` and `stripe_connect_completed_at`

#### Team Members
- Invite: POST `/api/employees/invite` with `{ email }`
- Revoke: DELETE from `account_members` by row `id`
- Green dot = accepted, yellow dot = invite pending (`accepted_at` is null)

#### Agreement Template
- Upload PDF → stored in `vsls` bucket under `agreements/<accountId>/`
- URL saved to `accounts.agreement_template_url`
- Shown to customers during the signing flow (`app/sign/[token]/`)

#### Leaderboard Privacy
- Toggle: `UPDATE accounts SET leaderboard_hidden = true/false`
- When hidden, the account is excluded from `app/leaderboard/page.tsx`

#### Danger Zone
- Calls `DELETE_ACCOUNT_FUNCTION_URL` Supabase Edge Function with the user's JWT
- Requires typing "DELETE" in a confirm input before the button enables
- Signs out and redirects to `/login` on success

### Common tasks
- **Add a new settings section** — add a new `<div className="bg-white shadow rounded-xl p-6">` block inside the `space-y-6` container
- **Add a new account column** — run the migration, add to the `SELECT *` query in `useEffect`, and add the state + handler
- **Restrict settings to owner only** — currently client-side only; add a server route that checks `ctx.role === 'owner'` if you need server enforcement
- **Add email notifications toggle** — add an `email_notifications` boolean column to `accounts` and a toggle section following the leaderboard pattern

---

## Build / Signup Wizard (`/build`)

**Files:** `app/build/page.tsx`, `app/build/PublicWizard.tsx`

### What it does
A public 8-step onboarding wizard that lets a new user configure a quote form and create their Quotebox account in a single flow — no login required upfront. At the end it creates an auth user, an `accounts` row, a `billing` row, and a `hosted_forms` row, then redirects to `/dashboard?new=1`.

The server component (`page.tsx`) computes a real-time global "booked revenue" figure from all `booked` leads' `form_data._quote_total` fields and passes it to the wizard as social proof.

### Step-by-step breakdown

| Step | Question | State set |
|---|---|---|
| 1 | Business name + service type (Moving / Junk Removal) + brand color | `businessName`, `serviceType`, `brandColor`, `tiers`, `extras` |
| 2 | Base hourly rate | `hourlyRate` |
| 3 | Do different jobs cost different rates? (tier pricing) | `hasTrucks`, `tiers` |
| 4 | Do you charge extra for drive time? (radius zones) | `chargeDrive`, `radiusTiers` |
| 5 | What add-ons can customers pick? | `extras` |
| 6 | Is there a minimum charge per job? | `hasMinimum`, `minQuote` |
| 7 | Optional hero photo upload (stored in `vsls` bucket) | `heroFile`, `heroPreviewUrl` |
| 8 | Signup gate — email + password → account creation | `email`, `password` |

### Account creation sequence (Step 8 — `handleClaim`)
1. `supabase.auth.signUp({ email, password })` → creates auth user
2. `INSERT INTO accounts (business_name, owner_id)` → new account row
3. `INSERT INTO billing (account_id, credit_balance, total_spent)` → seed billing
4. If hero image provided: upload to `vsls` bucket at `<accountId>/<timestamp>-<random>.<ext>`, insert row into `vsls` table
5. Build `formConfig` JSON from all wizard state (`generateFields()` + metadata)
6. `INSERT INTO hosted_forms (account_id, form_name, form_type, form_config, is_active)` → saves the quote form
7. `router.push('/dashboard?new=1')`

### Service types
Only two options, defined in `SERVICE_TYPES` array at the top of `PublicWizard.tsx`:
- `moving` — default brand color `#F97316`
- `junk_removal` — default brand color `#374151`

Adding a new service type requires: adding an entry to `SERVICE_TYPES`, `DEFAULT_TIERS`, `DEFAULT_EXTRAS`, and updating `generateFields()` to handle its field shape.

### Key configuration points

| Thing to change | Where |
|---|---|
| Total steps in wizard | `TOTAL_STEPS` constant + add/remove `if (step === N)` blocks |
| Default tiers per service | `DEFAULT_TIERS` object |
| Default extras per service | `DEFAULT_EXTRAS` object |
| Default radius zones | `DEFAULT_RADIUS_TIERS` array |
| Brand color presets | `COLOR_PRESETS` array |
| Social proof stat (booked revenue) | `page.tsx` — Supabase query over `leads.form_data._quote_total` |
| Slug generation logic | `toSlug()` function + conflict check before `INSERT INTO hosted_forms` |
| Post-signup redirect | `router.push('/dashboard?new=1')` in `handleClaim` |
| Form disclaimer text | `disclaimer_text` field in `formConfig` inside `handleClaim` |
| Minimum estimate label copy | `total_label` field in `formConfig` |

### `generateFields()` — how the form config is built
Called at claim time with: `serviceType`, `tiers`, `chargeDrive`, `radiusTiers`, `extras`.

Field order:
1. `radio` — job size / load size (from `tiers`)
2. `route` — moving route or pickup location (only if `chargeDrive === true`); `locationMode` is `'point_to_point'` for moving, `'single'` for junk removal
3. `checkbox` — add-ons (only if any extras have a non-empty label)
4. `textarea` — "Additional Notes" (always appended)

### Common tasks
- **Add a new wizard step** — add a new `Step` type value, increment `TOTAL_STEPS`, add an `if (step === N)` block, and thread the new state into `handleClaim` / `generateFields` as needed
- **Pre-fill the wizard from a URL param** — read `searchParams` in `page.tsx` and pass defaults to `PublicWizard` as props
- **Add a third service type** — extend `SERVICE_TYPES`, `DEFAULT_TIERS`, and `DEFAULT_EXTRAS`; add a branch in `generateFields` for its field shape
- **Add SMS opt-in at signup** — add a `phone` field to Step 8 and send it to a Supabase Edge Function after `signUp`
- **Persist wizard progress across refreshes** — serialize state to `localStorage` on each step change and rehydrate on mount
- **Add Google OAuth as an alternative to email/password** — add `supabase.auth.signInWithOAuth({ provider: 'google' })` button in Step 8; handle the callback in `app/api/auth/callback/route.ts`
