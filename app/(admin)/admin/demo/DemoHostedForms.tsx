'use client'

import { useState } from 'react'
import { DEMO_FORMS } from '@/lib/demo-data'
import DemoInstantForm from './DemoInstantForm'

function esc(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const FIELD_TYPE_ICONS: Record<string, string> = {
  radio: '◉', checkbox: '☑', dropdown: '▾', number: '#',
  textarea: '¶', route: '📍', draw_area: '✏', image: '🖼',
}

export default function DemoHostedForms() {
  const [showInstantForm, setShowInstantForm] = useState(false)

  return (
    <div className="py-6" style={{ background: '#f5f5f7', minHeight: '100%' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Hosted Forms</h1>
            <p className="mt-1 text-sm text-gray-500">Your live multi-step quote forms</p>
          </div>
          <span className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm text-sm" style={{ background: '#4f46e5', opacity: 0.6, cursor: 'not-allowed' }}>
            + New Form
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div style={{ background: 'white', borderRadius: 14, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Forms used</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>{DEMO_FORMS.length} / ∞</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: '#ede9fe', color: '#6d28d9', borderRadius: 6, padding: '2px 8px' }}>
                Retainer
              </span>
            </div>
          </div>
          <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #6366f1, #4f46e5)', width: '18%' }} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_FORMS.map((form) => {
            const cfg = form.form_config
            const fields = cfg.fields
            const fieldCount = fields.length
            const created = new Date(form.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

            const isBlue = cfg.brand_color === 'blue'
            const headerBg = isBlue ? '#6422A8' : '#ffe500'
            const headerFg = isBlue ? '#ffffff' : '#5b5bd6'
            const progressBg = isBlue ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)'
            const progressFill = isBlue ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.38)'
            const pillBg = isBlue ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
            const pillFg = isBlue ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.58)'

            return (
              <div key={form.id} style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: headerBg }}>
                  <div style={{ height: 4, background: progressBg }}>
                    <div style={{ height: '100%', width: '33%', background: progressFill, borderRadius: '0 2px 2px 0' }} />
                  </div>
                  <div style={{ padding: '16px 18px 18px' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: isBlue ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.42)', marginBottom: 6 }}>
                      {fieldCount > 0 ? `${fieldCount} step${fieldCount !== 1 ? 's' : ''} · quote form` : 'Quote Form'}
                    </div>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.12rem', fontWeight: 800, color: headerFg, lineHeight: 1.2, marginBottom: 12 }}>
                      {esc(form.form_name)}
                    </div>
                    {fieldCount > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {fields.slice(0, 5).map((f) => (
                          <span key={f.id} style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: pillBg, color: pillFg, borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.7rem' }}>{FIELD_TYPE_ICONS[f.type] ?? '·'}</span>
                            {f.type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                  {[
                    { value: form.leads, label: 'Leads' },
                    { value: fieldCount, label: 'Steps' },
                    { value: cfg.currency, label: 'Currency' },
                  ].map(({ value, label }, i) => (
                    <div key={label} style={{ flex: 1, padding: '13px 8px', textAlign: 'center', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: form.is_active ? '#dcfce7' : '#f1f5f9', color: form.is_active ? '#15803d' : '#64748b' }}>
                    <span style={{ fontSize: 7 }}>{form.is_active ? '●' : '○'}</span>
                    {form.is_active ? 'Live' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{created}</span>
                </div>

                <div style={{ padding: '0 14px 14px', display: 'flex', gap: 6, marginTop: 'auto' }}>
                  {form.instant ? (
                    <button
                      onClick={() => setShowInstantForm(true)}
                      style={{ flex: 1, textAlign: 'center', background: '#4f46e5', color: 'white', padding: '9px 12px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      ▶ Preview Live Form
                    </button>
                  ) : (
                    <span style={{ flex: 1, textAlign: 'center', border: '1.5px solid #e2e8f0', color: '#374151', padding: '9px 12px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600 }}>
                      Preview ↗
                    </span>
                  )}
                  <button style={{ border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', padding: '9px 11px', borderRadius: 10, fontSize: '0.85rem', cursor: 'pointer' }} title="Copy link">🔗</button>
                  <button style={{ border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', padding: '9px 11px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer' }} title="Embed form">{'</>'}</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showInstantForm && <DemoInstantForm onClose={() => setShowInstantForm(false)} />}
    </div>
  )
}
