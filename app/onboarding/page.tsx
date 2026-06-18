'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SetupWizard from '@/app/(protected)/form-builder/SetupWizard'

type Step = 1 | 2 | 3 | 4 | 'done'

const STEP_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Logo',
  2: 'Background',
  3: 'Quote Form',
  4: 'Meta Ads',
}

function Spinner() {
  return (
    <svg style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8, animation: 'spin 0.8s linear infinite' }}
      width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

// ── Step dots progress indicator ────────────────────────────────────────────
function StepDots({ current }: { current: Step }) {
  const steps: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4]
  const currentNum = current === 'done' ? 5 : current
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {steps.map((s, i) => {
        const done = s < currentNum
        const active = s === currentNum
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 700,
                background: done ? '#1a1a2e' : active ? '#1a1a2e' : 'rgba(26,26,46,0.1)',
                color: done ? '#ffe500' : active ? '#ffe500' : 'rgba(26,26,46,0.4)',
                boxShadow: active ? '0 0 0 4px rgba(26,26,46,0.12)' : 'none',
                transition: 'all 0.25s',
              }}>
                {done ? (
                  <svg width="11" height="11" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                ) : s}
              </div>
              <span style={{
                marginTop: 5, fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em',
                textTransform: 'uppercase' as const, whiteSpace: 'nowrap',
                color: s <= currentNum ? 'rgba(26,26,46,0.7)' : 'rgba(26,26,46,0.3)',
              }}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px', marginBottom: 18,
                background: done ? '#1a1a2e' : 'rgba(26,26,46,0.1)',
                transition: 'background 0.25s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Image upload area ─────────────────────────────────────────────────────────
interface UploadBoxProps {
  previewUrl: string | null
  uploading: boolean
  label: string
  hint: string
  aspectRatio?: string
  onFile: (file: File) => void
}
function UploadBox({ previewUrl, uploading, label, hint, aspectRatio = '16/7', onFile }: UploadBoxProps) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <div
        onClick={() => !uploading && ref.current?.click()}
        style={{
          width: '100%', aspectRatio, borderRadius: 12,
          border: `2px dashed ${previewUrl ? 'transparent' : '#d1d5db'}`,
          background: previewUrl ? 'transparent' : '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: uploading ? 'default' : 'pointer', overflow: 'hidden',
          position: 'relative', transition: 'border-color 0.15s',
        }}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {!uploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.15s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
              >
                <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>Change photo</span>
              </div>
            )}
          </>
        ) : uploading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.85rem' }}>
            <Spinner />Uploading…
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ width: 40, height: 40, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <svg width="18" height="18" fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Click to upload</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>{hint}</div>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
      />
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────
function OnboardingWizard() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>(1)
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(true)
  const [metaFlash, setMetaFlash] = useState(false)

  // Step 1: logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  // Step 2: background
  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [bgUploading, setBgUploading] = useState(false)

  // Meta connected state
  const [metaConnected, setMetaConnected] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: account } = await supabase
        .from('accounts')
        .select('id, logo_url, dashboard_bg_url')
        .eq('owner_id', user.id)
        .single()

      if (!account) { router.replace('/dashboard'); return }

      setAccountId(account.id)
      if (account.logo_url) setLogoUrl(account.logo_url)
      if ((account as Record<string, unknown>).dashboard_bg_url) setBgUrl((account as Record<string, unknown>).dashboard_bg_url as string)

      // Handle meta OAuth callback
      const metaParam = searchParams.get('meta')
      if (metaParam === 'connected') {
        setMetaConnected(true)
        setMetaFlash(true)
        setStep(4)
        setTimeout(() => {
          setMetaFlash(false)
          setStep('done')
        }, 1600)
      }

      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Logo upload ──
  async function handleLogoUpload(file: File) {
    if (!accountId) return
    setLogoUploading(true)
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `logos/${accountId}/logo-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('vsls').upload(path, file, { upsert: true })
    if (error) { setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('vsls').getPublicUrl(path)
    await supabase.from('accounts').update({ logo_url: publicUrl } as Record<string, string>).eq('id', accountId)
    setLogoUrl(publicUrl)
    setLogoUploading(false)
  }

  // ── Background upload ──
  async function handleBgUpload(file: File) {
    if (!accountId) return
    setBgUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `backgrounds/${accountId}/bg-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('vsls').upload(path, file, { upsert: true })
    if (error) { setBgUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('vsls').getPublicUrl(path)
    await supabase.from('accounts').update({ dashboard_bg_url: publicUrl } as Record<string, string>).eq('id', accountId)
    setBgUrl(publicUrl)
    setBgUploading(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3' }}>
        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Loading…</div>
      </div>
    )
  }

  // ── Step 3: Full-screen SetupWizard ──────────────────────────────────────
  if (step === 3) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg, #f7f6f3)' }}>
        {/* Thin onboarding context bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 24px', background: '#1a1a2e', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffe500' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Setup — Step 3 of 4: Build your quote form
            </span>
          </div>
          <button
            onClick={() => setStep(4)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Skip for now →
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {accountId && (
            <SetupWizard
              accountId={accountId}
              onCustomize={() => setStep(4)}
              onAdvanced={() => router.push('/form-builder')}
              onDone={() => setStep(4)}
            />
          )}
        </div>
      </div>
    )
  }

  // ── Card layout for steps 1, 2, 4 and done ────────────────────────────────
  const stepTitles: Record<Step, string> = {
    1: 'Add your company logo',
    2: 'Add a background photo',
    3: '',
    4: 'Connect your Meta account',
    done: "You're all set!",
  }
  const stepSubtitles: Record<Step, string> = {
    1: 'Your logo appears in the dashboard sidebar and on your quote forms.',
    2: 'This image shows as the background on your dashboard — great for a truck or team photo.',
    3: '',
    4: "Connect Facebook to run lead ads and capture leads directly. You can do this later too.",
    done: "Your dashboard is ready. Start sharing your quote form to capture leads.",
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f7f6f3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 500,
        background: 'white', borderRadius: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}>
        {/* Yellow header stripe */}
        <div style={{ background: '#ffe500', padding: '28px 32px 24px' }}>
          {step !== 'done' && (
            <StepDots current={step} />
          )}
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2, marginBottom: 6 }}>
            {stepTitles[step]}
          </div>
          <div style={{ fontSize: '0.86rem', color: 'rgba(26,26,46,0.6)', lineHeight: 1.55 }}>
            {stepSubtitles[step]}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Step 1: Logo ── */}
          {step === 1 && (
            <>
              <UploadBox
                previewUrl={logoUrl}
                uploading={logoUploading}
                label="Company logo"
                hint="PNG or JPG recommended · max 5 MB"
                aspectRatio="3/1"
                onFile={handleLogoUpload}
              />
              {logoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 9, border: '1px solid #bbf7d0' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="#16a34a" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3 3 7-7" />
                  </svg>
                  <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>Logo uploaded</span>
                </div>
              )}
              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%', padding: '13px', borderRadius: 9, border: 'none',
                  background: '#1a1a2e', color: '#ffe500', fontSize: '0.95rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {logoUrl ? 'Continue →' : 'Skip for now →'}
              </button>
            </>
          )}

          {/* ── Step 2: Background ── */}
          {step === 2 && (
            <>
              <UploadBox
                previewUrl={bgUrl}
                uploading={bgUploading}
                label="Dashboard background"
                hint="Wide landscape photo works best · max 5 MB"
                aspectRatio="16/7"
                onFile={handleBgUpload}
              />
              {bgUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 9, border: '1px solid #bbf7d0' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="#16a34a" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3 3 7-7" />
                  </svg>
                  <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>Background uploaded</span>
                </div>
              )}
              <button
                onClick={() => setStep(3)}
                style={{
                  width: '100%', padding: '13px', borderRadius: 9, border: 'none',
                  background: '#1a1a2e', color: '#ffe500', fontSize: '0.95rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {bgUrl ? 'Continue →' : 'Skip for now →'}
              </button>
              <button
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }}
              >
                ← Back
              </button>
            </>
          )}

          {/* ── Step 4: Meta connect ── */}
          {step === 4 && (
            <>
              {metaFlash && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#f0fdf4', borderRadius: 9, border: '1px solid #bbf7d0' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="#16a34a" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3 3 7-7" />
                  </svg>
                  <span style={{ fontSize: '0.84rem', color: '#166534', fontWeight: 600 }}>Meta connected! Taking you to your dashboard…</span>
                </div>
              )}
              {!metaFlash && (
                <>
                  {metaConnected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#f0fdf4', borderRadius: 9, border: '1px solid #bbf7d0' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="#16a34a" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3 3 7-7" />
                      </svg>
                      <span style={{ fontSize: '0.84rem', color: '#166534', fontWeight: 600 }}>Meta account connected</span>
                    </div>
                  ) : (
                    <a
                      href="/api/meta/connect?from=onboarding"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        width: '100%', padding: '13px', borderRadius: 9, border: 'none',
                        background: '#1877F2', color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                        cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box',
                      }}
                    >
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                      </svg>
                      Connect Meta →
                    </a>
                  )}
                  <button
                    onClick={() => setStep('done')}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 9,
                      border: '1.5px solid #e2e8f0', background: 'white',
                      color: '#374151', fontSize: '0.88rem', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {metaConnected ? 'Continue →' : 'Skip for now →'}
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }}
                  >
                    ← Back
                  </button>
                </>
              )}
            </>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#f0fdf4', border: '2px solid #86efac',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', color: '#16a34a',
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>
                Dashboard is ready
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.65, marginBottom: 28 }}>
                Everything is set up. Start sharing your quote form to capture leads right away.
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  width: '100%', padding: '13px', borderRadius: 9, border: 'none',
                  background: '#1a1a2e', color: '#ffe500', fontSize: '0.95rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Go to dashboard →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  )
}
