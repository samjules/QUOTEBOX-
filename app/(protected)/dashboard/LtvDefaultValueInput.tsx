'use client'

import { useState } from 'react'

export default function LtvDefaultValueInput({ initial }: { initial: number | null }) {
  const [value, setValue] = useState(initial != null ? String(initial) : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const parsed = value === '' ? null : parseFloat(value)
    await fetch('/api/automations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_lead_value: parsed }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
      <span className="text-xs text-slate-400 shrink-0">Default lead value</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">$</span>
        <input
          type="number"
          min={0}
          placeholder="e.g. 1200"
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false) }}
          className="w-24 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
        style={{ background: saved ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.12)', color: saved ? '#34d399' : '#fff' }}
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
      </button>
      {!value && (
        <span className="text-xs text-slate-500">Booked leads without a form quote use this value</span>
      )}
    </div>
  )
}
