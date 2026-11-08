import { describe, expect, it } from 'vitest'
import { candidates, recommend, SLOTS, slotCost } from './recommend'
import { getPlant } from './plants'
import type { Light, SpaceInput, SpaceSize, SpaceType } from './types'

const base: SpaceInput = {
  spaceType: 'balcony',
  light: 'full',
  size: 'S',
  hasPets: false,
  beginner: false,
}

const LIGHTS: Light[] = ['full', 'part', 'shade']
const SIZES: SpaceSize[] = ['S', 'M', 'L']
const SPACES: SpaceType[] = ['balcony', 'yard', 'rooftop']

function allInputs(): SpaceInput[] {
  const out: SpaceInput[] = []
  for (const spaceType of SPACES)
    for (const light of LIGHTS)
      for (const size of SIZES)
        for (const hasPets of [false, true])
          for (const beginner of [false, true])
            out.push({ spaceType, light, size, hasPets, beginner })
  return out
}

describe('candidates', () => {
  it('only returns plants that tolerate the chosen light', () => {
    for (const light of LIGHTS) {
      const list = candidates({ ...base, light })
      expect(list.length).toBeGreaterThan(0)
      for (const p of list) expect(p.light).toContain(light)
    }
  })

  it('only returns plants known to be pet-safe when there are pets', () => {
    for (const light of LIGHTS) {
      const list = candidates({ ...base, light, hasPets: true })
      expect(list.length).toBeGreaterThan(0)
      for (const p of list) expect(p.petSafe).toBe(true)
    }
  })

  it('ranks big plants lower on a small balcony than on a large yard', () => {
    const small = candidates({ ...base, light: 'part', size: 'S' }).map((p) => p.id)
    const large = candidates({ ...base, light: 'part', size: 'L', spaceType: 'yard' }).map(
      (p) => p.id,
    )
    expect(small.indexOf('fiddle')).toBeGreaterThan(large.indexOf('fiddle'))
  })

  it('is deterministic', () => {
    expect(candidates(base)).toEqual(candidates(base))
  })
})

describe('recommend', () => {
  it('never returns an empty plan for any input combination', () => {
    for (const input of allInputs()) {
      for (const variant of [0, 1, 5]) {
        const plan = recommend(input, variant)
        expect(plan.items.length, JSON.stringify(input)).toBeGreaterThan(0)
        for (const it of plan.items) expect(it.count).toBeGreaterThan(0)
      }
    }
  })

  it('never uses more pot slots than the space allows', () => {
    for (const input of allInputs()) {
      const plan = recommend(input, 0)
      const used = plan.items.reduce((a, it) => a + it.count * slotCost(getPlant(it.plantId)), 0)
      expect(used).toBeLessThanOrEqual(SLOTS[input.size])
    }
  })

  it('uses at most 3 plant types with no duplicates', () => {
    for (const input of allInputs()) {
      const ids = recommend(input, 2).items.map((i) => i.plantId)
      expect(ids.length).toBeLessThanOrEqual(3)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('variant 0 uses the top-ranked plants', () => {
    const top = candidates(base)
      .slice(0, 3)
      .map((p) => p.id)
      .sort()
    const got = recommend(base, 0)
      .items.map((i) => i.plantId)
      .sort()
    // A plant can drop out only when the slot budget ran out before it got a pot.
    for (const id of got) expect(top).toContain(id)
  })

  it('different variants give a different mix when enough candidates exist', () => {
    const input: SpaceInput = { ...base, light: 'part', size: 'M' }
    const a = recommend(input, 0).items.map((i) => i.plantId).sort().join()
    const b = recommend(input, 1).items.map((i) => i.plantId).sort().join()
    expect(a).not.toBe(b)
  })

  it('more space means more pots', () => {
    const count = (size: SpaceSize) =>
      recommend({ ...base, light: 'part', size }, 0).items.reduce((a, i) => a + i.count, 0)
    expect(count('M')).toBeGreaterThan(count('S'))
    expect(count('L')).toBeGreaterThan(count('M'))
  })

  it('keeps large plants off a small balcony when smaller ones fit', () => {
    for (const light of LIGHTS) {
      for (const variant of [0, 1, 2, 3]) {
        const plan = recommend({ ...base, light, size: 'S' }, variant)
        for (const it of plan.items) expect(getPlant(it.plantId).size).not.toBe('L')
      }
    }
  })

  it('records the variant it was built with', () => {
    expect(recommend(base, 4).variant).toBe(4)
  })
})
