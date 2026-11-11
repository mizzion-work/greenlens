import type { Facing, Light, SpaceType } from './types'

export const FACINGS: Facing[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export const FACING_DEG: Record<Facing, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
}

export const FACING_LABEL: Record<Facing, string> = {
  N: 'ทิศเหนือ',
  NE: 'ทิศตะวันออกเฉียงเหนือ',
  E: 'ทิศตะวันออก',
  SE: 'ทิศตะวันออกเฉียงใต้',
  S: 'ทิศใต้',
  SW: 'ทิศตะวันตกเฉียงใต้',
  W: 'ทิศตะวันตก',
  NW: 'ทิศตะวันตกเฉียงเหนือ',
}

/** Bangkok; used when we don't know where the user is. */
export const DEFAULT_LAT = 13.75

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/** Sun altitude and azimuth (degrees, azimuth clockwise from north) at local solar time. */
export function solarPosition(latDeg: number, dayOfYear: number, solarHour: number) {
  const decl = 23.44 * Math.sin(rad((360 / 365) * (284 + dayOfYear)))
  const phi = rad(latDeg)
  const delta = rad(decl)
  const h = rad(15 * (solarHour - 12))
  const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h)
  const altitude = deg(Math.asin(Math.max(-1, Math.min(1, sinAlt))))
  const fromSouth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi))
  const azimuth = (deg(fromSouth) + 180 + 360) % 360
  return { altitude, azimuth }
}

/** Mid-month days, so the estimate is a year-round average. */
const SAMPLE_DAYS = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]
const STEP_H = 0.25
/** Below this the sun is usually behind neighbouring buildings or haze. */
const MIN_ALTITUDE = 10
/** A balcony ceiling hides the sun above roughly this profile angle. */
const BALCONY_MAX_PROFILE = 65
/** In a yard, a sun this high clears the house behind it. */
const YARD_OVERHEAD = 55

export interface SunEstimate {
  /** Average hours per day of direct sun on the plants. */
  hours: number
  light: Light
  /** Most of that sun arrives after 1 pm (hot afternoon sun). */
  afternoonSun: boolean
}

export function lightFromHours(hours: number): Light {
  if (hours >= 6) return 'full'
  if (hours >= 3) return 'part'
  return 'shade'
}

/**
 * Year-round average of direct sun reaching plants in a space whose open side
 * faces `facing`. Balconies are shaded by the ceiling above; yards are open
 * except for the house behind; rooftops are open sky.
 */
export function estimateSun(spaceType: SpaceType, facing: Facing, latDeg = DEFAULT_LAT): SunEstimate {
  const face = FACING_DEG[facing]
  let total = 0
  let afternoon = 0

  for (const day of SAMPLE_DAYS) {
    for (let t = 5; t < 19; t += STEP_H) {
      const { altitude, azimuth } = solarPosition(latDeg, day, t + STEP_H / 2)
      if (altitude < MIN_ALTITUDE) continue
      const off = Math.abs(((azimuth - face + 540) % 360) - 180)
      const inFront = off < 85

      let lit: boolean
      if (spaceType === 'rooftop') {
        lit = true
      } else if (spaceType === 'yard') {
        lit = inFront || altitude > YARD_OVERHEAD
      } else {
        const profile = deg(Math.atan(Math.tan(rad(altitude)) / Math.cos(rad(off))))
        lit = inFront && profile <= BALCONY_MAX_PROFILE
      }

      if (lit) {
        total += STEP_H
        if (t >= 13) afternoon += STEP_H
      }
    }
  }

  const hours = Math.round((total / SAMPLE_DAYS.length) * 10) / 10
  return {
    hours,
    light: lightFromHours(hours),
    afternoonSun: spaceType !== 'rooftop' && total > 0 && afternoon / total > 0.6,
  }
}

/**
 * Compass heading (degrees clockwise from north) of the phone's back camera,
 * from absolute DeviceOrientation angles.
 */
export function cameraHeading(alpha: number, beta: number, gamma: number): number {
  const a = rad(alpha)
  const b = rad(beta)
  const g = rad(gamma)
  const east = -Math.sin(g) * Math.cos(a) - Math.cos(g) * Math.sin(b) * Math.sin(a)
  const north = -Math.sin(g) * Math.sin(a) + Math.cos(g) * Math.sin(b) * Math.cos(a)
  return (deg(Math.atan2(east, north)) + 360) % 360
}

export function facingFromHeading(heading: number): Facing {
  const i = Math.round((((heading % 360) + 360) % 360) / 45) % 8
  return FACINGS[i]
}
