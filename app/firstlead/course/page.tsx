import Link from 'next/link'

const lessons = [
  {
    num: '01',
    title: 'Pick your niche & ideal customer',
    duration: '8 min',
    description: 'Why trying to serve everyone kills your lead gen — and how to pick a niche that actually converts.',
    videoId: null, // Replace with your YouTube video ID e.g. 'dQw4w9WgXcQ'
  },
  {
    num: '02',
    title: 'Build a lead magnet in 60 minutes',
    duration: '11 min',
    description: 'The exact offer structure that makes strangers hand over their contact info willingly.',
    videoId: null,
  },
  {
    num: '03',
    title: 'Set up your first quote form',
    duration: '14 min',
    description: 'How a self-qualifying quote form pre-sells your services before you even pick up the phone.',
    videoId: null,
  },
  {
    num: '04',
    title: 'Drive traffic for free',
    duration: '9 min',
    description: 'Organic channels that work for local service businesses — no ad spend required.',
    videoId: null,
  },
  {
    num: '05',
    title: 'Follow up and close the job',
    duration: '7 min',
    description: 'The 3-step follow-up sequence that books more jobs without being pushy.',
    videoId: null,
  },
]

export default function CourseHomePage() {
  return (
    <div style={{ fontFamily: "'Brraelyn', sans-serif", color: '#0e0020', background: '#fff', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 60, borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, background: 'white', zIndex: 50,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.01em', color: '#0e0020' }}>
            Quote<span style={{ color: '#FFE500', WebkitTextStroke: '1px #0e0020' }}>.</span>Box
          </span>
        </Link>
        <Link href="/signup" style={{
          fontSize: '0.88rem', fontWeight: 600, padding: '8px 18px',
          background: '#0e0020', color: '#FFE500', borderRadius: 8, textDecoration: 'none',
        }}>
          Get started free
        </Link>
      </nav>

      {/* Welcome banner */}
      <section style={{ background: '#0e0020', color: '#fff', padding: '56px 24px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#22c55e20', border: '1px solid #22c55e50',
            color: '#4ade80', fontSize: '0.82rem', fontWeight: 600,
            padding: '6px 16px', borderRadius: 100, marginBottom: 24,
          }}>
            <span style={{ fontSize: '1rem' }}>✓</span> You're in! Course access granted
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
            How to Get Your First Lead Online
          </h1>
          <p style={{ color: '#b0b8cc', fontSize: '1rem', margin: 0, lineHeight: 1.7 }}>
            5 lessons · ~49 min total · Watch at your own pace
          </p>
        </div>
      </section>

      {/* Lessons */}
      <section style={{ padding: '60px 24px', maxWidth: 760, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 28px' }}>Course lessons</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {lessons.map((lesson, i) => (
            <div key={lesson.num} style={{
              border: '1.5px solid #e5e7eb', borderRadius: 14, overflow: 'hidden',
              background: '#fff',
            }}>
              {/* Video embed placeholder */}
              {lesson.videoId ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${lesson.videoId}`}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              ) : (
                <div style={{
                  background: '#0e0020', aspectRatio: '16/9', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#FFE500', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', cursor: 'default',
                  }}>
                    ▶
                  </div>
                  <p style={{ color: '#4a5568', fontSize: '0.8rem', margin: 0 }}>Video coming soon</p>
                </div>
              )}

              {/* Lesson info */}
              <div style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, fontFamily: "'Oswald', sans-serif", fontSize: '1.3rem',
                  fontWeight: 700, color: '#FFE500', WebkitTextStroke: '1.5px #0e0020', lineHeight: 1,
                }}>
                  {lesson.num}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{lesson.title}</p>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 600, color: '#888',
                      background: '#f3f4f6', padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap',
                    }}>
                      {lesson.duration}
                    </span>
                  </div>
                  <p style={{ color: '#666', fontSize: '0.87rem', margin: '6px 0 0', lineHeight: 1.6 }}>
                    {lesson.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upsell CTA */}
      <section style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', padding: '60px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, margin: '0 0 16px' }}>
            Want us to do it all for you?
          </h2>
          <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 32px' }}>
            Quote.Box builds your lead form, runs your ads, and delivers warm leads straight to your inbox.
            You just close the jobs. Starting at $15 per lead.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              display: 'inline-block', background: '#0e0020', color: '#FFE500',
              fontWeight: 700, fontSize: '0.95rem', padding: '14px 28px', borderRadius: 8,
              textDecoration: 'none',
            }}>
              Start getting leads →
            </Link>
            <Link href="/agency" style={{
              display: 'inline-block', background: '#fff', color: '#0e0020',
              fontWeight: 600, fontSize: '0.95rem', padding: '14px 28px', borderRadius: 8,
              textDecoration: 'none', border: '1.5px solid #e5e7eb',
            }}>
              Learn about done-for-you
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 32px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>
          © {new Date().getFullYear()} Quote.Box ·{' '}
          <Link href="/privacy" style={{ color: '#aaa' }}>Privacy</Link>
          {' · '}
          <Link href="/terms" style={{ color: '#aaa' }}>Terms</Link>
        </p>
      </footer>
    </div>
  )
}
