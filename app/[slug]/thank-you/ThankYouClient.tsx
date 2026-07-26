'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { HostedForm, FormConfig } from '@/lib/types'

function isColorDark(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

export default function ThankYouClient({ form }: { form: HostedForm }) {
  const config = form.form_config as FormConfig
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const totalStr = searchParams.get('total')
  const total = totalStr ? parseFloat(totalStr) : 0
  const maxStr = searchParams.get('max')
  const maxTotal = maxStr ? parseFloat(maxStr) : null
  const itemsStr = searchParams.get('items')
  const lineItems: Array<{ label: string; value: string; price: number }> = itemsStr
    ? (() => { try { return JSON.parse(itemsStr) } catch { return [] } })()
    : []
  const hoursStr = searchParams.get('hours')
  const totalHours = hoursStr ? parseFloat(hoursStr) : 0
  const rateStr = searchParams.get('rate')
  const hourlyRate = rateStr ? parseFloat(rateStr) : 0
  const currency = config.currency ?? '$'

  const legacyColorMap: Record<string, string> = { yellow: '#FFE500', blue: '#1A56FF' }
  const accentBg = legacyColorMap[config.brand_color] ?? config.brand_color ?? '#FFE500'
  const isDark = isColorDark(accentBg)
  const accentFg = isDark ? '#ffffff' : '#0e0020'
  // Businesses that haven't uploaded their own hero photo yet get a branded
  // QuoteBox purple + map-texture banner instead of a flat color bar.
  const noHeroImage = !config.hero_image_url

  const isTestMode = searchParams.get('pixel_test') === '1'
  const [pixelStatus, setPixelStatus] = useState<'loading' | 'fired' | 'no_pixel'>('loading')

  // Fire Meta Pixel on this dedicated thank-you URL — triggers the custom conversion rule
  useEffect(() => {
    const pixelId = config.meta_pixel_id
    if (!pixelId) { setPixelStatus('no_pixel'); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (!w.fbq) {
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(script)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const n: any = function (...args: unknown[]) { n.callMethod ? n.callMethod(...args) : n.queue.push(args) }
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []
      w.fbq = n; w._fbq = n
    }
    w.fbq('init', pixelId)
    w.fbq('track', 'PageView') // custom conversion URL rule fires here: /{slug}/thank-you
    w.fbq('track', 'Lead')     // standard event for reporting
    setPixelStatus('fired')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effectiveDisplay = config.quote_display ?? (config.show_total === false ? 'hidden' : 'live')
  const showTotal = effectiveDisplay !== 'hidden' && total > 0

  return (
    <>
    {isTestMode && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: pixelStatus === 'fired' ? '#14532d' : pixelStatus === 'no_pixel' ? '#7f1d1d' : '#1c1917',
        color: 'white',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        fontSize: 13, fontFamily: 'system-ui, sans-serif',
        transition: 'background 0.4s',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 18, height: 18, borderRadius: '50%',
            background: pixelStatus === 'fired' ? '#22c55e' : pixelStatus === 'no_pixel' ? '#ef4444' : '#6b7280',
            fontSize: 10, fontWeight: 700, flexShrink: 0,
          }}>
            {pixelStatus === 'fired' ? '✓' : pixelStatus === 'no_pixel' ? '✕' : '…'}
          </span>
          {pixelStatus === 'no_pixel'
            ? 'No pixel ID saved on this form — go to Lead Machine and assign a pixel'
            : pixelStatus === 'fired'
              ? `Pixel ${config.meta_pixel_id} — PageView + Lead fired`
              : `Pixel ${config.meta_pixel_id} — loading…`}
        </span>
        {pixelStatus === 'fired' && (
          <>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ opacity: 0.55, fontSize: 11 }}>Thank-you page — conversion URL matched</span>
          </>
        )}
      </div>
    )}
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? `linear-gradient(135deg, rgba(240,244,255,0.88) 0%, rgba(232,238,255,0.85) 60%, rgba(240,244,255,0.88) 100%), url('/map-tiles/map_1_tile.svg') center / 600px auto`
        : noHeroImage
          ? `linear-gradient(135deg, rgba(76,29,149,0.94) 0%, rgba(126,34,206,0.90) 55%, rgba(76,29,149,0.94) 100%), url('/map-tiles/map_1_tile.svg') center / 600px auto`
          : `linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.83) 60%, rgba(255,255,255,0.86) 100%), url('/map-tiles/map_1_tile.svg') center / 600px auto`,
      backgroundColor: isDark ? '#e8eeff' : noHeroImage ? '#6b21a8' : `${accentBg}22`,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 16px 80px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'white',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
      }}>
        {/* Hero — business's own photo if set, otherwise a branded purple + map banner */}
        {config.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.hero_image_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            width: '100%', height: 90,
            backgroundImage: `linear-gradient(135deg, rgba(91,33,182,0.90), rgba(147,51,234,0.82)), url('/patterns/map-pattern-2.jpg')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        )}

        {/* Branded header */}
        <div style={{ background: accentBg, padding: '28px 26px 24px', textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '1.25rem', fontWeight: 800,
            color: accentFg, lineHeight: 1.2,
          }}>
            {form.form_name}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '36px 26px 40px', textAlign: 'center' }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%', background: accentBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 22px', fontSize: 32,
            boxShadow: `0 8px 24px ${accentBg}4D`,
          }}>
            <span style={{ color: accentFg }}>✓</span>
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
            {config.confirm_title || 'Your quote is on its way!'}
          </div>

          {(config.confirm_message || config.confirm_message === undefined) && (
            <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
              {config.confirm_message || (email ? (
                <>
                  We&apos;ve received your details and will email your personalised quote to{' '}
                  <strong style={{ color: '#334155' }}>{email}</strong> shortly.
                </>
              ) : (
                <>We&apos;ve received your details and will be in touch shortly.</>
              ))}
            </div>
          )}

          {showTotal && (
            <div style={{
              marginTop: 28, padding: '20px 22px',
              background: `linear-gradient(135deg, ${accentBg}12, ${accentBg}08)`,
              borderRadius: 16,
              border: `1.5px solid ${accentBg}40`,
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {config.total_label || (config.open_ended_estimate ? 'Starting At' : maxTotal != null ? 'Estimated Range' : effectiveDisplay === 'after_submit' ? 'Starting at' : 'Your Estimated Quote')}
              </div>

              {lineItems.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  {lineItems.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      gap: 12, paddingTop: i === 0 ? 0 : 10, paddingBottom: 10,
                      borderBottom: i < lineItems.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', lineHeight: 1.3 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.value}
                        </div>
                      </div>
                      {item.price > 0 && (
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
                          {currency}{item.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {config.open_ended_estimate ? `${currency}${total.toFixed(2)}+` : `${currency}${total.toFixed(2)}`}
                </div>
                {!config.open_ended_estimate && maxTotal != null && (
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b', lineHeight: 1 }}>
                    up to {currency}{maxTotal.toFixed(2)}
                  </div>
                )}
              </div>
              {totalHours > 0 && hourlyRate > 0 && (
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginTop: 8 }}>
                  Est. {totalHours.toFixed(1)} hours @ {currency}{hourlyRate}/hr
                </div>
              )}
              {config.open_ended_estimate ? (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
                  {config.open_ended_text?.trim() || "This is a minimum estimate — there's no maximum."}
                  {totalHours > 0 && hourlyRate > 0 && ' This is how your quote is calculated — the job may take more or less time.'}
                </div>
              ) : maxTotal != null && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
                  Starting price — may run up to 5 extra hours depending on the job
                </div>
              )}

              {/* This number is not a final price — make that impossible to miss
                  right where the customer is most likely to fixate on it. */}
              <div style={{
                marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: '#fef3c7', border: '1.5px solid #f59e0b',
              }}>
                <span style={{ fontSize: '1.05rem', lineHeight: 1, flexShrink: 0 }}>⚠️</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#78350f', letterSpacing: '0.02em' }}>
                  ESTIMATE ONLY — NOT YOUR FINAL PRICE
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
