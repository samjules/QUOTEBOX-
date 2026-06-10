import type { FormField } from './types'

export interface RouteResult {
  distanceMiles: number
  durationMinutes: number
}

export interface BreakdownLine {
  label: string
  detail: string
  amount: number
}

export function applyConditionalRate(
  rules: FormField['conditionalRules'],
  baseRate: number,
  fields: FormField[],
  answers: Record<string, unknown>,
): number {
  if (!rules?.length) return baseRate
  for (const rule of rules) {
    if (!rule.conditions?.length) continue
    const allMatch = rule.conditions.every((cond) => {
      if (!cond.whenFieldId || !cond.whenValue) return false
      const watchField = fields.find((f) => f.id === cond.whenFieldId)
      if (!watchField) return false
      const watchAnswer = answers[cond.whenFieldId]
      if (watchField.type === 'radio' || watchField.type === 'dropdown') {
        return watchAnswer === cond.whenValue
      } else if (watchField.type === 'checkbox') {
        return ((watchAnswer as string[]) ?? []).includes(cond.whenValue)
      }
      return String(watchAnswer ?? '') === cond.whenValue
    })
    if (allMatch) return rule.rate
  }
  return baseRate
}

export function computeTotal(
  fields: FormField[],
  answers: Record<string, unknown>,
  routeData: Record<string, RouteResult | null>,
  drawAreaData: Record<string, number | null> = {},
): number {
  return computeBreakdown(fields, answers, routeData, drawAreaData).reduce((s, l) => s + l.amount, 0)
}

export function computeBreakdown(
  fields: FormField[],
  answers: Record<string, unknown>,
  routeData: Record<string, RouteResult | null>,
  drawAreaData: Record<string, number | null> = {},
): BreakdownLine[] {
  const lines: BreakdownLine[] = []

  const activeRateOverrides: Record<string, number> = {}
  const activeRouteOverrides: Record<string, { mile?: number; min?: number }> = {}

  for (const f of fields) {
    if (f.type === 'radio' || f.type === 'dropdown') {
      const selOpt = f.options?.find((o) => o.id === (answers[f.id] as string))
      if (selOpt?.rateOverrides) Object.assign(activeRateOverrides, selOpt.rateOverrides)
      if (selOpt?.routeOverrides) Object.assign(activeRouteOverrides, selOpt.routeOverrides)
    } else if (f.type === 'checkbox') {
      for (const oid of (answers[f.id] as string[]) ?? []) {
        const selOpt = f.options?.find((o) => o.id === oid)
        if (selOpt?.rateOverrides) Object.assign(activeRateOverrides, selOpt.rateOverrides)
        if (selOpt?.routeOverrides) Object.assign(activeRouteOverrides, selOpt.routeOverrides)
      }
    }
  }

  for (const f of fields) {
    if (f.type === 'radio' || f.type === 'dropdown') {
      // Skip fields consumed by a radius_tiers route as rate or hours source
      const isRateSource = fields.some(
        (rf) => rf.type === 'route' && rf.routeChargeType === 'radius_tiers' && rf.baseRateFieldId === f.id
      )
      const isHoursSource = fields.some(
        (rf) => rf.type === 'route' && rf.routeChargeType === 'radius_tiers' && rf.jobHoursFieldId === f.id
      )
      if (isRateSource || isHoursSource) continue
      const opt = f.options?.find((o) => o.id === (answers[f.id] as string))
      if (opt) {
        const amount = opt.hours ? opt.price * opt.hours : opt.price
        if (amount !== 0) lines.push({ label: f.label, detail: opt.label, amount })
      }
    } else if (f.type === 'checkbox') {
      for (const oid of (answers[f.id] as string[]) ?? []) {
        const opt = f.options?.find((o) => o.id === oid)
        if (opt) {
          const amount = opt.hours ? opt.price * opt.hours : opt.price
          if (amount !== 0) lines.push({ label: f.label, detail: opt.label, amount })
        }
      }
    } else if (f.type === 'number') {
      const qty = Number(answers[f.id]) || 0
      if (qty === 0) continue
      const effectiveRate = activeRateOverrides[f.id] !== undefined
        ? activeRateOverrides[f.id]
        : applyConditionalRate(f.conditionalRules, f.ratePerUnit ?? 0, fields, answers)
      const amount = qty * effectiveRate
      if (amount !== 0) lines.push({ label: f.label, detail: `${qty} × $${effectiveRate}`, amount })
    } else if (f.type === 'route') {
      const rd = routeData[f.id]
      if (!rd || f.routeChargeType === 'none') continue

      if (f.routeChargeType === 'radius_tiers' || !f.routeChargeType) {
        const tiers = f.radiusTiers ?? []
        const sorted = [...tiers].sort((a, b) => {
          if (a.maxMiles === null) return 1
          if (b.maxMiles === null) return -1
          return a.maxMiles - b.maxMiles
        })
        const match = sorted.find((t) => t.maxMiles === null || rd.distanceMiles <= t.maxMiles)
        if (match) {
          // Hourly rate from base rate field
          let hourlyRate = 0
          let rateLabel = 'rate'
          if (f.baseRateFieldId) {
            const rateField = fields.find((f2) => f2.id === f.baseRateFieldId)
            if (rateField) {
              const selOpt = rateField.options?.find((o) => o.id === (answers[rateField.id] as string))
              if (selOpt) { hourlyRate = selOpt.price; rateLabel = selOpt.label }
            }
          }
          // Job hours from job hours field (or fall back to base rate field's option.hours)
          let jobHours = 0
          if (f.jobHoursFieldId) {
            const hoursField = fields.find((f2) => f2.id === f.jobHoursFieldId)
            if (hoursField) {
              const selOpt = hoursField.options?.find((o) => o.id === (answers[hoursField.id] as string))
              if (selOpt?.hours != null) jobHours = selOpt.hours
            }
          } else if (f.baseRateFieldId) {
            const rateField = fields.find((f2) => f2.id === f.baseRateFieldId)
            if (rateField) {
              const selOpt = rateField.options?.find((o) => o.id === (answers[rateField.id] as string))
              if (selOpt?.hours != null) jobHours = selOpt.hours
            }
          }
          // estimate = rate × hours + driveCharge + extras
          const laborAmount = hourlyRate * jobHours
          const driveCharge = match.driveCharge ?? 0
          const tierIdx = sorted.indexOf(match)
          const prevMax = tierIdx === 0 ? 0 : (sorted[tierIdx - 1].maxMiles ?? 0)
          const tierRange = match.maxMiles ? `${prevMax}–${match.maxMiles}mi` : `${prevMax}mi+`
          const amount = laborAmount + driveCharge
          const laborPart = hourlyRate > 0 ? `$${hourlyRate}/hr (${rateLabel}) × ${jobHours}hr` : ''
          const drivePart = driveCharge > 0 ? `+$${driveCharge} drive` : ''
          const detail = `${rd.distanceMiles.toFixed(1)}mi → ${tierRange} · ${[laborPart, drivePart].filter(Boolean).join(' ')}`
          if (amount !== 0) lines.push({ label: f.label, detail, amount })
        }
      } else {
        const routeOvr = activeRouteOverrides[f.id]
        const effectiveMileRate = routeOvr?.mile !== undefined
          ? routeOvr.mile
          : applyConditionalRate(f.conditionalRules, f.ratePerMile ?? 0, fields, answers)
        const effectiveMinRate = routeOvr?.min !== undefined
          ? routeOvr.min
          : applyConditionalRate(f.conditionalRules, f.ratePerMinute ?? 0, fields, answers)

        if ((f.routeChargeType === 'mileage' || f.routeChargeType === 'both') && effectiveMileRate > 0) {
          const billableMiles = Math.max(0, rd.distanceMiles - (f.freeMiles ?? 0))
          const amount = billableMiles * effectiveMileRate
          if (amount !== 0) lines.push({ label: f.label, detail: `${billableMiles.toFixed(1)}mi × $${effectiveMileRate}/mi`, amount })
        }
        if ((f.routeChargeType === 'drivetime' || f.routeChargeType === 'both') && effectiveMinRate > 0) {
          const billableMinutes = Math.max(0, rd.durationMinutes - (f.freeMinutes ?? 0))
          const amount = billableMinutes * effectiveMinRate
          if (amount !== 0) lines.push({ label: f.label, detail: `${billableMinutes.toFixed(0)}min × $${effectiveMinRate}/min`, amount })
        }
      }
    } else if (f.type === 'draw_area') {
      const sqFt = drawAreaData[f.id]
      if (!sqFt) continue
      const effectiveRate = activeRateOverrides[f.id] !== undefined
        ? activeRateOverrides[f.id]
        : (f.ratePerSqFt ?? 0)
      const amount = sqFt * effectiveRate
      if (amount !== 0) lines.push({ label: f.label, detail: `${sqFt.toFixed(0)} sqft × $${effectiveRate}/sqft`, amount })
    }
  }

  return lines
}
