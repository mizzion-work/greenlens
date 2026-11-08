import { describe, expect, it } from 'vitest'
import { classifyGeminiError, extractImage, extractText, splitDataUrl, wasBlocked } from './gemini'
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

describe('classifyGeminiError', () => {
  it('treats depleted prepaid credits as quota', () => {
    const body = JSON.stringify({
      error: {
        code: 402,
        message: 'Your prepayment credits are depleted. Please go to AI Studio...',
        status: 'RESOURCE_EXHAUSTED',
      },
    })
    expect(classifyGeminiError(402, body)).toBe('quota')
  })

  it('treats an exceeded quota 429 as quota, other 429/503 as busy', () => {
    expect(classifyGeminiError(429, '{"error":{"message":"You exceeded your current quota"}}')).toBe('quota')
    expect(classifyGeminiError(429, '{"error":{"message":"Too many requests"}}')).toBe('busy')
    expect(classifyGeminiError(503, '{"error":{"message":"The model is overloaded"}}')).toBe('busy')
  })

  it('treats bad or missing keys as not configured', () => {
    expect(classifyGeminiError(400, '{"error":{"details":[{"reason":"API_KEY_INVALID"}]}}')).toBe(
      'not-configured',
    )
    expect(classifyGeminiError(403, '{}')).toBe('not-configured')
  })

  it('falls back to failed', () => {
    expect(classifyGeminiError(404, '{"error":{"message":"model not found"}}')).toBe('failed')
    expect(classifyGeminiError(500, '')).toBe('failed')
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
