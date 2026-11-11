import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  MessageCircleQuestion,
  Check,
  ClipboardCopy,
  Coins,
  Droplets,
  Heart,
  Leaf,
  Lightbulb,
  LocateFixed,
  PawPrint,
  Sprout,
  Store,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DustArt, GaugeArt, MapArt } from '../components/art'
import { PlantImage } from '../components/PlantImage'
import { pm25Level } from '../lib/air-quality'
import { estimateImpact } from '../lib/impact'
import { formatBaht, lazadaUrl, nurseriesMapUrl, shopeeUrl } from '../lib/links'
import { getPlant, LIGHT_LABEL, SPACE_LABEL, WATER_LABEL } from '../lib/plants'
import { getLocalConditions, type LocalConditions } from '../server/functions'
import { useChat } from '../state/chat'
import { useGarden } from '../state/garden'

export const Route = createFileRoute('/plan')({
  head: () => ({ meta: [{ title: 'ผลลัพธ์และต้นไม้ — GreenLens AI' }] }),
  component: PlanPage,
})

type Coords = { lat: number; lon: number }

function PlanPage() {
  const g = useGarden()
  const chat = useChat()
  const navigate = useNavigate()
  const [conditions, setConditions] = useState<LocalConditions | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [locating, setLocating] = useState(false)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [slide, setSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (g.hydrated && (!g.plan || !g.result)) navigate({ to: '/', replace: true })
  }, [g.hydrated, g.plan, g.result, navigate])

  useEffect(() => {
    getLocalConditions({ data: {} })
      .then(setConditions)
      .catch(() => setConditions(null))
  }, [])

  const impact = useMemo(() => (g.plan ? estimateImpact(g.plan, g.input.size) : null), [g.plan, g.input.size])

  if (!g.plan || !impact) return <p className="fine">กำลังโหลด…</p>

  const rows = g.plan.items.map((it) => ({ plant: getPlant(it.plantId), count: it.count }))
  const allNames = rows.map((r) => r.plant.nameTh).join(' ')

  function onCarouselScroll() {
    const el = carouselRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    if (!card) return
    setSlide(Math.round(el.scrollLeft / (card.offsetWidth + 12)))
  }

  function locate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setCoords(c)
        try {
          setConditions(await getLocalConditions({ data: c }))
        } finally {
          setLocating(false)
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    )
  }

  async function copyList() {
    const text = [
      `แผนจัดสวน GreenLens AI (${SPACE_LABEL[g.input.spaceType]} · ${LIGHT_LABEL[g.input.light]})`,
      ...rows.map((r) => `- ${r.plant.nameTh} (${r.plant.scientific}) × ${r.count} กระถาง`),
      `งบประมาณโดยประมาณ ${formatBaht(impact!.budgetTHB[0])}–${formatBaht(impact!.budgetTHB[1])}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
  }

  const level = conditions?.pm25 != null ? pm25Level(conditions.pm25) : null
  const placeLabel =
    conditions?.source === 'device' ? 'ตำแหน่งของคุณ' : (conditions?.place ?? 'พื้นที่ของคุณ (โดยประมาณ)')

  return (
    <main>
      <div className="section-head" style={{ marginTop: 6 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          ผลประเมินสิ่งแวดล้อม <Leaf size={22} color="var(--green-500)" />
        </h1>
        <span className="hand" style={{ transform: 'rotate(-5deg)', textAlign: 'right' }}>
          <Lightbulb size={14} style={{ marginTop: 2 }} />
          <span>
            ต้นไม้ของคุณ
            <br />
            ช่วยให้บ้านเย็นขึ้น!
          </span>
        </span>
      </div>

      <div className="stats">
        <div className="stat">
          <GaugeArt className="stat-art" value={impact.tempDrop[1] / 2} />
          <div className="stat-label">
            <i>
              <Thermometer size={15} />
            </i>
            ลดอุณหภูมิ
          </div>
          <b className="stat-value">
            -{impact.tempDrop[0]}°C
            <br />
            ถึง -{impact.tempDrop[1]}°C
          </b>
          <div className="stat-note">คาดการณ์ความร้อนที่ลดลงบริเวณที่ปลูก</div>
        </div>
        <div className="stat">
          <DustArt className="stat-art" />
          <div className="stat-label">
            <i>
              <Wind size={15} />
            </i>
            ดักฝุ่น PM2.5
          </div>
          <b className="stat-value">
            ~{impact.pmReduction[0]}–{impact.pmReduction[1]}%
          </b>
          <div className="stat-note">ฝุ่นที่ใบไม้ช่วยดักไว้เฉพาะจุด</div>
        </div>
      </div>

      <div className="summary-row">
        <div>
          <Leaf size={18} />
          <span>
            <b>{impact.leafAreaM2} ตร.ม.</b>
            พื้นที่ใบรวม {impact.potCount} กระถาง
          </span>
        </div>
        <div>
          <Coins size={18} />
          <span>
            <b>
              {formatBaht(impact.budgetTHB[0])}–{formatBaht(impact.budgetTHB[1])}
            </b>
            งบค่าต้นไม้โดยประมาณ
          </span>
        </div>
      </div>

      <div className="section-head">
        <h2>รายการต้นไม้แนะนำ</h2>
        <span className="hand" style={{ transform: 'rotate(-4deg)', textAlign: 'right' }}>
          <span>
            AI เลือกมาให้
            <br />
            เหมาะกับคุณ
          </span>
          <Heart size={13} fill="currentColor" style={{ marginTop: 16 }} />
        </span>
      </div>

      <div className="carousel" ref={carouselRef} onScroll={onCarouselScroll}>
        {rows.map(({ plant, count }, i) => (
          <article className="plant-card" key={plant.id} style={rows.length === 1 ? { width: '100%' } : undefined}>
            <div className="pc-top">
              <PlantImage id={plant.id} alt={plant.nameTh} />
              <div style={{ minWidth: 0 }}>
                <h3>
                  {i + 1}. {plant.nameTh}
                </h3>
                <div className="pc-count">
                  จำนวน <b>{count}</b> กระถาง
                </div>
                <div className="chips">
                  {plant.light.includes('full') && (
                    <span className="chip sun">
                      <Sun size={11} /> ทนแดด
                    </span>
                  )}
                  {!plant.light.includes('full') && plant.light.includes('shade') && (
                    <span className="chip">ชอบร่ม</span>
                  )}
                  <span className="chip">
                    <Droplets size={11} /> {WATER_LABEL[plant.water]}
                  </span>
                  {plant.care === 'easy' && <span className="chip green">ดูแลง่าย</span>}
                </div>
              </div>
            </div>
            <p className="pc-tip">{plant.tip}</p>
            <div className="pc-sci">
              {plant.nameEn} · {plant.scientific}
            </div>
            <div className="chips" style={{ marginTop: 8 }}>
              {plant.petSafe === true && (
                <span className="chip green">
                  <PawPrint size={11} /> ปลอดภัยกับสัตว์เลี้ยง
                </span>
              )}
              {plant.petSafe === false && (
                <span className="chip warn">
                  <PawPrint size={11} /> เป็นพิษต่อสัตว์เลี้ยง
                </span>
              )}
            </div>
            <Link to="/tips" search={{ plant: plant.id }} className="text-btn">
              <BookOpen size={14} /> วิธีดูแล{plant.nameTh}
            </Link>
            <div className="pc-foot">
              <span className="price">
                {formatBaht(plant.priceTHB[0])}–{formatBaht(plant.priceTHB[1])} / กระถาง
              </span>
              <a href={shopeeUrl(plant.nameTh)} target="_blank" rel="noopener noreferrer">
                Shopee
              </a>
              <a href={lazadaUrl(plant.nameTh)} target="_blank" rel="noopener noreferrer">
                Lazada
              </a>
            </div>
          </article>
        ))}
      </div>
      {rows.length > 1 && (
        <div className="carousel-dots" aria-hidden="true">
          {rows.map((r, i) => (
            <i key={r.plant.id} className={i === slide ? 'on' : undefined} />
          ))}
        </div>
      )}

      <button
        type="button"
        className="soft-action"
        onClick={() =>
          chat.openChat(
            `ฉันมีต้น… อยู่แล้ว ใช้แทนต้นไม้ในรายการ (${rows.map((r) => r.plant.nameTh).join(', ')}) ได้ไหม`,
          )
        }
      >
        <span className="sa-icon">
          <MessageCircleQuestion size={19} />
        </span>
        <span>
          <b>มีต้นไม้อยู่แล้ว?</b>
          <small>ถาม AI ว่าใช้แทนต้นไหนได้ ไม่ต้องซื้อใหม่ทุกต้น</small>
        </span>
        <ChevronRight size={20} className="sa-end" />
      </button>

      <div className="section-head">
        <h2>ค้นหาร้านค้า &amp; สั่งซื้อ</h2>
      </div>
      <a className="map-card" href={nurseriesMapUrl(coords)} target="_blank" rel="noopener noreferrer">
        <MapArt />
        <span className="map-pin">
          <i>
            <Store size={15} />
          </i>
          ร้านต้นไม้ใกล้คุณ
        </span>
      </a>

      <a
        className="cta"
        href={`https://shopee.co.th/search?keyword=${encodeURIComponent(`ต้นไม้ ${allNames}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="cta-icon">
          <Sprout size={22} />
        </span>
        <span className="cta-text">
          <b>ค้นหาร้านค้า &amp; สั่งซื้อออนไลน์</b>
          <small>ค้นหาต้นไม้ทั้งหมดในรายการ</small>
        </span>
        <ArrowRight size={22} />
      </a>

      <div className="mini-actions">
        <button type="button" onClick={copyList}>
          {copied === 'ok' ? <Check size={15} /> : <ClipboardCopy size={15} />}
          {copied === 'ok' ? 'คัดลอกรายการแล้ว' : copied === 'fail' ? 'คัดลอกไม่สำเร็จ' : 'คัดลอกรายการต้นไม้'}
        </button>
      </div>

      <div className="section-head">
        <h2>
          <Wind size={19} /> อากาศรอบบ้านคุณตอนนี้
        </h2>
      </div>
      <div className="card">
        <div className="fine" style={{ fontWeight: 600, color: 'var(--ink-2)', fontSize: 13 }}>
          {conditions ? placeLabel : 'กำลังหาตำแหน่ง…'}
        </div>
        {!conditions && <p className="fine">กำลังโหลดข้อมูลอากาศ…</p>}
        {conditions && conditions.pm25 == null && <p className="fine">ยังโหลดข้อมูลค่าฝุ่นไม่ได้ในขณะนี้</p>}
        {conditions && level && conditions.pm25 != null && (
          <div className="aq" style={{ marginTop: 10 }}>
            <div className={`aq-value tone-${level.tone}`}>
              <b>{Math.round(conditions.pm25)}</b>
              <small>µg/m³</small>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink)' }}>
                PM2.5 · {level.label}
              </div>
              <div className="fine">{level.advice}</div>
              <div className="fine" style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                {conditions.tempC != null && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Thermometer size={13} /> {Math.round(conditions.tempC)}°C
                  </span>
                )}
                {conditions.uvIndex != null && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Sun size={13} /> UV {Math.round(conditions.uvIndex)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        {conditions && conditions.source !== 'device' && (
          <button type="button" className="text-btn" onClick={locate} disabled={locating}>
            <LocateFixed size={15} /> {locating ? 'กำลังหาตำแหน่ง…' : 'ใช้ตำแหน่งที่แม่นยำของฉัน'}
          </button>
        )}
        <p className="fine" style={{ margin: '8px 0 0' }}>
          แบบจำลอง CAMS ผ่าน Open-Meteo · เกณฑ์สีตามกรมควบคุมมลพิษ
        </p>
      </div>

      <p className="fine" style={{ textAlign: 'center', marginTop: 14 }}>
        * ตัวเลขเป็นค่าประมาณจากพื้นที่ใบและชนิดพรรณไม้ ไม่ใช่ค่าตรวจวัดจริง ·{' '}
        <Link to="/about" hash="method">
          วิธีคำนวณ
        </Link>
      </p>
    </main>
  )
}
