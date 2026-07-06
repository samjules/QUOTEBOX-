'use client'

import { useState } from 'react'
import DemoSidebar, { type DemoTab } from './DemoSidebar'
import DemoOverview from './DemoOverview'
import DemoLeads from './DemoLeads'
import DemoHostedForms from './DemoHostedForms'

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="min-h-full flex items-center justify-center" style={{ background: '#f5f5f7' }}>
      <div className="text-center text-gray-400">
        <p className="text-sm">{label} — not wired up for this demo</p>
      </div>
    </div>
  )
}

export default function DemoDashboard() {
  const [tab, setTab] = useState<DemoTab>('dashboard')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f4f4f6' }}>
      <DemoSidebar activeTab={tab} onSelect={setTab} onExit={() => { window.location.href = '/admin' }} />
      <div className="flex-1 overflow-auto flex flex-col">
        <div style={{ background: '#0e0020', color: '#FFE500', fontSize: '0.72rem', fontWeight: 700, textAlign: 'center', padding: '5px 12px', letterSpacing: '0.04em', flexShrink: 0 }}>
          🎬 SALES DEMO — this is exactly what a client's dashboard looks like, populated with sample data
        </div>
        <div className="flex-1 overflow-auto">
          {tab === 'dashboard' && <DemoOverview />}
          {tab === 'leads' && <DemoLeads />}
          {tab === 'hosted-forms' && <DemoHostedForms />}
          {tab === 'calendar' && <ComingSoonTab label="Calendar" />}
          {tab === 'form-builder' && <ComingSoonTab label="Form Builder" />}
          {tab === 'analytics' && <ComingSoonTab label="Analytics" />}
          {tab === 'billing' && <ComingSoonTab label="Billing & Credits" />}
        </div>
      </div>
    </div>
  )
}
