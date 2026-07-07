import { redirect } from 'next/navigation'

// /demo is retired — /build is the only funnel now. Kept as a redirect (rather than
// deleted outright) so old ad links/bookmarks land somewhere real instead of 404ing.
export default function DemoPage() {
  redirect('/build')
}
