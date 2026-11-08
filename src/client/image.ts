import { plantSvg } from '../lib/plant-art'
import { getPlant } from '../lib/plants'
import type { GardenPlan } from '../lib/types'

export interface PreparedImage {
  dataUrl: string
  width: number
  height: number
}

const MAX_DIM = 1280
const QUALITY = 0.86

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

async function decode(file: Blob): Promise<{ source: CanvasImageSource; w: number; h: number; done: () => void }> {
  // createImageBitmap honours EXIF orientation; fall back to <img> (e.g. HEIC on Safari).
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return { source: bmp, w: bmp.width, h: bmp.height, done: () => bmp.close() }
  } catch {
    const url = URL.createObjectURL(file)
    try {
      const img = await loadImage(url)
      return { source: img, w: img.naturalWidth, h: img.naturalHeight, done: () => URL.revokeObjectURL(url) }
    } catch (err) {
      URL.revokeObjectURL(url)
      throw err
    }
  }
}

function toCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  return [canvas, ctx]
}

/** Downscale and re-encode a user photo as JPEG (also strips EXIF/GPS metadata). */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  const { source, w, h, done } = await decode(file)
  try {
    const scale = Math.min(1, MAX_DIM / Math.max(w, h))
    const W = Math.max(1, Math.round(w * scale))
    const H = Math.max(1, Math.round(h * scale))
    const [canvas, ctx] = toCanvas(W, H)
    ctx.drawImage(source, 0, 0, W, H)
    return { dataUrl: canvas.toDataURL('image/jpeg', QUALITY), width: W, height: H }
  } finally {
    done()
  }
}

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000"><defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE6F5"/><stop offset="1" stop-color="#F2FBF7"/></linearGradient><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9CFCC"/><stop offset="1" stop-color="#B4BBB7"/></linearGradient></defs><rect width="800" height="1000" fill="url(#a)"/><g fill="#B9CFC6"><rect x="40" y="460" width="120" height="300"/><rect x="190" y="380" width="140" height="380"/><rect x="360" y="500" width="160" height="260"/><rect x="550" y="420" width="120" height="340"/></g><g fill="#A5C2B5"><rect x="60" y="480" width="16" height="16"/><rect x="100" y="480" width="16" height="16"/><rect x="60" y="520" width="16" height="16"/><rect x="215" y="410" width="18" height="18"/><rect x="255" y="410" width="18" height="18"/><rect x="295" y="410" width="18" height="18"/><rect x="215" y="450" width="18" height="18"/><rect x="575" y="450" width="16" height="16"/><rect x="615" y="450" width="16" height="16"/></g><rect y="720" width="800" height="28" fill="#8C9894"/><g fill="#9AA5A1"><rect x="40" y="748" width="12" height="80"/><rect x="180" y="748" width="12" height="80"/><rect x="320" y="748" width="12" height="80"/><rect x="460" y="748" width="12" height="80"/><rect x="600" y="748" width="12" height="80"/></g><rect y="824" width="800" height="176" fill="url(#f)"/><g stroke="#A9B2AE" stroke-width="3"><path d="M0 880H800M0 940H800M400 824L240 1000M400 824L560 1000M400 824V1000"/></g><rect x="640" width="160" height="824" fill="#C0C8C4"/><rect x="660" y="140" width="120" height="684" fill="#AEB8B3"/><rect x="668" y="150" width="104" height="664" fill="#D5E6EE" opacity=".6"/></svg>`

/** A drawn concrete balcony for trying the app without a photo. */
export async function sampleImage(): Promise<PreparedImage> {
  const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SAMPLE_SVG))
  const [canvas, ctx] = toCanvas(800, 1000)
  ctx.drawImage(img, 0, 0, 800, 1000)
  return { dataUrl: canvas.toDataURL('image/jpeg', QUALITY), width: 800, height: 1000 }
}

/** Deterministic pseudo-random in [0, 1). */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/**
 * On-device fallback when AI generation isn't available: draws the planned
 * pots along the bottom of the photo in two rows.
 */
export async function composePreview(photo: PreparedImage, plan: GardenPlan): Promise<string> {
  const { width: W, height: H } = photo
  const [canvas, ctx] = toCanvas(W, H)
  ctx.drawImage(await loadImage(photo.dataUrl), 0, 0, W, H)

  const pots = plan.items.flatMap((it) => Array.from({ length: it.count }, () => it.plantId))
  const n = pots.length
  const sizeScale = { S: 0.85, M: 1, L: 1.35 } as const
  const placed = pots
    .map((id, i) => ({ id, i, back: i % 2 === 0 }))
    .sort((a, b) => Number(b.back) - Number(a.back)) // back row first

  const arts = new Map<string, HTMLImageElement>()
  for (const id of new Set(pots)) {
    arts.set(id, await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(plantSvg(id, 600, 1000))))
  }

  for (const o of placed) {
    const jitter = (rand(o.i + plan.variant * 7) - 0.5) * 0.06
    const cx = W * (0.1 + ((o.i + 0.5) * 0.8) / n + jitter)
    const baseY = H * (o.back ? 0.86 : 0.97)
    const h = H * (o.back ? 0.26 : 0.33) * sizeScale[getPlant(o.id).size]
    const w = h * 0.6

    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.beginPath()
    ctx.ellipse(cx, baseY, w * 0.42, h * 0.025, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.drawImage(arts.get(o.id)!, cx - w / 2, baseY - h, w, h)
  }

  return canvas.toDataURL('image/jpeg', QUALITY)
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',')
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
