import { useId, type CSSProperties } from 'react'

/* ------------------------------------------------------------------ app icon */

/** Rounded-square app icon: a camera lens with an AI node network and a leaf. */
export function AppIcon({ size = 42 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#58b06d" />
          <stop offset="1" stopColor="#1d5a35" />
        </linearGradient>
        <radialGradient id={`${id}glass`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#2f6248" />
          <stop offset="0.55" stopColor="#10301f" />
          <stop offset="1" stopColor="#06150d" />
        </radialGradient>
        <linearGradient id={`${id}ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c4d6cb" />
        </linearGradient>
        <linearGradient id={`${id}leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6fff8" />
          <stop offset="1" stopColor="#b9e3c4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}bg)`} />
      <path d="M16 1h32a15 15 0 0 1 15 15v6C46 30 18 30 1 22v-6A15 15 0 0 1 16 1z" fill="#fff" opacity="0.09" />
      <path d="M41 5c10.5-.4 18.3 6.8 18.6 16.2C48.6 24.6 39.7 17.3 41 5z" fill={`url(#${id}leaf)`} />
      <path d="M42.5 7.5C48 11 53 15.5 57.5 20" stroke="#8cc99c" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <circle cx="28.5" cy="35.5" r="20.5" fill={`url(#${id}ring)`} />
      <circle cx="28.5" cy="35.5" r="20.5" fill="none" stroke="#9bb8a6" strokeWidth="0.6" />
      <circle cx="28.5" cy="35.5" r="15.6" fill={`url(#${id}glass)`} />
      <g stroke="#8ff0c0" strokeWidth="1.05" strokeLinecap="round" opacity="0.95">
        <path d="M28.5 27.5L21.5 33.5L28.5 35.5L35.5 33.5L28.5 27.5M21.5 33.5L24.5 42M35.5 33.5L32.5 42M28.5 35.5L24.5 42M28.5 35.5L32.5 42M24.5 42H32.5" />
      </g>
      <g fill="#c8ffe3">
        <circle cx="28.5" cy="27.5" r="1.7" />
        <circle cx="21.5" cy="33.5" r="1.6" />
        <circle cx="35.5" cy="33.5" r="1.6" />
        <circle cx="28.5" cy="35.5" r="2.1" />
        <circle cx="24.5" cy="42" r="1.5" />
        <circle cx="32.5" cy="42" r="1.5" />
      </g>
      <path d="M17.5 30a12.5 12.5 0 0 1 9-8.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.35" />
      <circle cx="39.5" cy="45" r="1.5" fill="#fff" opacity="0.6" />
    </svg>
  )
}

/* ------------------------------------------------------------------ leaves */

const LEAF_PATHS = {
  long: {
    body: 'M50 4C86 30 92 92 52 156C12 96 14 32 50 4Z',
    rib: 'M50 12C52 60 53 108 52 150',
    veins:
      'M51 38C62 42 71 50 77 60M51 38C40 42 31 50 26 60M52 66C64 70 74 80 79 92M52 66C40 70 30 80 25 92M52 96C62 100 70 108 73 118M52 96C42 100 34 108 31 118',
  },
  broad: {
    body: 'M50 6C94 22 98 102 50 152C2 102 6 22 50 6Z',
    rib: 'M50 14C51 60 51 106 50 146',
    veins:
      'M50 44C66 46 80 56 88 70M50 44C34 46 20 56 12 70M50 76C68 80 82 92 86 104M50 76C32 80 18 92 14 104M50 106C62 110 70 118 72 128M50 106C38 110 30 118 28 128',
  },
} as const

function Leaf({
  shape = 'long',
  from = '#2f7d46',
  to = '#93d6a0',
}: {
  shape?: keyof typeof LEAF_PATHS
  from?: string
  to?: string
}) {
  const id = useId()
  const p = LEAF_PATHS[shape]
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path d={p.body} fill={`url(#${id})`} />
      <path d={p.rib} stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={p.veins} stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </>
  )
}

/** Two or three leaves fanned out from one stem point. */
function LeafCluster({ style, tone = 'mid' }: { style: CSSProperties; tone?: 'mid' | 'light' | 'deep' }) {
  const palette = {
    light: [
      ['#5fae73', '#c4ebcb'],
      ['#79c088', '#d8f2dc'],
    ],
    mid: [
      ['#2f7d46', '#93d6a0'],
      ['#3f9460', '#a9e0b3'],
    ],
    deep: [
      ['#1f5f37', '#6cbf80'],
      ['#2f7d46', '#8fd09c'],
    ],
  }[tone]
  return (
    <svg viewBox="0 0 240 240" style={style} aria-hidden="true">
      <g transform="translate(120 230) rotate(-38) translate(-50 -160)">
        <Leaf shape="long" from={palette[0][0]} to={palette[0][1]} />
      </g>
      <g transform="translate(120 230) rotate(8) translate(-50 -160) scale(0.95)">
        <Leaf shape="broad" from={palette[1][0]} to={palette[1][1]} />
      </g>
      <g transform="translate(120 230) rotate(52) translate(-50 -160) scale(0.8)">
        <Leaf shape="long" from={palette[0][0]} to={palette[0][1]} />
      </g>
    </svg>
  )
}

/** Soft watercolour leaves tucked into the screen corners, behind content. */
export function Decor() {
  return (
    <div className="decor" aria-hidden="true">
      <LeafCluster
        tone="light"
        style={{ left: -78, top: -64, width: 190, height: 190, transform: 'rotate(150deg)', opacity: 0.6 }}
      />
      <LeafCluster
        tone="mid"
        style={{ right: -92, top: '38%', width: 170, height: 170, transform: 'rotate(-110deg)', opacity: 0.38 }}
      />
      <LeafCluster
        tone="mid"
        style={{ left: -70, bottom: 54, width: 190, height: 190, transform: 'rotate(28deg)', opacity: 0.55 }}
      />
      <LeafCluster
        tone="deep"
        style={{ right: -66, bottom: 64, width: 180, height: 180, transform: 'rotate(-32deg)', opacity: 0.5 }}
      />
    </div>
  )
}

/** Small decorative leaf used next to headings and inside cards. */
export function LeafMark({ size = 22, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 100 160" style={style} aria-hidden="true">
      <Leaf shape="long" from="#3f9460" to="#9edaa9" />
    </svg>
  )
}

/* ------------------------------------------------------------------ hero city */

/** Pale city towers softened with greenery: the "city lungs" idea from the poster. */
export function HeroArt({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg className={className} viewBox="0 0 170 160" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}halo`} cx="0.6" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#e2f3e4" />
          <stop offset="1" stopColor="#e2f3e4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d6e9ec" />
          <stop offset="1" stopColor="#bcd6d4" />
        </linearGradient>
        <linearGradient id={`${id}fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.62" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}mask`}>
          <rect width="170" height="160" fill={`url(#${id}fade)`} />
        </mask>
      </defs>
      <circle cx="104" cy="82" r="72" fill={`url(#${id}halo)`} />
      <g mask={`url(#${id}mask)`}>
        {/* back towers */}
        <rect x="64" y="40" width="28" height="120" rx="2" fill="#d9e7df" />
        <rect x="131" y="56" width="26" height="104" rx="2" fill="#dde9e2" />
        {/* glass tower */}
        <path d="M96 22L124 14V160H96Z" fill={`url(#${id}glass)`} />
        <path d="M101 24V160M108 22V160M115 20V160" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1" />
        <path d="M96 22L124 14V20L96 28Z" fill="#a9c9c4" />
        {/* front block */}
        <rect x="78" y="78" width="24" height="82" rx="2" fill="#c6dccd" />
        <g fill="#eef6f1">
          {[84, 94, 104, 114, 124, 134].map((y) => (
            <g key={y}>
              <rect x="82" y={y} width="6" height="5" rx="1" />
              <rect x="92" y={y} width="6" height="5" rx="1" />
            </g>
          ))}
          {[50, 62, 74, 86, 98].map((y) => (
            <g key={y}>
              <rect x="68" y={y} width="7" height="6" rx="1" />
              <rect x="80" y={y} width="7" height="6" rx="1" opacity={y > 74 ? 0 : 1} />
            </g>
          ))}
          {[66, 78, 90, 102].map((y) => (
            <g key={y}>
              <rect x="135" y={y} width="7" height="6" rx="1" />
              <rect x="146" y={y} width="7" height="6" rx="1" />
            </g>
          ))}
        </g>
        {/* roof gardens: small leaf tufts growing from each roofline */}
        {(
          [
            [66, 41, -32, 0.13],
            [74, 40, 6, 0.16],
            [84, 41, 38, 0.12],
            [134, 57, -28, 0.13],
            [144, 55, 12, 0.16],
            [153, 57, 42, 0.11],
            [82, 79, -24, 0.13],
            [93, 78, 22, 0.15],
          ] as const
        ).map(([x, y, r, sc], i) => (
          <g key={`t${i}`} transform={`translate(${x} ${y}) rotate(${r}) scale(${sc}) translate(-50 -160)`}>
            <Leaf shape={i % 2 ? 'broad' : 'long'} from="#3f9460" to="#9edaa9" />
          </g>
        ))}
        {/* trailing vines down the facades */}
        {(
          [
            [79, 50],
            [77, 60],
            [80, 70],
            [148, 66],
            [146, 77],
            [149, 88],
            [93, 88],
            [92, 99],
          ] as const
        ).map(([x, y], i) => (
          <g key={`v${i}`} transform={`translate(${x} ${y}) rotate(${i % 2 ? 150 : 210}) scale(0.075) translate(-50 -160)`}>
            <Leaf shape="broad" from="#4fa866" to="#a9e0b3" />
          </g>
        ))}
        {/* street-level greenery */}
        <g transform="translate(56 112) scale(0.36) rotate(-24 50 160)">
          <Leaf shape="broad" from="#2f7d46" to="#8fd09c" />
        </g>
        <g transform="translate(118 108) scale(0.4) rotate(18 50 160)">
          <Leaf shape="long" from="#3f9460" to="#a9e0b3" />
        </g>
        <g transform="translate(140 118) scale(0.32) rotate(40 50 160)">
          <Leaf shape="broad" from="#2f7d46" to="#93d6a0" />
        </g>
        <ellipse cx="108" cy="150" rx="58" ry="14" fill="#9fd4a8" opacity="0.55" />
        <ellipse cx="88" cy="154" rx="34" ry="10" fill="#5fae73" opacity="0.6" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ map */

export function MapArt() {
  return (
    <svg viewBox="0 0 300 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="300" height="130" fill="#eef3ea" />
      <g fill="#e3ebe0">
        <rect x="92" y="8" width="44" height="30" rx="4" />
        <rect x="150" y="10" width="54" height="26" rx="4" />
        <rect x="214" y="52" width="40" height="30" rx="4" />
        <rect x="100" y="86" width="40" height="32" rx="4" />
        <rect x="236" y="96" width="50" height="26" rx="4" />
      </g>
      <path d="M0 0H74C62 26 80 54 64 84C54 104 60 130 60 130H0Z" fill="#bcdcea" />
      <path d="M0 0H62C52 24 68 52 54 80C46 98 50 130 50 130H0Z" fill="#a9d1e3" opacity="0.6" />
      <g fill="#cfe7c8">
        <path d="M150 44C170 36 196 42 200 58C204 74 182 84 164 80C146 76 136 52 150 44Z" />
        <circle cx="266" cy="30" r="22" />
        <rect x="216" y="10" width="34" height="30" rx="10" />
        <path d="M160 96C176 92 196 100 194 116C192 128 168 130 156 122C146 114 148 100 160 96Z" />
      </g>
      <g stroke="#dde5da" strokeWidth="11" strokeLinecap="round" fill="none">
        <path d="M70 46L300 40" />
        <path d="M140 0L148 130" />
        <path d="M210 0C214 46 200 84 232 130" />
        <path d="M62 104L300 86" />
      </g>
      <g stroke="#ffffff" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M70 46L300 40" />
        <path d="M140 0L148 130" />
        <path d="M210 0C214 46 200 84 232 130" />
        <path d="M62 104L300 86" />
      </g>
      <g fill="#3f9460">
        <circle cx="112" cy="70" r="4" />
        <circle cx="244" cy="70" r="4" />
        <circle cx="178" cy="22" r="3.5" />
        <circle cx="270" cy="112" r="3.5" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ stat art */

/** Half-ring gauge, filled by `value` in [0, 1]. Decorative. */
export function GaugeArt({ value, className }: { value: number; className?: string }) {
  const id = useId()
  const v = Math.max(0.08, Math.min(1, value))
  const angle = Math.PI * (1 - v)
  const nx = 40 + 22 * Math.cos(angle)
  const ny = 46 - 22 * Math.sin(angle)
  return (
    <svg className={className} viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bfe6c8" />
          <stop offset="1" stopColor="#3f9460" />
        </linearGradient>
      </defs>
      <path d="M12 46A28 28 0 0 1 68 46" stroke="#e7f2e8" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path
        d="M12 46A28 28 0 0 1 68 46"
        stroke={`url(#${id})`}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${v * 100} 100`}
      />
      <line x1="40" y1="46" x2={nx} y2={ny} stroke="#2f7d4f" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="40" cy="46" r="3.5" fill="#2f7d4f" />
    </svg>
  )
}

/** Leaf catching dust particles. Decorative. */
export function DustArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="42" cy="38" r="28" fill="#eaf5eb" />
      <g transform="translate(30 14) scale(0.3)">
        <Leaf shape="broad" from="#3f9460" to="#a9e0b3" />
      </g>
      <g fill="#a3b3a8">
        <circle cx="18" cy="24" r="2.2" />
        <circle cx="24" cy="50" r="1.8" />
        <circle cx="64" cy="20" r="1.6" />
        <circle cx="66" cy="56" r="2.2" />
        <circle cx="14" cy="40" r="1.4" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ handwritten note */

export function HandArrow({ style, flip, className }: { style?: CSSProperties; flip?: boolean; className?: string }) {
  return (
    <svg
      className={className}
      width="30"
      height="34"
      viewBox="0 0 30 34"
      style={{ ...style, transform: `${style?.transform ?? ''} ${flip ? 'scaleX(-1)' : ''}` }}
      aria-hidden="true"
    >
      <path d="M4 3C18 6 26 16 22 30" stroke="#2b7a4b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M16 25L22 31L26 24" stroke="#2b7a4b" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
