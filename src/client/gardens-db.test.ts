import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { deleteGarden, getGarden, listGardens, MAX_GARDENS, saveGarden, type SavedGarden } from './gardens-db'

function garden(id: string, updatedAt: number): SavedGarden {
  return {
    id,
    createdAt: updatedAt,
    updatedAt,
    input: { spaceType: 'balcony', light: 'part', size: 'S', hasPets: false, beginner: true, facing: 'W' },
    plan: { items: [{ plantId: 'snake', count: 2 }], variant: 0 },
    photo: { dataUrl: 'data:image/jpeg;base64,AAA', width: 800, height: 1000 },
    result: { image: 'data:image/jpeg;base64,BBB', source: 'preview', fallbackReason: 'quota' },
    thumb: 'data:image/jpeg;base64,THUMB',
  }
}

beforeEach(async () => {
  for (const g of await listGardens()) await deleteGarden(g.id)
})

describe('gardens-db', () => {
  it('saves and reads back a full garden', async () => {
    await saveGarden(garden('a', 1))
    const got = await getGarden('a')
    expect(got?.photo.dataUrl).toBe('data:image/jpeg;base64,AAA')
    expect(got?.result.image).toBe('data:image/jpeg;base64,BBB')
    expect(got?.input.facing).toBe('W')
  })

  it('lists newest first without the big images', async () => {
    await saveGarden(garden('old', 1))
    await saveGarden(garden('new', 2))
    const list = await listGardens()
    expect(list.map((g) => g.id)).toEqual(['new', 'old'])
    expect(list[0]).not.toHaveProperty('photo')
    expect(list[0]).not.toHaveProperty('result')
    expect(list[0].thumb).toBe('data:image/jpeg;base64,THUMB')
    expect(list[0].source).toBe('preview')
  })

  it('updates in place when saving the same id again', async () => {
    await saveGarden(garden('a', 1))
    await saveGarden({ ...garden('a', 5), plan: { items: [{ plantId: 'aloe', count: 3 }], variant: 1 } })
    const list = await listGardens()
    expect(list).toHaveLength(1)
    expect(list[0].plan.items[0].plantId).toBe('aloe')
  })

  it('deletes', async () => {
    await saveGarden(garden('a', 1))
    await deleteGarden('a')
    expect(await getGarden('a')).toBeNull()
    expect(await listGardens()).toHaveLength(0)
  })

  it('keeps only the newest MAX_GARDENS', async () => {
    for (let i = 0; i < MAX_GARDENS + 3; i++) await saveGarden(garden(`g${i}`, i))
    const list = await listGardens()
    expect(list).toHaveLength(MAX_GARDENS)
    expect(list.at(-1)?.id).toBe('g3')
    expect(await getGarden('g0')).toBeNull()
  })
})
