export type Light = 'full' | 'part' | 'shade'
export type SpaceType = 'balcony' | 'yard' | 'rooftop'
export type SpaceSize = 'S' | 'M' | 'L'
export type PlantSize = 'S' | 'M' | 'L'
export type Water = 'low' | 'medium' | 'high'
export type Care = 'easy' | 'medium'

export interface SpaceInput {
  spaceType: SpaceType
  light: Light
  size: SpaceSize
  hasPets: boolean
  beginner: boolean
}

export interface Plant {
  id: string
  nameTh: string
  nameEn: string
  scientific: string
  light: Light[]
  water: Water
  size: PlantSize
  /** Relative dust-capture ability, 1–10 (leaf area, texture, density). */
  pm: number
  /** Relative cooling ability, 1–10 (shade + transpiration). */
  cool: number
  care: Care
  /** true = non-toxic to cats & dogs, false = toxic, null = not well documented. */
  petSafe: boolean | null
  tip: string
  /** Typical retail price in THB for one pot, [min, max]. */
  priceTHB: [number, number]
  /** Short English description used when asking the image model to draw it. */
  promptHint: string
}

export interface PlanItem {
  plantId: string
  count: number
}

export interface GardenPlan {
  items: PlanItem[]
  variant: number
}

export interface Impact {
  tempDrop: [number, number]
  pmReduction: [number, number]
  leafAreaM2: number
  areaM2: number
  potCount: number
  budgetTHB: [number, number]
}
