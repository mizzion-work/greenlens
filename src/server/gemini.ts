/**
 * Minimal Gemini REST client (generateContent). Kept dependency-free so it runs
 * unchanged inside a Cloudflare Worker.
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export class GeminiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`Gemini request failed (${status})`)
  }
}

interface InlineData {
  mimeType?: string
  mime_type?: string
  data?: string
}

interface Part {
  text?: string
  thought?: boolean
  inlineData?: InlineData
  inline_data?: InlineData
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Part[] }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string }
}

export async function generateContent(opts: {
  apiKey: string
  model: string
  body: unknown
  timeoutMs?: number
}): Promise<GeminiResponse> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(opts.model)}:generateContent`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': opts.apiKey,
    },
    body: JSON.stringify(opts.body),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 90_000),
  })
  if (!res.ok) {
    throw new GeminiError(res.status, (await res.text()).slice(0, 1000))
  }
  return (await res.json()) as GeminiResponse
}

function parts(resp: GeminiResponse): Part[] {
  return resp.candidates?.[0]?.content?.parts ?? []
}

/** First image returned by the model, ignoring "thought" previews. */
export function extractImage(resp: GeminiResponse): { mimeType: string; data: string } | null {
  for (const p of parts(resp)) {
    if (p.thought) continue
    const inline = p.inlineData ?? p.inline_data
    const mimeType = inline?.mimeType ?? inline?.mime_type
    if (inline?.data && mimeType?.startsWith('image/')) {
      return { mimeType, data: inline.data }
    }
  }
  return null
}

export function extractText(resp: GeminiResponse): string {
  return parts(resp)
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
    .trim()
}

const BLOCKED_REASONS = new Set([
  'SAFETY',
  'PROHIBITED_CONTENT',
  'BLOCKLIST',
  'SPII',
  'IMAGE_SAFETY',
  'IMAGE_PROHIBITED_CONTENT',
])

/** True when the model refused for safety/policy reasons rather than failing. */
export function wasBlocked(resp: GeminiResponse): boolean {
  if (resp.promptFeedback?.blockReason) return true
  const reason = resp.candidates?.[0]?.finishReason
  return !!reason && BLOCKED_REASONS.has(reason)
}

export type GeminiFailure = 'quota' | 'busy' | 'not-configured' | 'failed'

/**
 * Map a Gemini HTTP error to what the user should be told.
 * 402 = prepaid credits depleted; a 429 that mentions quota = plan quota used up.
 */
export function classifyGeminiError(status: number, body: string): GeminiFailure {
  if (status === 402) return 'quota'
  if (status === 429) return /quota/i.test(body) ? 'quota' : 'busy'
  if (status === 503) return 'busy'
  if (status === 401 || status === 403 || body.includes('API_KEY_INVALID')) return 'not-configured'
  return 'failed'
}

/** Strip a `data:image/...;base64,` prefix if present. */
export function splitDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  return m ? { mimeType: m[1], data: m[2] } : null
}
