// Fire-and-forget funnel tracking for the /build route — see /admin/build-analytics.
export function trackBuildEvent(event: string) {
  fetch('/api/build/track-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  }).catch(() => {})
}
