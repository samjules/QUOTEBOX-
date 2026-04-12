/**
 * QuoteBox Lead Intelligence Pixel
 * Passive tracking script for hosted quote forms.
 * <5kb minified, zero dependencies, never reads form values.
 *
 * Usage:
 *   <script src="https://your-domain.com/pixel/qb.min.js"
 *           data-api-key="YOUR_KEY"
 *           data-endpoint="https://your-domain.com/api/pixel/event"
 *           async></script>
 */
;(function () {
  /* ── Config ─────────────────────────────────────────────── */
  const script =
    document.currentScript as HTMLScriptElement | null
  const API_KEY = script?.getAttribute('data-api-key') ?? ''
  const ENDPOINT =
    script?.getAttribute('data-endpoint') ?? '/api/pixel/event'

  if (!API_KEY) {
    console.warn('[QB Pixel] No API key found — pixel disabled')
    return
  }

  /* ── Session ────────────────────────────────────────────── */
  let sessionId: string
  try {
    sessionId =
      sessionStorage.getItem('__qb_sid') ??
      crypto.randomUUID()
    sessionStorage.setItem('__qb_sid', sessionId)
  } catch {
    sessionId = crypto.randomUUID()
  }

  console.log('[QB Pixel] Activated — session:', sessionId)
  console.log('[QB Pixel] Endpoint:', ENDPOINT)

  /* ── Consent ────────────────────────────────────────────── */
  let consentGiven = false
  try {
    consentGiven = localStorage.getItem('__qb_consent') === '1'
  } catch {}

  function setConsent(v: boolean) {
    consentGiven = v
    try {
      localStorage.setItem('__qb_consent', v ? '1' : '0')
    } catch {}
    send('page_view', { consent: v }) // re-send with consent flag
    dismissBanner()
  }

  /* ── Beacon helper ──────────────────────────────────────── */
  function send(eventType: string, payload: Record<string, unknown> = {}) {
    console.log(`[QB Pixel] Sending event: ${eventType}`, payload)
    const body = JSON.stringify({
      api_key: API_KEY,
      session_id: sessionId,
      event_type: eventType,
      url: location.href,
      referrer: document.referrer,
      consent: consentGiven,
      payload,
      // UTMs extracted once
      utm_source: urlParam('utm_source'),
      utm_medium: urlParam('utm_medium'),
      utm_campaign: urlParam('utm_campaign'),
      utm_term: urlParam('utm_term'),
      utm_content: urlParam('utm_content'),
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, body)
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {})
    }
  }

  function urlParam(k: string): string {
    try {
      return new URL(location.href).searchParams.get(k) ?? ''
    } catch {
      return ''
    }
  }

  /* ── Page view ──────────────────────────────────────────── */
  const loadTime = Date.now()
  send('page_view', {
    user_agent: navigator.userAgent,
    screen_width: screen.width,
    screen_height: screen.height,
    device_type: /Mobi|Android/i.test(navigator.userAgent)
      ? 'mobile'
      : /Tablet|iPad/i.test(navigator.userAgent)
        ? 'tablet'
        : 'desktop',
  })

  /* ── Scroll depth (throttled) ───────────────────────────── */
  let maxScroll = 0
  let scrollTimer: ReturnType<typeof setTimeout> | null = null
  document.addEventListener(
    'scroll',
    () => {
      const pct = Math.round(
        ((window.scrollY + window.innerHeight) /
          document.documentElement.scrollHeight) *
          100,
      )
      if (pct > maxScroll) maxScroll = pct
      if (scrollTimer) clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        send('scroll_depth', { depth: maxScroll })
      }, 1000)
    },
    { passive: true },
  )

  /* ── Field focus (name only, NEVER reads values) ────────── */
  document.addEventListener(
    'focusin',
    (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT'
      ) {
        const name =
          (el as HTMLInputElement).name ||
          el.getAttribute('data-field') ||
          el.id ||
          'unknown'
        send('field_focus', { field_name: name })
      }
    },
    { passive: true },
  )

  /* ── Form submit detection ──────────────────────────────── */
  document.addEventListener(
    'submit',
    (e: Event) => {
      const form = e.target as HTMLFormElement
      send('form_submit_detected', {
        form_id: form.id || form.getAttribute('name') || 'unknown',
      })
    },
    { passive: true },
  )

  // Also detect button clicks that look like form submits (for SPA forms)
  document.addEventListener(
    'click',
    (e: MouseEvent) => {
      const el = e.target as HTMLElement
      const btn = el.closest('button[type="submit"], [data-qb-submit]')
      if (btn) {
        send('form_submit_detected', {
          form_id: btn.closest('form')?.id || 'spa_form',
        })
      }
    },
    { passive: true },
  )

  /* ── Session end / time on page ─────────────────────────── */
  function sendTimeOnPage() {
    const seconds = Math.round((Date.now() - loadTime) / 1000)
    send('time_on_page', { seconds })
  }

  // Periodic heartbeat every 30s
  setInterval(sendTimeOnPage, 30_000)

  // Session end on page unload
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const seconds = Math.round((Date.now() - loadTime) / 1000)
      send('session_end', { seconds, max_scroll: maxScroll })
    }
  })

  /* ── Consent banner ─────────────────────────────────────── */
  let bannerEl: HTMLElement | null = null

  function dismissBanner() {
    if (bannerEl) {
      bannerEl.remove()
      bannerEl = null
    }
  }

  if (!consentGiven) {
    bannerEl = document.createElement('div')
    bannerEl.id = '__qb_consent_banner'
    bannerEl.innerHTML = `
      <div style="position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;font-family:system-ui,sans-serif;font-size:13px;z-index:99999;box-shadow:0 -2px 10px rgba(0,0,0,.2)">
        <span>We use cookies to improve your experience and analyze site traffic.</span>
        <div style="display:flex;gap:8px;margin-left:16px;flex-shrink:0">
          <button id="__qb_accept" style="background:#10b981;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">Accept</button>
          <button id="__qb_decline" style="background:transparent;color:#9ca3af;border:1px solid #4b5563;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px">Decline</button>
        </div>
      </div>
    `
    document.body.appendChild(bannerEl)
    document.getElementById('__qb_accept')?.addEventListener('click', () => setConsent(true))
    document.getElementById('__qb_decline')?.addEventListener('click', () => {
      setConsent(false)
      dismissBanner()
    })
  }

  /* ── Public API ─────────────────────────────────────────── */
  ;(window as any).__qb = {
    setConsent,
    getSessionId: () => sessionId,
  }
})()
