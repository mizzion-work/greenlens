import { describe, expect, it } from 'vitest'
import { pm25Level } from './air-quality'
import { nearestAspectRatio } from './aspect'

describe('pm25Level', () => {
  it('follows the Thai PCD bands at their edges', () => {
    expect(pm25Level(0).label).toBe('ดีมาก')
    expect(pm25Level(15).label).toBe('ดีมาก')
    expect(pm25Level(15.1).label).toBe('ดี')
    expect(pm25Level(25).label).toBe('ดี')
    expect(pm25Level(37.5).label).toBe('ปานกลาง')
    expect(pm25Level(37.6).tone).toBe('orange')
    expect(pm25Level(75).tone).toBe('orange')
    expect(pm25Level(75.1).tone).toBe('red')
  })
})

describe('nearestAspectRatio', () => {
  it('maps common photo sizes', () => {
    expect(nearestAspectRatio(1080, 1080)).toBe('1:1')
    expect(nearestAspectRatio(3024, 4032)).toBe('3:4')
    expect(nearestAspectRatio(4032, 3024)).toBe('4:3')
    expect(nearestAspectRatio(1080, 1920)).toBe('9:16')
    expect(nearestAspectRatio(1076, 1522)).toBe('2:3')
  })

  it('falls back to square on bad input', () => {
    expect(nearestAspectRatio(0, 100)).toBe('1:1')
    expect(nearestAspectRatio(NaN, 100)).toBe('1:1')
  })
})
