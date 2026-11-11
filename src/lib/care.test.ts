import { describe, expect, it } from 'vitest'
import { GENERAL_TIPS, PLANT_GUIDE } from './care'
import { PLANT_BY_ID, PLANTS } from './plants'

describe('care guides', () => {
  it('every plant has a complete guide', () => {
    for (const p of PLANTS) {
      const g = PLANT_GUIDE[p.id]
      expect(g, p.id).toBeDefined()
      for (const field of ['water', 'light', 'feed', 'watch'] as const) {
        expect(g[field].length, `${p.id}.${field}`).toBeGreaterThan(5)
      }
    }
  })

  it('has no guides for plants that do not exist', () => {
    for (const id of Object.keys(PLANT_GUIDE)) expect(PLANT_BY_ID[id], id).toBeDefined()
  })

  it('pet tip lists only plants with the matching pet-safety flag', () => {
    const pets = GENERAL_TIPS.find((t) => t.id === 'pets')!
    const safeLine = pets.body[1]
    for (const p of PLANTS.filter((x) => x.petSafe === true)) expect(safeLine).toContain(p.nameTh)
    const toxicLine = pets.body[0]
    for (const name of ['พลูด่าง', 'ลิ้นมังกร', 'เดหลี', 'มอนสเตอร่า']) {
      const plant = PLANTS.find((p) => p.nameTh === name)!
      expect(plant.petSafe, name).toBe(false)
      expect(toxicLine).toContain(name)
    }
  })
})
