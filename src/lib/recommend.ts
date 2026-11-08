import { PLANTS } from './plants'
import type { GardenPlan, Plant, PlanItem, PlantSize, SpaceInput, SpaceSize } from './types'

/** How many pot "slots" each space size holds. Large plants take two slots. */
export const SLOTS: Record<SpaceSize, number> = { S: 3, M: 5, L: 8 }

export function slotCost(p: Plant): number {
  return p.size === 'L' ? 2 : 1
}

const SIZE_FIT: Record<SpaceSize, Record<PlantSize, number>> = {
  S: { S: 0.5, M: 0, L: -3 },
  M: { S: 0, M: 0.5, L: 0 },
  L: { S: -0.5, M: 0.3, L: 1 },
}

export function score(p: Plant, input: SpaceInput): number {
  let s = p.pm * 0.5 + p.cool * 0.4
  if (input.beginner) s += p.care === 'easy' ? 1.5 : -1
  s += SIZE_FIT[input.size][p.size]
  // Exposed rooftops in full sun get hot and dry: favour tough plants.
  if (input.spaceType === 'rooftop' && input.light === 'full') {
    s += p.water === 'low' ? 1 : p.water === 'high' ? -1 : 0
  }
  return s
}

/** Plants that can live in this space, best first. */
export function candidates(input: SpaceInput): Plant[] {
  return PLANTS.filter((p) => p.light.includes(input.light))
    .filter((p) => !input.hasPets || p.petSafe === true)
    .map((p) => ({ p, s: score(p, input) }))
    .sort((a, b) => b.s - a.s || a.p.id.localeCompare(b.p.id))
    .map((x) => x.p)
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (items.length < k) return []
  const [head, ...rest] = items
  return [
    ...combinations(rest, k - 1).map((c) => [head, ...c]),
    ...combinations(rest, k),
  ]
}

const TOP_K = 6
const MAX_TYPES = 3
/** Large plants crowd small spaces, so cap how many large types a mix may hold. */
const MAX_LARGE_TYPES: Record<SpaceSize, number> = { S: 0, M: 1, L: 2 }

/**
 * Pick up to three plant types and how many pots of each.
 * `variant` walks through the best combinations in order, so variant 0 is the
 * best mix and each "regenerate" offers the next-best one.
 */
export function recommend(input: SpaceInput, variant = 0): GardenPlan {
  const ranked = candidates(input)
  const scoreOf = new Map(ranked.map((p) => [p.id, score(p, input)]))
  const top = ranked.slice(0, TOP_K)
  const k = Math.min(MAX_TYPES, top.length)

  const all = combinations(top, k)
  const fitting = all.filter(
    (c) => c.filter((p) => p.size === 'L').length <= MAX_LARGE_TYPES[input.size],
  )
  const combos = (fitting.length ? fitting : all)
    .map((c, i) => ({ c, i, s: c.reduce((a, p) => a + (scoreOf.get(p.id) ?? 0), 0) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.c)

  const safeVariant = Math.max(0, Math.floor(variant))
  const types = combos.length ? combos[safeVariant % combos.length] : []
  return { items: allocate(types, SLOTS[input.size]), variant: safeVariant }
}

/** Round-robin pots across the chosen types until the slot budget runs out. */
function allocate(types: Plant[], budget: number): PlanItem[] {
  const counts = types.map(() => 0)
  let left = budget
  let progressed = true
  while (progressed) {
    progressed = false
    types.forEach((p, i) => {
      const cost = slotCost(p)
      if (left >= cost) {
        counts[i]++
        left -= cost
        progressed = true
      }
    })
  }
  return types
    .map((p, i) => ({ plantId: p.id, count: counts[i] }))
    .filter((it) => it.count > 0)
}
