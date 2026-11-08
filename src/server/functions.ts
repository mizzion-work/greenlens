import { createServerFn } from '@tanstack/react-start'
import { getRequest, getRequestHeader } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { nearestAspectRatio } from '../lib/aspect'
import { PLANT_BY_ID } from '../lib/plants'
import {
  ANALYSIS_PROMPT,
  ANALYSIS_RESPONSE_SCHEMA,
  buildGardenPrompt,
  SpaceAnalysisSchema,
  type SpaceAnalysis,
} from '../lib/prompts'
import {
  extractImage,
  extractText,
  GeminiError,
  generateContent,
  splitDataUrl,
  wasBlocked,
} from './gemini'

const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image'
const DEFAULT_TEXT_MODEL = 'gemini-3.6-flash'
/** ~4.5 MB of base64; the client sends ≤1280px JPEGs, usually 200–500 KB. */
const MAX_IMAGE_CHARS = 6_000_000

export type FailureCode =
  | 'not-configured'
  | 'rate-limited'
  | 'bad-input'
  | 'blocked'
  | 'no-image'
  | 'busy'
  | 'failed'

export type Failure = { ok: false; code: FailureCode }

function apiKey(): string | null {
  const key = env.GEMINI_API_KEY
  return typeof key === 'string' && key.trim() ? key.trim() : null
}

function clientKey(): string {
  return getRequestHeader('cf-connecting-ip') ?? getRequestHeader('x-forwarded-for') ?? 'local'
}

/** Returns true when the caller is over the limit. Missing binding = no limit. */
async function overLimit(limiter: RateLimit | undefined): Promise<boolean> {
  if (!limiter) return false
  try {
    const { success } = await limiter.limit({ key: clientKey() })
    return !success
  } catch (err) {
    console.error('rate limiter error', err)
    return false
  }
}

function failureFrom(err: unknown, where: string): Failure {
  if (err instanceof GeminiError) {
    console.error(`${where}: Gemini ${err.status}`, err.body)
    if (err.status === 429 || err.status === 503) return { ok: false, code: 'busy' }
    if (err.status === 401 || err.status === 403 || err.body.includes('API_KEY_INVALID')) {
      return { ok: false, code: 'not-configured' }
    }
    return { ok: false, code: 'failed' }
  }
  console.error(`${where}:`, err)
  return { ok: false, code: 'failed' }
}

const ImageInput = z
  .string()
  .max(MAX_IMAGE_CHARS)
  .refine((s) => splitDataUrl(s) !== null, 'Expected a JPEG/PNG/WebP data URL')

/* ------------------------------------------------------------------ */

export const getAiStatus = createServerFn({ method: 'GET' }).handler(async () => {
  return { aiEnabled: apiKey() !== null }
})

/* ------------------------------------------------------------------ */

export type AnalyzeResult = { ok: true; analysis: SpaceAnalysis } | Failure

export const analyzeSpace = createServerFn({ method: 'POST' })
  .validator(z.object({ image: ImageInput }))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const key = apiKey()
    if (!key) return { ok: false, code: 'not-configured' }
    if (await overLimit(env.ANALYZE_LIMITER)) return { ok: false, code: 'rate-limited' }

    const img = splitDataUrl(data.image)!
    try {
      const resp = await generateContent({
        apiKey: key,
        model: env.GEMINI_TEXT_MODEL || DEFAULT_TEXT_MODEL,
        timeoutMs: 30_000,
        body: {
          contents: [
            {
              role: 'user',
              parts: [{ inlineData: img }, { text: ANALYSIS_PROMPT }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: ANALYSIS_RESPONSE_SCHEMA,
          },
        },
      })
      if (wasBlocked(resp)) return { ok: false, code: 'blocked' }
      const parsed = SpaceAnalysisSchema.safeParse(JSON.parse(extractText(resp) || 'null'))
      if (!parsed.success) {
        console.error('analyzeSpace: unexpected model output', extractText(resp).slice(0, 500))
        return { ok: false, code: 'failed' }
      }
      return { ok: true, analysis: parsed.data }
    } catch (err) {
      return failureFrom(err, 'analyzeSpace')
    }
  })

/* ------------------------------------------------------------------ */

const GenerateInput = z.object({
  image: ImageInput,
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
  spaceType: z.enum(['balcony', 'yard', 'rooftop']),
  light: z.enum(['full', 'part', 'shade']),
  plan: z.object({
    variant: z.number().int().min(0).max(10_000),
    items: z
      .array(
        z.object({
          plantId: z.string().refine((id) => id in PLANT_BY_ID, 'Unknown plant'),
          count: z.number().int().min(1).max(12),
        }),
      )
      .min(1)
      .max(4),
  }),
})

export type GenerateResult = { ok: true; image: string } | Failure

export const generateGarden = createServerFn({ method: 'POST' })
  .validator(GenerateInput)
  .handler(async ({ data }): Promise<GenerateResult> => {
    const key = apiKey()
    if (!key) return { ok: false, code: 'not-configured' }
    if (await overLimit(env.GENERATE_LIMITER)) return { ok: false, code: 'rate-limited' }

    const img = splitDataUrl(data.image)!
    const prompt = buildGardenPrompt({
      plan: data.plan,
      spaceType: data.spaceType,
      light: data.light,
    })

    try {
      const resp = await generateContent({
        apiKey: key,
        model: env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
        body: {
          contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: img }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: nearestAspectRatio(data.width, data.height) },
          },
        },
      })
      if (wasBlocked(resp)) return { ok: false, code: 'blocked' }
      const out = extractImage(resp)
      if (!out) {
        console.error('generateGarden: no image in response', extractText(resp).slice(0, 300))
        return { ok: false, code: 'no-image' }
      }
      return { ok: true, image: `data:${out.mimeType};base64,${out.data}` }
    } catch (err) {
      return failureFrom(err, 'generateGarden')
    }
  })

/* ------------------------------------------------------------------ */

const BANGKOK = { lat: 13.7563, lon: 100.5018 }

export type LocalConditions = {
  ok: true
  source: 'device' | 'network' | 'default'
  place: string | null
  pm25: number | null
  tempC: number | null
  uvIndex: number | null
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      // Cache at the Cloudflare edge for 15 minutes; Open-Meteo updates hourly.
      cf: { cacheTtl: 900, cacheEverything: true },
    } as RequestInit)
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Current PM2.5, temperature and UV for the user's area from Open-Meteo (no key
 * needed). Uses device coordinates when the user shares them, otherwise the
 * approximate location Cloudflare attaches to the request, otherwise Bangkok.
 */
export const getLocalConditions = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      lat: z.number().min(-90).max(90).optional(),
      lon: z.number().min(-180).max(180).optional(),
    }),
  )
  .handler(async ({ data }): Promise<LocalConditions> => {
    let source: LocalConditions['source'] = 'default'
    let place: string | null = null
    let { lat, lon } = BANGKOK

    if (data.lat !== undefined && data.lon !== undefined) {
      lat = data.lat
      lon = data.lon
      source = 'device'
    } else {
      const cf = (getRequest() as Request & { cf?: IncomingRequestCfProperties }).cf
      const cfLat = Number(cf?.latitude)
      const cfLon = Number(cf?.longitude)
      if (Number.isFinite(cfLat) && Number.isFinite(cfLon) && (cfLat !== 0 || cfLon !== 0)) {
        lat = cfLat
        lon = cfLon
        source = 'network'
        place = cf?.city ?? null
      } else {
        place = 'กรุงเทพฯ'
      }
    }

    // Round to ~1 km so the edge cache is shared between nearby users.
    const qLat = lat.toFixed(2)
    const qLon = lon.toFixed(2)
    const [aq, wx] = await Promise.all([
      fetchJson(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${qLat}&longitude=${qLon}&current=pm2_5&timezone=auto`,
      ),
      fetchJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${qLat}&longitude=${qLon}&current=temperature_2m,uv_index&timezone=auto`,
      ),
    ])

    return {
      ok: true,
      source,
      place,
      pm25: num(aq?.current?.pm2_5),
      tempC: num(wx?.current?.temperature_2m),
      uvIndex: num(wx?.current?.uv_index),
    }
  })
