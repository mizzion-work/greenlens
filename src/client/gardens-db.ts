/**
 * "สวนของฉัน": generated gardens saved on this device in IndexedDB.
 * Metadata and the small thumbnail live in `meta` so the list loads fast;
 * the full photo and result live in `images`.
 */
import type { PreparedImage } from './image'
import type { GardenPlan, SpaceInput } from '../lib/types'
import type { FailureCode } from '../server/functions'

export interface SavedResult {
  image: string
  source: 'ai' | 'preview'
  fallbackReason?: FailureCode
}

export interface SavedGarden {
  id: string
  createdAt: number
  updatedAt: number
  input: SpaceInput
  plan: GardenPlan
  photo: PreparedImage
  result: SavedResult
  thumb: string
}

export type GardenSummary = Omit<SavedGarden, 'photo' | 'result'> & { source: SavedResult['source'] }

export const MAX_GARDENS = 30

const DB_NAME = 'greenlens'
const DB_VERSION = 1

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

let dbPromise: Promise<IDBDatabase> | null = null

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, DB_VERSION)
      open.onupgradeneeded = () => {
        const d = open.result
        const meta = d.createObjectStore('meta', { keyPath: 'id' })
        meta.createIndex('updatedAt', 'updatedAt')
        d.createObjectStore('images', { keyPath: 'id' })
      }
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => {
        dbPromise = null
        reject(open.error)
      }
    })
  }
  return dbPromise
}

export async function saveGarden(g: SavedGarden): Promise<void> {
  const d = await db()
  const tx = d.transaction(['meta', 'images'], 'readwrite')
  const { photo, result, ...rest } = g
  const summary: GardenSummary = { ...rest, source: result.source }
  tx.objectStore('meta').put(summary)
  tx.objectStore('images').put({ id: g.id, photo, result })
  await done(tx)
  await prune()
}

/** Newest first. Does not load the full-size images. */
export async function listGardens(): Promise<GardenSummary[]> {
  const d = await db()
  const all = await req(d.transaction('meta').objectStore('meta').getAll() as IDBRequest<GardenSummary[]>)
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getGarden(id: string): Promise<SavedGarden | null> {
  const d = await db()
  const tx = d.transaction(['meta', 'images'])
  const [meta, images] = await Promise.all([
    req(tx.objectStore('meta').get(id) as IDBRequest<GardenSummary | undefined>),
    req(tx.objectStore('images').get(id) as IDBRequest<{ photo: PreparedImage; result: SavedResult } | undefined>),
  ])
  if (!meta || !images) return null
  const { source: _source, ...rest } = meta
  return { ...rest, photo: images.photo, result: images.result }
}

export async function deleteGarden(id: string): Promise<void> {
  const d = await db()
  const tx = d.transaction(['meta', 'images'], 'readwrite')
  tx.objectStore('meta').delete(id)
  tx.objectStore('images').delete(id)
  await done(tx)
}

async function prune(): Promise<void> {
  const list = await listGardens()
  for (const g of list.slice(MAX_GARDENS)) await deleteGarden(g.id)
}
