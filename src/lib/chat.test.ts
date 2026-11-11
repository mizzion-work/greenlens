import { describe, expect, it } from 'vitest'
import { buildChatSystemPrompt, parseRichText, toGeminiContents, type ChatMessage } from './chat'

const img = 'data:image/jpeg;base64,QUJD'

function msg(role: ChatMessage['role'], text: string, image?: string): ChatMessage {
  return { id: Math.random().toString(36), role, text, image }
}

describe('toGeminiContents', () => {
  it('maps roles and puts the image after the text', () => {
    const out = toGeminiContents([msg('user', 'นี่ต้นอะไร', img)])
    expect(out).toEqual([
      { role: 'user', parts: [{ text: 'นี่ต้นอะไร' }, { inlineData: { mimeType: 'image/jpeg', data: 'QUJD' } }] },
    ])
  })

  it('keeps only the most recent image and marks older ones in text', () => {
    const out = toGeminiContents([
      msg('user', 'รูปแรก', img),
      msg('model', 'ตอบ'),
      msg('user', 'รูปสอง', 'data:image/jpeg;base64,WFla'),
    ])
    const images = out.flatMap((c) => c.parts).filter((p) => 'inlineData' in p)
    expect(images).toHaveLength(1)
    expect(JSON.stringify(out[2])).toContain('WFla')
    expect(JSON.stringify(out[0])).toContain('รูปที่แนบไว้ก่อนหน้า')
  })

  it('trims long histories and always starts with a user turn', () => {
    const many: ChatMessage[] = []
    for (let i = 0; i < 30; i++) many.push(msg(i % 2 ? 'model' : 'user', `m${i}`))
    const out = toGeminiContents(many, 12)
    expect(out.length).toBeLessThanOrEqual(12)
    expect(out[0].role).toBe('user')
    expect(JSON.stringify(out.at(-1))).toContain('m29')
  })

  it('drops empty model turns', () => {
    const out = toGeminiContents([msg('user', 'a'), msg('model', '  '), msg('user', 'b')])
    expect(out.map((c) => c.role)).toEqual(['user', 'user'])
  })
})

describe('buildChatSystemPrompt', () => {
  it('includes the space, the recommended plants and the reuse-first rule', () => {
    const p = buildChatSystemPrompt({
      input: { spaceType: 'balcony', light: 'part', size: 'S', hasPets: true, beginner: true, facing: 'W' },
      plan: { items: [{ plantId: 'rubber', count: 1 }], variant: 0 },
    })
    expect(p).toContain('ระเบียงคอนโด')
    expect(p).toContain('ทิศตะวันตก')
    expect(p).toContain('ยางอินเดีย × 1')
    expect(p).toMatch(/already own/i)
    expect(p).toMatch(/Pets: yes/)
    // the whole plant list is offered as reference
    expect(p).toContain('มอนสเตอร่า')
  })

  it('works with no context', () => {
    const p = buildChatSystemPrompt({})
    expect(p).toContain('not told the app')
  })
})

describe('parseRichText', () => {
  it('groups bullets and numbered steps into lists and keeps paragraphs', () => {
    const blocks = parseRichText('สรุปสั้น ๆ\n- ข้อหนึ่ง\n- ข้อ **สอง**\n\n1. ขั้นแรก\n2. ขั้นสอง')
    expect(blocks.map((b) => b.type)).toEqual(['p', 'ul', 'ol'])
    expect(blocks[1].items).toHaveLength(2)
    expect(blocks[1].items[1]).toEqual([
      { text: 'ข้อ ', bold: false },
      { text: 'สอง', bold: true },
    ])
  })

  it('treats * and • as bullets', () => {
    expect(parseRichText('* a\n• b')[0]).toMatchObject({ type: 'ul' })
  })
})
