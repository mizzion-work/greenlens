import { getPlant } from './plants'
import type { GardenPlan, Impact, PlantSize, SpaceSize } from './types'

/** Rough floor area of each space size, m². */
export const AREA_M2: Record<SpaceSize, number> = { S: 3, M: 6, L: 12 }

/** Rough leaf area of one potted plant of each size, m². */
const LEAF_M2: Record<PlantSize, number> = { S: 0.35, M: 0.9, L: 2.2 }

const TEMP_MAX = 2
const PM_MAX = 15

const round1 = (n: number) => Math.round(n * 10) / 10
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Back-of-envelope estimate of the micro-climate effect of a plan.
 *
 * Cooling and dust capture scale with leaf area per floor area ("density"),
 * weighted by each plant's relative cooling / dust scores. Results are capped
 * at 2 °C and 15 %, the upper end reported for small-scale urban greening, and
 * are shown to users as ranges because they are estimates, not measurements.
 */
export function estimateImpact(plan: GardenPlan, size: SpaceSize): Impact {
  const rows = plan.items.map((it) => ({ p: getPlant(it.plantId), c: it.count }))
  const potCount = rows.reduce((a, r) => a + r.c, 0)
  const areaM2 = AREA_M2[size]

  if (potCount === 0) {
    return {
      tempDrop: [0, 0],
      pmReduction: [0, 0],
      leafAreaM2: 0,
      areaM2,
      potCount: 0,
      budgetTHB: [0, 0],
    }
  }

  const leaf = rows.reduce((a, r) => a + r.c * LEAF_M2[r.p.size], 0)
  const density = leaf / areaM2
  const avgCool = rows.reduce((a, r) => a + r.c * r.p.cool, 0) / potCount
  const avgPm = rows.reduce((a, r) => a + r.c * r.p.pm, 0) / potCount

  const tempHigh = round1(clamp(0.3 + 1.1 * density * (avgCool / 6), 0.3, TEMP_MAX))
  const tempLow = round1(Math.max(0.1, tempHigh * 0.5))
  const pmHigh = Math.round(clamp(4 + 9 * density * (avgPm / 7), 4, PM_MAX))
  const pmLow = Math.max(2, Math.round(pmHigh * 0.6))

  const budgetTHB: [number, number] = [
    rows.reduce((a, r) => a + r.c * r.p.priceTHB[0], 0),
    rows.reduce((a, r) => a + r.c * r.p.priceTHB[1], 0),
  ]

  return {
    tempDrop: [tempLow, tempHigh],
    pmReduction: [pmLow, pmHigh],
    leafAreaM2: round1(leaf),
    areaM2,
    potCount,
    budgetTHB,
  }
}
