import { describe, expect, it } from 'vitest'
import { cameraHeading, estimateSun, facingFromHeading, lightFromHours, solarPosition } from './sun'

const BKK = 13.75

describe('solarPosition', () => {
  it('puts the noon sun due south in a northern winter', () => {
    const p = solarPosition(BKK, 355, 12)
    expect(p.azimuth).toBeCloseTo(180, 0)
    expect(p.altitude).toBeCloseTo(90 - BKK - 23.44, 0)
  })

  it('puts the noon sun north of overhead in a Thai June', () => {
    const p = solarPosition(BKK, 172, 12)
    expect(Math.min(p.azimuth, 360 - p.azimuth)).toBeLessThan(1)
    expect(p.altitude).toBeGreaterThan(75)
  })

  it('rises in the east and sets in the west', () => {
    expect(solarPosition(BKK, 80, 7).azimuth).toBeGreaterThan(60)
    expect(solarPosition(BKK, 80, 7).azimuth).toBeLessThan(120)
    expect(solarPosition(BKK, 80, 17).azimuth).toBeGreaterThan(240)
    expect(solarPosition(BKK, 80, 17).azimuth).toBeLessThan(300)
  })
})

describe('estimateSun', () => {
  it('a south-facing balcony gets more sun than a north-facing one', () => {
    expect(estimateSun('balcony', 'S', BKK).hours).toBeGreaterThan(estimateSun('balcony', 'N', BKK).hours + 1)
  })

  it('east and west get about the same hours, but only west is afternoon sun', () => {
    const e = estimateSun('balcony', 'E', BKK)
    const w = estimateSun('balcony', 'W', BKK)
    expect(Math.abs(e.hours - w.hours)).toBeLessThan(0.3)
    expect(w.afternoonSun).toBe(true)
    expect(e.afternoonSun).toBe(false)
  })

  it('open spaces get more sun than a covered balcony facing the same way', () => {
    for (const f of ['N', 'E', 'S', 'W'] as const) {
      const balcony = estimateSun('balcony', f, BKK).hours
      const yard = estimateSun('yard', f, BKK).hours
      const roof = estimateSun('rooftop', f, BKK).hours
      expect(yard).toBeGreaterThanOrEqual(balcony)
      expect(roof).toBeGreaterThanOrEqual(yard)
    }
  })

  it('a rooftop is full sun whichever way it faces', () => {
    expect(estimateSun('rooftop', 'N', BKK).light).toBe('full')
  })

  it('a north-facing balcony in Bangkok is shade', () => {
    expect(estimateSun('balcony', 'N', BKK).light).toBe('shade')
  })
})

describe('lightFromHours', () => {
  it('uses the 6 h / 3 h gardening thresholds', () => {
    expect(lightFromHours(6)).toBe('full')
    expect(lightFromHours(5.9)).toBe('part')
    expect(lightFromHours(3)).toBe('part')
    expect(lightFromHours(2.9)).toBe('shade')
  })
})

describe('compass', () => {
  it('points the back camera north when upright with alpha 0', () => {
    expect(cameraHeading(0, 90, 0)).toBeCloseTo(0, 5)
  })

  it('turning the phone left (alpha 90) points the camera west', () => {
    expect(cameraHeading(90, 90, 0)).toBeCloseTo(270, 5)
  })

  it('snaps a heading to the nearest of 8 directions', () => {
    expect(facingFromHeading(10)).toBe('N')
    expect(facingFromHeading(350)).toBe('N')
    expect(facingFromHeading(100)).toBe('E')
    expect(facingFromHeading(230)).toBe('SW')
  })
})
