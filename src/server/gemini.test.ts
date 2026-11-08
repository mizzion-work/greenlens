import { describe, expect, it } from 'vitest'
import { extractImage, extractText, splitDataUrl, wasBlocked } from './gemini'
import { buildGardenPrompt, SpaceAnalysisSchema } from '../lib/prompts'

describe('gemini response helpers', () => {
  it('extracts camelCase inline image data', () => {
    const r = {
      candidates: [
        {
          content: {
            parts: [{ text: 'here you go' }, { inlineData: { mimeType: 'image/png', data: 'AAA' } }],
          },
        },
      ],
    }
    expect(extractImage(r)).toEqual({ mimeType: 'image/png', data: 'AAA' })
    expect(extractText(r)).toBe('here you go')
  })

  it('extracts snake_case inline image data and skips thought images', () => {
    const r = {
      candidates: [
        {
          content: {
            parts: [
              { thought: true, inlineData: { mimeType: 'image/png', data: 'DRAFT' } },
              { inline_data: { mime_type: 'image/jpeg', data: 'FINAL' } },
            ],
          },
        },
      ],
    }
    expect(extractImage(r)).toEqual({ mimeType: 'image/jpeg', data: 'FINAL' })
  })

  it('returns null when there is no image', () => {
    expect(extractImage({})).toBeNull()
    expect(extractImage({ candidates: [{ content: { parts: [{ text: 'no' }] } }] })).toBeNull()
  })

  it('detects safety blocks', () => {
    expect(wasBlocked({ promptFeedback: { blockReason: 'SAFETY' } })).toBe(true)
    expect(wasBlocked({ candidates: [{ finishReason: 'IMAGE_SAFETY' }] })).toBe(true)
    expect(wasBlocked({ candidates: [{ finishReason: 'STOP' }] })).toBe(false)
  })

  it('splits data URLs and rejects anything else', () => {
    expect(splitDataUrl('data:image/jpeg;base64,QUJD')).toEqual({
      mimeType: 'image/jpeg',
      data: 'QUJD',
    })
    expect(splitDataUrl('data:image/svg+xml;base64,QUJD')).toBeNull()
    expect(splitDataUrl('https://example.com/a.jpg')).toBeNull()
  })
})

describe('prompts', () => {
  it('lists every planned plant with its count', () => {
    const prompt = buildGardenPrompt({
      plan: {
        items: [
          { plantId: 'snake', count: 2 },
          { plantId: 'pothos', count: 1 },
        ],
        variant: 0,
      },
      spaceType: 'balcony',
      light: 'part',
    })
    expect(prompt).toContain('2 × snake plant')
    expect(prompt).toContain('1 × golden pothos')
    expect(prompt).toContain('condo balcony')
  })

  it('validates analysis JSON', () => {
    const ok = SpaceAnalysisSchema.safeParse({
      isOutdoorSpace: true,
      spaceType: 'balcony',
      light: 'part',
      size: 'S',
      summaryTh: 'ระเบียงเล็ก แดดรำไร',
    })
    expect(ok.success).toBe(true)
    expect(SpaceAnalysisSchema.safeParse({ spaceType: 'garage' }).success).toBe(false)
  })
})
