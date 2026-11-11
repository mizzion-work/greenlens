import { createFileRoute } from '@tanstack/react-router'
import {
  CalendarDays,
  ChevronDown,
  Droplets,
  Eye,
  FlaskConical,
  PawPrint,
  Sprout,
  Sun,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import { useEffect } from 'react'
import { PlantImage } from '../components/PlantImage'
import { GENERAL_TIPS, PLANT_GUIDE } from '../lib/care'
import { lazadaUrl, shopeeUrl } from '../lib/links'
import { getPlant, LIGHT_LABEL, PLANTS } from '../lib/plants'
import type { Plant } from '../lib/types'
import { useGarden } from '../state/garden'

export const Route = createFileRoute('/tips')({
  validateSearch: (s: Record<string, unknown>): { plant?: string } =>
    typeof s.plant === 'string' ? { plant: s.plant } : {},
  head: () => ({ meta: [{ title: 'เคล็ดลับดูแลต้นไม้ — GreenLens AI' }] }),
  component: TipsPage,
})

const TIP_ICON: Record<string, LucideIcon> = {
  start: Sprout,
  water: Droplets,
  seasons: CalendarDays,
  dust: Wind,
  feed: FlaskConical,
  pets: PawPrint,
}

function PlantGuide({ plant, open }: { plant: Plant; open?: boolean }) {
  const guide = PLANT_GUIDE[plant.id]
  const rows: [LucideIcon, string, string][] = [
    [Droplets, 'รดน้ำ', guide.water],
    [Sun, 'แสง', guide.light],
    [FlaskConical, 'ปุ๋ย', guide.feed],
    [Eye, 'สังเกต', guide.watch],
  ]
  return (
    <details className="guide" id={`plant-${plant.id}`} open={open}>
      <summary>
        <PlantImage id={plant.id} alt={plant.nameTh} />
        <span className="guide-title">
          <b>{plant.nameTh}</b>
          <span className="fine">
            {plant.light.map((l) => LIGHT_LABEL[l]).join(' · ')}
            {plant.care === 'easy' ? ' · ดูแลง่าย' : ''}
          </span>
        </span>
        <ChevronDown size={18} className="guide-chevron" />
      </summary>
      <dl className="guide-rows">
        {rows.map(([Icon, label, text]) => (
          <div key={label}>
            <dt>
              <Icon size={15} /> {label}
            </dt>
            <dd>{text}</dd>
          </div>
        ))}
        <div>
          <dt>
            <PawPrint size={15} /> สัตว์เลี้ยง
          </dt>
          <dd>
            {plant.petSafe === true
              ? 'ปลอดภัยกับแมวและสุนัข'
              : plant.petSafe === false
                ? 'เป็นพิษต่อแมวและสุนัข วางให้พ้นมือ'
                : 'ยังไม่มีข้อมูลชัดเจน ควรวางให้พ้นจากสัตว์เลี้ยง'}
          </dd>
        </div>
      </dl>
      <div className="guide-foot">
        <span className="fine">
          {plant.nameEn} · <i>{plant.scientific}</i>
        </span>
        <a href={shopeeUrl(plant.nameTh)} target="_blank" rel="noopener noreferrer">
          Shopee
        </a>
        <a href={lazadaUrl(plant.nameTh)} target="_blank" rel="noopener noreferrer">
          Lazada
        </a>
      </div>
    </details>
  )
}

function TipsPage() {
  const g = useGarden()
  const { plant: focus } = Route.useSearch()
  const mine = g.plan?.items.map((it) => getPlant(it.plantId)) ?? []
  const mineIds = new Set(mine.map((p) => p.id))

  useEffect(() => {
    if (!focus) return
    document.getElementById(`plant-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focus])

  return (
    <main>
      <div className="section-head" style={{ marginTop: 6 }}>
        <h1 className="page-title">เคล็ดลับดูแลต้นไม้</h1>
        <span className="hand" style={{ transform: 'rotate(-5deg)', textAlign: 'right' }}>
          ดูแลง่าย
          <br />
          กว่าที่คิด!
        </span>
      </div>

      {mine.length > 0 && (
        <>
          <div className="section-head">
            <h2>
              <Sprout size={19} /> ต้นไม้ในสวนของคุณ
            </h2>
          </div>
          <div className="guide-list">
            {mine.map((p) => (
              <PlantGuide key={p.id} plant={p} open={!focus || focus === p.id} />
            ))}
          </div>
        </>
      )}

      <div className="section-head">
        <h2>
          <Eye size={19} /> เรื่องที่ควรรู้
        </h2>
      </div>
      <div className="guide-list">
        {GENERAL_TIPS.map((t) => {
          const Icon = TIP_ICON[t.id] ?? Sprout
          return (
            <details key={t.id} className="tip">
              <summary>
                <i>
                  <Icon size={17} />
                </i>
                <b>{t.title}</b>
                <ChevronDown size={18} className="guide-chevron" />
              </summary>
              <ul>
                {t.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
          )
        })}
      </div>

      <div className="section-head">
        <h2>
          <Sprout size={19} /> คู่มือต้นไม้ทั้ง {PLANTS.length} ชนิด
        </h2>
      </div>
      <div className="guide-list">
        {PLANTS.filter((p) => !mineIds.has(p.id)).map((p) => (
          <PlantGuide key={p.id} plant={p} open={focus === p.id} />
        ))}
      </div>

      <p className="fine" style={{ textAlign: 'center', marginTop: 14 }}>
        * คำแนะนำทั่วไปสำหรับสภาพอากาศในไทย ต้นไม้แต่ละต้นอาจต้องการต่างกันเล็กน้อย สังเกตใบและดินเป็นหลัก
      </p>
    </main>
  )
}
