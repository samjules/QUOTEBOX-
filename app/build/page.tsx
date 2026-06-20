import PublicWizard from './PublicWizard'

export const metadata = {
  title: 'Build Your Quote Form — Quotebox',
  description: 'Build a free instant-quote form for your moving or junk removal business in under 5 minutes.',
}

export default function BuildPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg)', fontFamily: "'Instrument Sans', sans-serif" }}>
          Quotebox
        </span>
      </div>
      <PublicWizard />
    </div>
  )
}
