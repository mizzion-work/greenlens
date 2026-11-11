import { ChevronsLeftRight } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Before/After comparison. On first show (and whenever `after` changes) the
 * divider sweeps from the right edge to the middle, revealing the new garden.
 */
export function BeforeAfter({
  before,
  after,
  width,
  height,
}: {
  before: string
  after: string
  width: number
  height: number
}) {
  const [pos, setPos] = useState(50)
  const [revealing, setRevealing] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setRevealing(true)
    setPos(100)
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setPos(50)))
    const t = setTimeout(() => setRevealing(false), 1200)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [after])

  return (
    <div
      className={`ba${revealing ? ' revealing' : ''}`}
      style={{
        aspectRatio: `${width} / ${height}`,
        // Fit the viewport height on wide screens; full width on phones.
        width: `min(100%, calc((100dvh - 170px) * ${(width / height).toFixed(4)}))`,
        marginInline: 'auto',
      }}
    >
      <img src={before} alt="พื้นที่ของคุณก่อนจัดสวน" />
      <div className="after-layer" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <img src={after} alt="พื้นที่ของคุณหลังจัดสวน" />
      </div>
      <span className="tag tag-before">Before</span>
      <span className="tag tag-after">After</span>
      <div className="handle" style={{ left: `${pos}%` }}>
        <span>
          <ChevronsLeftRight size={20} />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => {
          setRevealing(false)
          setPos(Number(e.target.value))
        }}
        aria-label="เลื่อนเพื่อเปรียบเทียบก่อนและหลัง"
      />
    </div>
  )
}
