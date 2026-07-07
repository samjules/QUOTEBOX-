'use client'

import { useEffect, useState } from 'react'

const APPLE_URL = 'https://apps.apple.com/us/app/quote-box-lead-machine/id6761129794'
const DISMISS_KEY = 'qb_mobile_app_prompt_dismissed'

export default function MobileAppPrompt() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div
      className="lg:hidden flex items-center gap-3 mx-4 mt-3 px-4 py-3 rounded-xl"
      style={{ background: '#13122b', color: '#fff' }}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ background: 'rgba(91,91,214,0.35)' }}>
        <svg width="16" height="20" viewBox="0 0 814 1000" fill="currentColor">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-110.7c-67.5-98.2-120-252.6-120-398.7 0-138.9 48.4-207.5 96.8-253.5 57.3-54.5 138.4-86.1 213.3-86.1 81.6 0 132.2 39.5 189.5 39.5 55.4 0 115.7-42.3 207.8-42.3zm-156.5-252c32.5-50 56.7-119 56.7-188C688.3 24.6 549.8 0 476.5 0c-2 0-4 0-6.1.1-2.3 30.5-1.2 96 22.7 158.6 23.2 61.5 56.8 99.2 138.4 130.2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-bold leading-tight">Get the QuoteBox app</div>
        <div className="text-[11px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
          View &amp; respond to leads on the go. For full functionality, use a desktop browser.
        </div>
      </div>
      <a
        href={APPLE_URL}
        target="_blank"
        rel="noreferrer"
        className="flex-shrink-0 px-3 py-2 rounded-lg text-[11.5px] font-bold"
        style={{ background: '#fff', color: '#13122b' }}
      >
        Download
      </a>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  )
}
