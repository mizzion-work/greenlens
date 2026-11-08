import { z } from 'zod'
import { getPlant } from './plants'
import type { GardenPlan, Light, SpaceType } from './types'

const SPACE_EN: Record<SpaceType, string> = {
  balcony: 'condo balcony',
  yard: 'front yard / courtyard of a house',
  rooftop: 'rooftop terrace',
}

const LIGHT_EN: Record<Light, string> = {
  full: 'the space gets strong direct sunlight',
  part: 'the space gets soft, partly shaded daylight',
  shade: 'the space is shaded and gets mostly indirect light',
}

const LAYOUTS = [
  'spread naturally with taller plants at the back and smaller ones in front',
  'lined up along the railing, wall or edge of the space',
  'grouped together as a lush cluster in one corner',
  'some on the floor and some on a simple wooden plant stand',
]

export function layoutFor(variant: number): string {
  return LAYOUTS[Math.abs(Math.floor(variant)) % LAYOUTS.length]
}

export function buildGardenPrompt(input: {
  plan: GardenPlan
  spaceType: SpaceType
  light: Light
}): string {
  const plantLines = input.plan.items
    .map((it) => {
      const p = getPlant(it.plantId)
      return `- ${it.count} × ${p.promptHint}`
    })
    .join('\n')

  return [
    `Edit this photo of a ${SPACE_EN[input.spaceType]} in Thailand. Add real potted plants so it becomes a lush, well-kept green space, while keeping the rest of the photo unchanged.`,
    '',
    'Add exactly these plants (no other plant species):',
    plantLines,
    '',
    'Rules:',
    '- Keep the same camera angle, framing, walls, floor, railing, windows, doors, furniture and background. Do not remove, move or restyle anything that is already there.',
    `- Place the pots where they could really stand on the visible floor or ledges, ${layoutFor(input.plan.variant)}. Keep doorways and walking paths clear.`,
    `- Match the original lighting, shadows, perspective and white balance; ${LIGHT_EN[input.light]}.`,
    '- Use simple pots in natural materials (terracotta, concrete, white ceramic).',
    '- Photorealistic result. No people, animals, text, logos or watermarks.',
  ].join('\n')
}

export const ANALYSIS_PROMPT = `You help Thai city residents turn empty spaces into small gardens.
Look at the photo and describe the space for choosing potted plants.
- isOutdoorSpace: true if it shows a balcony, terrace, yard, courtyard, rooftop or similar area where potted plants could be placed; false for anything else (people, food, documents, indoor rooms without a balcony, etc.).
- spaceType: "balcony" for condo/apartment balconies, "yard" for ground-level yards, courtyards or areas in front of a house, "rooftop" for roofs and roof terraces.
- light: "full" if the area clearly gets direct sun for much of the day (open sky, hard shadows), "part" for partial sun or bright indirect light, "shade" if it is mostly covered or shaded.
- size: usable floor area for pots. "S" under about 4 m², "M" about 4–8 m², "L" over about 8 m².
- summaryTh: one short, friendly sentence in Thai (max 120 characters) describing the space and where plants could go.`

/** Gemini `responseSchema` (OpenAPI subset) for the analysis call. */
export const ANALYSIS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isOutdoorSpace: { type: 'BOOLEAN' },
    spaceType: { type: 'STRING', enum: ['balcony', 'yard', 'rooftop'] },
    light: { type: 'STRING', enum: ['full', 'part', 'shade'] },
    size: { type: 'STRING', enum: ['S', 'M', 'L'] },
    summaryTh: { type: 'STRING' },
  },
  required: ['isOutdoorSpace', 'spaceType', 'light', 'size', 'summaryTh'],
  propertyOrdering: ['isOutdoorSpace', 'spaceType', 'light', 'size', 'summaryTh'],
} as const

export const SpaceAnalysisSchema = z.object({
  isOutdoorSpace: z.boolean(),
  spaceType: z.enum(['balcony', 'yard', 'rooftop']),
  light: z.enum(['full', 'part', 'shade']),
  size: z.enum(['S', 'M', 'L']),
  summaryTh: z.string().max(400),
})

export type SpaceAnalysis = z.infer<typeof SpaceAnalysisSchema>
