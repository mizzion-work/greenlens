import { getPlant, LIGHT_LABEL, PLANTS, SIZE_LABEL, SPACE_LABEL } from './plants'
import { estimateSun, FACING_LABEL } from './sun'
import type { GardenPlan, SpaceInput } from './types'

export interface ChatMessage {
  id: string
  role: 'user' | 'model'
  text: string
  /** data:image/...;base64 URL of a photo the user attached. */
  image?: string
}

export interface ChatContext {
  input?: SpaceInput
  plan?: GardenPlan | null
}

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } }
export interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

const OLD_IMAGE_NOTE = '[ผู้ใช้แนบรูปที่แนบไว้ก่อนหน้า]'

/**
 * Turn the chat history into Gemini `contents`: last `maxTurns` messages,
 * starting with a user turn, and only the newest photo kept as an image
 * (older photos would be re-sent and billed on every turn).
 */
export function toGeminiContents(messages: ChatMessage[], maxTurns = 12): GeminiContent[] {
  let recent = messages.filter((m) => m.role === 'user' || m.text.trim()).slice(-maxTurns)
  while (recent.length && recent[0].role !== 'user') recent = recent.slice(1)

  const lastImageIdx = recent.map((m) => Boolean(m.image)).lastIndexOf(true)

  return recent.map((m, i) => {
    const parts: GeminiPart[] = []
    let text = m.text.trim()
    if (m.image && i !== lastImageIdx) text = `${OLD_IMAGE_NOTE} ${text}`.trim()
    if (text) parts.push({ text })
    if (m.image && i === lastImageIdx) {
      const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(m.image)
      if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } })
    }
    if (!parts.length) parts.push({ text: '(รูปภาพ)' })
    return { role: m.role, parts }
  })
}

export function buildChatSystemPrompt(ctx: ChatContext): string {
  const lines = [
    'You are "ผู้ช่วยต้นไม้ GreenLens", a friendly plant advisor inside the GreenLens AI app for city residents in Thailand.',
    'Goal: help people green their balcony, yard or rooftop, and make the most of plants they ALREADY OWN before buying new ones.',
    '',
    'Rules:',
    '- Answer in Thai. Be short and practical (about 120 words) unless the user asks for detail. Use "- " bullets for steps and **bold** sparingly. No tables, no headings.',
    '- When the user mentions or shows plants they already own: identify them if you can and say how sure you are; say whether they suit this space (light, facing, size); say where to place them and how to care for them; and say which of the recommended plants they can skip buying because an owned plant fills the same role.',
    '- Suggest buying only when nothing they own fits, and then prefer cheap, easy plants from the list below.',
    '- If a photo is unclear or you are unsure of the species, say so and ask for a closer photo of the leaves.',
    '- If the user has pets, always say whether a plant is toxic to cats and dogs.',
    '- Stay on plants, gardening, greening small spaces, heat and PM2.5. Politely decline anything unrelated.',
    '- Never invent measured numbers for cooling or dust capture; call them estimates.',
    '',
  ]

  const input = ctx.input
  if (input) {
    lines.push("User's space (from the app; the user may correct it):")
    lines.push(`- Space type: ${SPACE_LABEL[input.spaceType]}`)
    if (input.facing) {
      const sun = estimateSun(input.spaceType, input.facing)
      lines.push(
        `- Open side faces: ${FACING_LABEL[input.facing]} (about ${sun.hours} h of direct sun a day${sun.afternoonSun ? ', hot afternoon sun' : ''})`,
      )
    }
    lines.push(`- Light: ${LIGHT_LABEL[input.light]}`)
    lines.push(`- Size: ${SIZE_LABEL[input.size]}`)
    lines.push(`- Pets: ${input.hasPets ? 'yes' : 'no'}`)
    lines.push(`- Beginner: ${input.beginner ? 'yes' : 'no'}`)
  } else {
    lines.push("The user has not told the app about their space yet; ask briefly if it matters for the answer.")
  }

  const items = ctx.plan?.items ?? []
  if (items.length) {
    lines.push(
      `- Plants the app recommended: ${items.map((it) => `${getPlant(it.plantId).nameTh} × ${it.count}`).join(', ')}`,
    )
  }

  lines.push('', 'Plants the app knows (Thai name — English — light — pets):')
  for (const p of PLANTS) {
    const pets = p.petSafe === true ? 'pet-safe' : p.petSafe === false ? 'toxic to pets' : 'pet safety unknown'
    lines.push(`- ${p.nameTh} — ${p.nameEn} — ${p.light.map((l) => LIGHT_LABEL[l]).join('/')} — ${pets}`)
  }
  lines.push('Other plants the user owns are fine to discuss too; this list is only a reference.')

  return lines.join('\n')
}

/* ------------------------------------------------------------------ rendering */

export type Inline = { text: string; bold: boolean }
export type Block =
  | { type: 'p'; items: Inline[][] }
  | { type: 'ul'; items: Inline[][] }
  | { type: 'ol'; items: Inline[][] }

function inline(text: string): Inline[] {
  const out: Inline[] = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index), bold: false })
    out.push({ text: m[1], bold: true })
    last = m.index! + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false })
  return out
}

/** Minimal, safe markdown-ish parsing for model replies (no HTML). */
export function parseRichText(text: string): Block[] {
  const blocks: Block[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const bullet = /^[-*•]\s+(.*)$/.exec(line)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line)
    const type: Block['type'] = bullet ? 'ul' : numbered ? 'ol' : 'p'
    const content = inline((bullet?.[1] ?? numbered?.[1] ?? line).trim())
    const prev = blocks.at(-1)
    if (type !== 'p' && prev?.type === type) prev.items.push(content)
    else blocks.push({ type, items: [content] } as Block)
  }
  return blocks
}
