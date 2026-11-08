/** Aspect ratios accepted by Gemini image output. */
export const SUPPORTED_RATIOS = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
] as const

export type AspectRatio = (typeof SUPPORTED_RATIOS)[number]

/** Closest supported aspect ratio to width × height (compared in log space). */
export function nearestAspectRatio(width: number, height: number): AspectRatio {
  if (!(width > 0 && height > 0)) return '1:1'
  const target = Math.log(width / height)
  let best: AspectRatio = '1:1'
  let bestDiff = Infinity
  for (const r of SUPPORTED_RATIOS) {
    const [w, h] = r.split(':').map(Number)
    const diff = Math.abs(Math.log(w / h) - target)
    if (diff < bestDiff) {
      bestDiff = diff
      best = r
    }
  }
  return best
}
