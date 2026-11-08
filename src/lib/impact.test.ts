import { describe, expect, it } from 'vitest'
import { estimateImpact } from './impact'
import { recommend } from './recommend'
import type { GardenPlan, Light, SpaceSize } from './types'

const plan = (items: [string, number][]): GardenPlan => ({
  items: items.map(([plantId, count]) => ({ plantId, count })),
  variant: 0,
})

describe('estimateImpact', () => {
  it('returns zeros for an empty plan', () => {
    const r = estimateImpact(plan([]), 'S')
    expect(r.tempDrop).toEqual([0, 0])
    expect(r.pmReduction).toEqual([0, 0])
    expect(r.potCount).toBe(0)
  })

  it('stays within the published caps for every recommended plan', () => {
    for (const light of ['full', 'part', 'shade'] as Light[]) {
      for (const size of ['S', 'M', 'L'] as SpaceSize[]) {
        const p = recommend(
          { spaceType: 'yard', light, size, hasPets: false, beginner: false },
          0,
        )
        const r = estimateImpact(p, size)
        expect(r.tempDrop[0]).toBeGreaterThan(0)
        expect(r.tempDrop[0]).toBeLessThanOrEqual(r.tempDrop[1])
        expect(r.tempDrop[1]).toBeLessThanOrEqual(2)
        expect(r.pmReduction[0]).toBeLessThanOrEqual(r.pmReduction[1])
        expect(r.pmReduction[1]).toBeLessThanOrEqual(15)
      }
    }
  })

  it('more plants in the same space never lowers the estimate', () => {
    const few = estimateImpact(plan([['rubber', 1]]), 'M')
    const many = estimateImpact(plan([['rubber', 4]]), 'M')
    expect(many.tempDrop[1]).toBeGreaterThanOrEqual(few.tempDrop[1])
    expect(many.pmReduction[1]).toBeGreaterThanOrEqual(few.pmReduction[1])
    expect(many.leafAreaM2).toBeGreaterThan(few.leafAreaM2)
  })

  it('the same plants have less effect spread over a bigger space', () => {
    const p = plan([['fern', 3]])
    expect(estimateImpact(p, 'L').tempDrop[1]).toBeLessThanOrEqual(
      estimateImpact(p, 'S').tempDrop[1],
    )
  })

  it('sums pot count and budget', () => {
    const r = estimateImpact(
      plan([
        ['snake', 2],
        ['aloe', 1],
      ]),
      'S',
    )
    expect(r.potCount).toBe(3)
    expect(r.budgetTHB).toEqual([80 * 2 + 50, 300 * 2 + 150])
  })
})
