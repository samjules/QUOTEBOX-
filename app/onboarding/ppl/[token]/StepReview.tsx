'use client'

import type { PPLBusiness, PPLService, PPLTravel, PPLAvailability } from '@/lib/types'

const DAYS: Array<[string, string]> = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']]

const btn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#1a1a2e',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}
const card: React.CSSProperties = { border: '1.5px solid #e5e4e0', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }
const cardHead: React.CSSProperties = {
  background: '#f8fafc', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  fontSize: '0.78rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase',
}
const row: React.CSSProperties = { fontSize: '0.85rem', color: '#1e293b', padding: '5px 0', lineHeight: 1.5 }
const lbl: React.CSSProperties = { fontWeight: 600, color: '#475569', marginRight: 6 }

function fmt(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
      Edit
    </button>
  )
}

const PRICING_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  hourly: { label: 'Hourly', bg: '#eff6ff', color: '#2563eb' },
  sqft: { label: 'Per sq ft', bg: '#f0fdf4', color: '#16a34a' },
  flat: { label: 'Flat rate', bg: '#fef9c3', color: '#92400e' },
  perunit: { label: 'Per unit', bg: '#fdf4ff', color: '#9333ea' },
}

function PricingBadge({ method, rate, unit }: { method: string; rate: number | null; unit: string | null }) {
  const b = PRICING_BADGES[method] ?? { label: method, bg: '#f1f5f9', color: '#475569' }
  let rateStr = ''
  if (rate != null) {
    if (method === 'hourly') rateStr = ` · $${rate}/hr`
    else if (method === 'sqft') rateStr = ` · $${rate}/sqft`
    else if (method === 'flat') rateStr = ` · $${rate}`
    else if (method === 'perunit') rateStr = ` · $${rate}/${unit || 'unit'}`
  }
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: b.bg, color: b.color }}>
      {b.label}{rateStr}
    </span>
  )
}

interface Props {
  form: {
    business: PPLBusiness
    services: PPLService[]
    travel: PPLTravel
    minimumJobPrice: number | null
    availability: PPLAvailability
  }
  onSubmit: () => void
  onEdit: (step: number) => void
  saving: boolean
}

export default function StepReview({ form, onSubmit, onEdit, saving }: Props) {
  const { business, services, travel, minimumJobPrice, availability } = form

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>Here&apos;s what we&apos;ll build</h2>
      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.55 }}>
        Check everything looks right. Tap Edit on any section to make changes.
      </p>

      {/* Business */}
      <div style={card}>
        <div style={cardHead}><span>Business</span><EditBtn onClick={() => onEdit(1)} /></div>
        <div style={{ padding: '12px 16px' }}>
          <div style={row}><span style={lbl}>Name:</span>{business.name}</div>
          <div style={row}><span style={lbl}>Trade:</span>{business.trade}{business.tradeOther ? ` — ${business.tradeOther}` : ''}</div>
          <div style={row}>
            <span style={lbl}>Area:</span>
            {business.serviceArea.type === 'radius'
              ? `${business.serviceArea.radiusMiles ?? 25} mi from ${business.serviceArea.location || '—'}`
              : `${business.serviceArea.zipCodes.length} zip codes: ${business.serviceArea.zipCodes.join(', ')}`
            }
          </div>
        </div>
      </div>

      {/* Services — each as its own card */}
      {services.map((s) => (
        <div key={s.id} style={card}>
          <div style={cardHead}><span>{s.name || 'Untitled service'}</span><EditBtn onClick={() => onEdit(2)} /></div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ ...row, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={lbl}>Pricing:</span>
              {s.pricingMethod ? <PricingBadge method={s.pricingMethod} rate={s.pricingRate} unit={s.pricingUnit} /> : <span style={{ color: '#94a3b8' }}>Not set</span>}
            </div>
            <div style={row}>
              <span style={lbl}>Photos:</span>
              {s.photoUploadEnabled ? <span style={{ color: '#16a34a' }}>Requested</span> : <span style={{ color: '#94a3b8' }}>Not required</span>}
            </div>
            {s.description && (
              <div style={{ ...row, color: '#94a3b8', fontStyle: 'italic' }}>{s.description}</div>
            )}
          </div>
        </div>
      ))}

      {/* Travel & minimums */}
      <div style={card}>
        <div style={cardHead}><span>Travel & Minimums</span><EditBtn onClick={() => onEdit(3)} /></div>
        <div style={{ padding: '12px 16px' }}>
          <div style={row}>
            <span style={lbl}>Travel:</span>
            {travel.chargesForTravel
              ? `${travel.travelMethod === 'drivetime' ? 'By drive time' : 'By mileage'} · $${travel.travelRate ?? '—'}/${travel.travelMethod === 'drivetime' ? 'hr' : 'mi'}${travel.travelFrom ? ` from ${travel.travelFrom}` : ''}`
              : 'Not charging for travel'
            }
          </div>
          <div style={row}>
            <span style={lbl}>Minimum:</span>
            {minimumJobPrice ? `$${minimumJobPrice}` : 'No minimum'}
          </div>
        </div>
      </div>

      {/* Availability */}
      <div style={card}>
        <div style={cardHead}><span>Availability</span><EditBtn onClick={() => onEdit(4)} /></div>
        <div style={{ padding: '12px 16px' }}>
          {/* Hours table */}
          <div style={{ display: 'grid', gridTemplateColumns: '55px 1fr', rowGap: 2, marginBottom: 10 }}>
            {DAYS.map(([key, name]) => {
              const h = availability.hours[key]
              return (
                <div key={key} style={{ display: 'contents' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: h?.open ? '#334155' : '#c4c4c4', padding: '3px 0' }}>{name.slice(0, 3)}</span>
                  <span style={{ fontSize: '0.82rem', color: h?.open ? '#1e293b' : '#c4c4c4', padding: '3px 0' }}>
                    {h?.open ? `${fmt(h.from)} – ${fmt(h.to)}` : 'Closed'}
                  </span>
                </div>
              )
            })}
          </div>
          <div style={row}>
            <span style={lbl}>Lead cap:</span>
            {availability.maxLeadsPerDay || availability.maxLeadsPerWeek
              ? `${availability.maxLeadsPerDay ? `${availability.maxLeadsPerDay}/day` : ''}${availability.maxLeadsPerDay && availability.maxLeadsPerWeek ? ' · ' : ''}${availability.maxLeadsPerWeek ? `${availability.maxLeadsPerWeek}/week` : ''}`
              : 'No cap set'
            }
          </div>
          {availability.customerNote && (
            <div style={{ ...row, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>{availability.customerNote}</div>
          )}
        </div>
      </div>

      <button onClick={onSubmit} disabled={saving} style={{ ...btn, marginTop: 8, opacity: saving ? 0.5 : 1 }}>
        {saving ? 'Submitting…' : 'Build my quote form →'}
      </button>
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
        We&apos;ll send you a link to preview your form within a few minutes.
      </div>
    </div>
  )
}
