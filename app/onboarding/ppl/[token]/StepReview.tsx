'use client'

import type { OnboardingStepData } from '@/lib/types'

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#1a1a2e',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}
const cardStyle: React.CSSProperties = {
  background: '#f8fafc', borderRadius: 12, padding: '16px 20px', marginBottom: 12,
}
const cardTitle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}
const itemStyle: React.CSSProperties = { fontSize: '0.85rem', color: '#1e293b', marginBottom: 6, lineHeight: 1.5 }
const labelInline: React.CSSProperties = { fontWeight: 600, color: '#475569', marginRight: 6 }

interface Props {
  data: OnboardingStepData
  onSubmit: () => void
  onEdit: (step: number) => void
  saving: boolean
}

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
      Edit
    </button>
  )
}

export default function StepReview({ data, onSubmit, onEdit, saving }: Props) {
  const s1 = data[1]
  const s2 = data[2]
  const s3 = data[3]
  const s4 = data[4]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 12px', lineHeight: 1.55 }}>
        Review your answers below. Click Edit on any section to make changes.
      </p>

      {/* Step 1: Business Basics */}
      <div style={cardStyle}>
        <div style={cardTitle}>
          <span>Business Basics</span>
          <EditBtn onClick={() => onEdit(1)} />
        </div>
        {s1 ? (
          <>
            <div style={itemStyle}><span style={labelInline}>Name:</span>{s1.businessName}</div>
            <div style={itemStyle}><span style={labelInline}>Trade:</span>{s1.tradeType}</div>
            <div style={itemStyle}>
              <span style={labelInline}>Area:</span>
              {s1.serviceAreaType === 'radius'
                ? `${s1.serviceAreaRadius ?? 25} mi from ${s1.serviceAreaAddress || '(no address)'}`
                : `Zip codes: ${s1.serviceAreaZipCodes?.join(', ') || 'none'}`}
            </div>
            <div style={itemStyle}><span style={labelInline}>Description:</span>{s1.businessDescription}</div>
          </>
        ) : (
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Not completed</div>
        )}
      </div>

      {/* Step 2: Services & Pricing */}
      <div style={cardStyle}>
        <div style={cardTitle}>
          <span>Services & Pricing</span>
          <EditBtn onClick={() => onEdit(2)} />
        </div>
        {s2 ? (
          <>
            <div style={itemStyle}><span style={labelInline}>Packages:</span>{s2.hasPackages ? 'Yes' : 'No'}</div>
            <div style={itemStyle}><span style={labelInline}>Display:</span>{s2.displayPreference === 'radio' ? 'Radio buttons' : 'Dropdown'}</div>
            <div style={{ marginTop: 8 }}>
              {s2.services.map((s) => (
                <div key={s.id} style={{ fontSize: '0.82rem', color: '#1e293b', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{s.name}</span>
                  <span style={{ color: '#64748b' }}>${s.price.toFixed(2)} {s.priceType === 'starting_at' ? '(starting at)' : '(flat)'}</span>
                </div>
              ))}
            </div>
            {s2.addOns.length > 0 && (
              <div style={{ marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>ADD-ONS</div>
                {s2.addOns.map((a) => (
                  <div key={a.id} style={{ fontSize: '0.82rem', color: '#1e293b', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{a.name}</span>
                    <span style={{ color: '#64748b' }}>+${a.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Not completed</div>
        )}
      </div>

      {/* Step 3: Pricing Logic */}
      <div style={cardStyle}>
        <div style={cardTitle}>
          <span>Pricing Logic</span>
          <EditBtn onClick={() => onEdit(3)} />
        </div>
        {s3 ? (
          <>
            {s3.perSqft && (
              <div style={itemStyle}>
                <span style={labelInline}>Per sqft:</span>${s3.sqftRate?.toFixed(2) ?? '—'}/sqft
                ({s3.sqftMethod === 'draw_on_map' ? 'draw on map' : 'customer enters number'})
              </div>
            )}
            {s3.travelCharges && (
              <div style={itemStyle}>
                <span style={labelInline}>Travel:</span>
                {s3.travelType === 'mileage' && `$${s3.ratePerMile?.toFixed(2) ?? '—'}/mi`}
                {s3.travelType === 'drivetime' && `$${((s3.ratePerMinute ?? 0) * 60).toFixed(2)}/hr`}
                {s3.travelType === 'both' && `$${s3.ratePerMile?.toFixed(2) ?? '—'}/mi + $${((s3.ratePerMinute ?? 0) * 60).toFixed(2)}/hr`}
                {s3.baseLocation ? ` from ${s3.baseLocation}` : ''}
              </div>
            )}
            {s3.byQuantity && (
              <div style={itemStyle}>
                <span style={labelInline}>Per {s3.quantityLabel || 'unit'}:</span>${s3.ratePerUnit?.toFixed(2) ?? '—'}
              </div>
            )}
            {s3.minimumJobPrice != null && (
              <div style={itemStyle}><span style={labelInline}>Minimum:</span>${s3.minimumJobPrice.toFixed(2)}</div>
            )}
            {!s3.perSqft && !s3.travelCharges && !s3.byQuantity && !s3.minimumJobPrice && (
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No additional pricing logic</div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Not completed</div>
        )}
      </div>

      {/* Step 4: Lead Preferences */}
      <div style={cardStyle}>
        <div style={cardTitle}>
          <span>Lead Preferences</span>
          <EditBtn onClick={() => onEdit(4)} />
        </div>
        {s4 ? (
          <>
            {(s4.maxLeadsPerDay || s4.maxLeadsPerWeek) && (
              <div style={itemStyle}>
                <span style={labelInline}>Limits:</span>
                {s4.maxLeadsPerDay ? `${s4.maxLeadsPerDay}/day` : ''}
                {s4.maxLeadsPerDay && s4.maxLeadsPerWeek ? ', ' : ''}
                {s4.maxLeadsPerWeek ? `${s4.maxLeadsPerWeek}/week` : ''}
              </div>
            )}
            {s4.monthlyBudgetCap != null && (
              <div style={itemStyle}><span style={labelInline}>Budget cap:</span>${s4.monthlyBudgetCap}/mo</div>
            )}
            {s4.preferredLeadTypes.length > 0 && (
              <div style={itemStyle}><span style={labelInline}>Lead types:</span>{s4.preferredLeadTypes.join(', ')}</div>
            )}
            <div style={itemStyle}>
              <span style={labelInline}>Hours:</span>
              {Object.entries(s4.businessHours).filter(([, v]) => v.enabled).map(([d, v]) => `${d.slice(0, 3)} ${v.start}-${v.end}`).join(', ') || 'Not set'}
            </div>
            {s4.additionalNotes && (
              <div style={itemStyle}><span style={labelInline}>Notes:</span>{s4.additionalNotes}</div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Not completed</div>
        )}
      </div>

      <button style={{ ...primaryBtn, opacity: saving ? 0.6 : 1, marginTop: 8 }} disabled={saving} onClick={onSubmit}>
        {saving ? 'Submitting…' : 'Submit Onboarding'}
      </button>
    </div>
  )
}
