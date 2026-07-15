import { Suspense } from 'react'
import TrialFlow from './TrialFlow'

export const metadata = {
  title: 'Get Started With Quotebox — Instant Quote Forms & CRM for Home & Auto Service Businesses',
  description: 'Build your branded instant-quote form and get started with Quotebox — software, paid ad setup, or fully managed.',
}

export default function BuildPage() {
  return (
    <Suspense fallback={null}>
      <TrialFlow />
    </Suspense>
  )
}
