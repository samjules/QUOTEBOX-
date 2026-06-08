'use client'

import { useState } from 'react'

export default function LTVCalculatorPage() {
  const [pricePerMonth, setPricePerMonth] = useState(350)
  const [churnRate, setChurnRate] = useState(13)
  const [grossMargin, setGrossMargin] = useState(90)
  const [cac, setCac] = useState(500)

  const safeNum = (v: number) => (isNaN(v) ? 0 : v)

  const ltv =
    safeNum(churnRate) === 0
      ? Infinity
      : safeNum(pricePerMonth) / (safeNum(churnRate) / 100)

  const grossProfitLtv =
    ltv === Infinity ? Infinity : ltv * (safeNum(grossMargin) / 100)

  const ltvCacRatio =
    safeNum(cac) === 0 || grossProfitLtv === Infinity
      ? Infinity
      : grossProfitLtv / safeNum(cac)

  const halfChurnLtv =
    safeNum(churnRate) === 0
      ? Infinity
      : (safeNum(pricePerMonth) / ((safeNum(churnRate) / 2) / 100)) *
        (safeNum(grossMargin) / 100)

  const formatDollars = (n: number) =>
    n === Infinity ? '∞' : `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  const ratioColor =
    ltvCacRatio === Infinity || ltvCacRatio >= 3
      ? '#16a34a'
      : ltvCacRatio >= 1
      ? '#ca8a04'
      : '#dc2626'

  const ratioLabel =
    ltvCacRatio === Infinity || ltvCacRatio >= 3
      ? 'Excellent'
      : ltvCacRatio >= 1
      ? 'Healthy'
      : 'Needs work'

  const churnMultiplier =
    grossProfitLtv === 0 || grossProfitLtv === Infinity
      ? null
      : halfChurnLtv / grossProfitLtv

  return (
    <div className="min-h-full p-6 md:p-8" style={{ background: '#f4f4f6' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">LTV Calculator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Based on Alex Hormozi&apos;s lifetime value framework
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left — Inputs */}
        <div
          className="bg-white rounded-2xl border border-gray-100 p-6"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <h2 className="text-base font-semibold text-gray-900 mb-5">Your Numbers</h2>

          <div className="space-y-5">
            {/* Monthly Price */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Monthly Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  value={pricePerMonth}
                  onChange={e => setPricePerMonth(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-lg font-semibold text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 pl-8"
                />
              </div>
            </div>

            {/* Monthly Churn Rate */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Monthly Churn Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={churnRate}
                  onChange={e => setChurnRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-lg font-semibold text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  %
                </span>
              </div>
            </div>

            {/* Gross Margin */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Gross Margin
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={grossMargin}
                  onChange={e => setGrossMargin(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-lg font-semibold text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  %
                </span>
              </div>
            </div>

            {/* CAC */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Cost to Acquire (CAC)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  value={cac}
                  onChange={e => setCac(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-lg font-semibold text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 pl-8"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right — Results */}
        <div
          className="bg-white rounded-2xl border border-gray-100 p-6"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <h2 className="text-base font-semibold text-gray-900 mb-5">Results</h2>

          {/* Customer LTV */}
          <div
            className="rounded-xl p-4 mb-3"
            style={{ background: 'rgba(91,91,214,0.06)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Customer LTV
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {formatDollars(ltv)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Price ÷ Churn Rate</p>
          </div>

          {/* Gross Profit LTV */}
          <div
            className="rounded-xl p-4 mb-3"
            style={{ background: 'rgba(91,91,214,0.06)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Gross Profit LTV
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {formatDollars(grossProfitLtv)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              LTV &times; Gross Margin — what you actually keep
            </p>
          </div>

          {/* LTV : CAC Ratio */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(91,91,214,0.06)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              LTV : CAC Ratio
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: ratioColor }}
            >
              {ltvCacRatio === Infinity ? '∞' : ltvCacRatio.toFixed(1)} : 1
            </p>
            <p className="text-xs mt-1 font-semibold" style={{ color: ratioColor }}>
              {ratioLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Churn Impact card */}
      <div
        className="bg-white rounded-2xl border border-gray-100 p-6 mb-6"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
      >
        <h2 className="text-base font-semibold text-gray-900">The Churn Lever</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-5">
          Reducing churn is more powerful than acquiring more customers
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Current churn */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Current Churn
            </p>
            <p className="text-lg font-bold text-gray-900">{churnRate}% monthly</p>
            <p className="text-sm text-gray-500 mt-1">
              Gross Profit LTV:{' '}
              <span className="font-semibold text-gray-700">
                {formatDollars(grossProfitLtv)}
              </span>
            </p>
          </div>

          {/* Half churn */}
          <div
            className="rounded-xl border p-4"
            style={{ background: 'rgba(22,163,74,0.06)', borderColor: 'rgba(22,163,74,0.2)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#15803d' }}>
              Half the Churn
            </p>
            <p className="text-lg font-bold text-gray-900">{churnRate / 2}% monthly</p>
            <p className="text-sm mt-1" style={{ color: '#15803d' }}>
              Gross Profit LTV:{' '}
              <span className="font-semibold">{formatDollars(halfChurnLtv)}</span>
            </p>
            {churnMultiplier !== null && (
              <p className="text-xs font-semibold mt-2" style={{ color: '#16a34a' }}>
                {churnMultiplier.toFixed(1)}x more valuable per customer
              </p>
            )}
          </div>
        </div>
      </div>

      {/* The Rule card */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
          The Rule
        </p>
        <p className="text-lg font-semibold leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>
          &ldquo;As long as you&apos;re spending less than{' '}
          <span className="text-white font-bold">{formatDollars(grossProfitLtv)}</span> to get
          a customer, you&apos;re going to grow.&rdquo;
        </p>
        <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
          — Alex Hormozi&apos;s framework
        </p>
      </div>
    </div>
  )
}
