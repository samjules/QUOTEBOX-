'use client'

import { useState, useCallback } from 'react'
import type { HostedForm, QuizConfig, QuizNode, QuizResult } from '@/lib/types'

function isColorDark(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

type Screen = 'quiz' | 'result' | 'contact' | 'confirm'

export default function QuizForm({ form, businessName }: { form: HostedForm; businessName: string }) {
  const config = form.form_config
  const quiz = config.quiz as QuizConfig
  const accent = config.brand_color || '#FFE500'
  const isDark = isColorDark(accent)
  const textOnAccent = isDark ? '#ffffff' : '#0f172a'

  const [screen, setScreen] = useState<Screen>('quiz')
  const [currentNodeId, setCurrentNodeId] = useState<string>(quiz.start)
  const [history, setHistory] = useState<string[]>([quiz.start])
  const [resultId, setResultId] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})

  // Contact fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currentNode: QuizNode | null = quiz.nodes[currentNodeId] ?? null
  const currentResult: QuizResult | null = resultId ? (quiz.results[resultId] ?? null) : null

  const totalQuestions = Object.keys(quiz.nodes).length
  const questionIndex = history.length

  const handleAnswer = useCallback((answerId: string, next: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentNodeId]: answerId }))

    if (next.startsWith('result_')) {
      const rid = next.replace('result_', '')
      setResultId(rid)
      setScreen('result')
    } else {
      setHistory(prev => [...prev, next])
      setCurrentNodeId(next)
    }
  }, [currentNodeId])

  const handleBack = useCallback(() => {
    if (screen === 'result') {
      setScreen('quiz')
      setResultId(null)
      return
    }
    if (screen === 'contact') {
      setScreen('result')
      return
    }
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      setCurrentNodeId(newHistory[newHistory.length - 1])
    }
  }, [screen, history])

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter your name'); return }
    if (!email.trim() && !phone.trim()) { setError('Please enter your email or phone'); return }

    setIsSubmitting(true)
    setError('')

    const quizPath = history.map(nodeId => {
      const node = quiz.nodes[nodeId]
      const answerId = selectedAnswers[nodeId]
      const answer = node?.answers.find(a => a.id === answerId)
      return { question: node?.question, answer: answer?.label }
    }).filter(s => s.answer)

    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: form.account_id,
          hosted_form_id: form.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          form_type: 'quiz',
          form_data: {
            _quiz_result_id: resultId,
            _quiz_result_headline: currentResult?.headline,
            _quiz_path: quizPath,
          },
          status: 'new',
        }),
      })
      if (!res.ok) throw new Error()
      setScreen('confirm')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pageBackground = {
    background: `linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.83) 60%, rgba(255,255,255,0.86) 100%), url('/map-tiles/map_1_tile.svg') center / 600px auto`,
    backgroundColor: `${accent}22`,
  }

  return (
    <div style={{ minHeight: '100vh', ...pageBackground }}>
      {/* Header */}
      <header style={{ background: accent, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: textOnAccent, letterSpacing: '-0.02em' }}>
          {businessName || form.form_name}
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* QUIZ SCREEN */}
        {screen === 'quiz' && currentNode && (
          <div>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              {history.length > 1 && (
                <button
                  onClick={handleBack}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  ← Back
                </button>
              )}
              <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: accent, borderRadius: 99, width: `${(questionIndex / totalQuestions) * 100}%`, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {questionIndex} of {totalQuestions}
              </span>
            </div>

            {/* Question */}
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, marginBottom: 28, letterSpacing: '-0.03em' }}>
              {currentNode.question}
            </h1>

            {/* Answer buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentNode.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswer(answer.id, answer.next)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: '#fff',
                    border: `2px solid #e2e8f0`,
                    borderRadius: 14,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = accent
                    el.style.background = `${accent}12`
                    el.style.transform = 'translateY(-1px)'
                    el.style.boxShadow = `0 4px 12px ${accent}30`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = '#e2e8f0'
                    el.style.background = '#fff'
                    el.style.transform = 'none'
                    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
                  }}
                >
                  <span>{answer.label}</span>
                  <span style={{ fontSize: '1.1rem', opacity: 0.4 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULT SCREEN */}
        {screen === 'result' && currentResult && (
          <div>
            <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              {/* Icon */}
              <div style={{ width: 56, height: 56, borderRadius: 16, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={textOnAccent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <path d="M22 4L12 14.01l-3-3"/>
                </svg>
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.03em' }}>
                {currentResult.headline}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.65, marginBottom: currentResult.discount ? 20 : 28 }}>
                {currentResult.body}
              </p>

              {currentResult.discount && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${accent}18`, border: `1.5px solid ${accent}50`, borderRadius: 10, padding: '10px 16px', marginBottom: 28 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={accent} stroke="none">
                    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                  </svg>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{currentResult.discount}</span>
                </div>
              )}

              <button
                onClick={() => setScreen('contact')}
                style={{ width: '100%', padding: '14px', background: accent, color: textOnAccent, border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}
              >
                {currentResult.cta_label || 'Book My Free Estimate →'}
              </button>

              <button
                onClick={handleBack}
                style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', color: '#94a3b8', border: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                ← Go back
              </button>
            </div>
          </div>
        )}

        {/* CONTACT SCREEN */}
        {screen === 'contact' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.03em' }}>
              Almost there — lock in your {currentResult?.discount ? 'discount' : 'estimate'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 28 }}>
              Enter your info below and we&apos;ll be in touch to confirm your appointment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Your Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.85rem', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ marginTop: 20, width: '100%', padding: '14px', background: isSubmitting ? '#94a3b8' : accent, color: textOnAccent, border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: isSubmitting ? 'default' : 'pointer' }}
            >
              {isSubmitting ? 'Submitting…' : (currentResult?.cta_label || 'Book My Free Estimate →')}
            </button>

            <button
              onClick={handleBack}
              style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', color: '#94a3b8', border: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              ← Go back
            </button>
          </div>
        )}

        {/* CONFIRM SCREEN */}
        {screen === 'confirm' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={textOnAccent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <path d="M22 4L12 14.01l-3-3"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.03em' }}>
              You&apos;re all set!
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.65, maxWidth: 340, margin: '0 auto' }}>
              We&apos;ve received your info and will reach out soon to confirm your appointment.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
