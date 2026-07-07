import { cookies } from 'next/headers'
import DemoClient from './DemoClient'
import { DEMO_VARIANT_COOKIE, isDemoVariant, pickDemoVariant } from '@/lib/demo-variant'

export const dynamic = 'force-dynamic'

export default function DemoPage() {
  const fromCookie = cookies().get(DEMO_VARIANT_COOKIE)?.value
  const variant = isDemoVariant(fromCookie) ? fromCookie : pickDemoVariant()

  return <DemoClient variant={variant} />
}
