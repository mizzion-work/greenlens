import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  Camera,
  CircleAlert,
  ImagePlus,
  Leaf,
  LoaderCircle,
  PawPrint,
  Ruler,
  ScanSearch,
  Sparkles,
  Sprout,
  Sun,
  TriangleAlert,
  Upload,
} from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { prepareImage, sampleImage, type PreparedImage } from '../client/image'
import { HandArrow, HeroArt } from '../components/art'
import { FacingField } from '../components/FacingField'
import { SelectField } from '../components/SelectField'
import { estimateSun } from '../lib/sun'
import type { Light, SpaceSize, SpaceType } from '../lib/types'
import { useGarden } from '../state/garden'

export const Route = createFileRoute('/')({ component: CapturePage })

const SCAN_STEPS = [
  'AI กำลังวิเคราะห์พื้นที่…',
  'กำลังเลือกต้นไม้ที่เหมาะกับแสงแดด…',
  'กำลังจัดวางกระถาง…',
  'กำลังเก็บรายละเอียดภาพ…',
]

const SPACE_OPTIONS: { value: SpaceType; label: string }[] = [
  { value: 'balcony', label: 'ระเบียงคอนโด' },
  { value: 'yard', label: 'ลานหน้าบ้าน' },
  { value: 'rooftop', label: 'ดาดฟ้า' },
]
const LIGHT_OPTIONS: { value: Light; label: string }[] = [
  { value: 'full', label: 'แดดจัด · แดดส่องตรง 6 ชม.ขึ้นไป' },
  { value: 'part', label: 'แดดรำไร · แดดส่อง 3–6 ชม.' },
  { value: 'shade', label: 'ร่มเงา · แดดน้อยกว่า 3 ชม.' },
]
const SIZE_OPTIONS: { value: SpaceSize; label: string }[] = [
  { value: 'S', label: 'เล็ก · น้อยกว่า 4 ตร.ม.' },
  { value: 'M', label: 'กลาง · 4–8 ตร.ม.' },
  { value: 'L', label: 'ใหญ่ · มากกว่า 8 ตร.ม.' },
]

function CapturePage() {
  const g = useGarden()
  const navigate = useNavigate()
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const [loadingPhoto, setLoadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState(0)
  const [genError, setGenError] = useState(false)

  useEffect(() => {
    if (!g.generating) return
    setStep(0)
    const t = setInterval(() => setStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1)), 3500)
    return () => clearInterval(t)
  }, [g.generating])

  async function loadPhoto(load: () => Promise<PreparedImage>) {
    setPhotoError(null)
    setLoadingPhoto(true)
    try {
      g.setPhoto(await load())
    } catch {
      setPhotoError('เปิดรูปนี้ไม่ได้ ลองเลือกรูปแบบ JPG หรือ PNG')
    } finally {
      setLoadingPhoto(false)
    }
  }

  function onFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      setPhotoError('กรุณาเลือกไฟล์รูปภาพ')
      return
    }
    void loadPhoto(() => prepareImage(file))
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    onFile(e.dataTransfer.files[0])
  }

  async function onGenerate() {
    setGenError(false)
    const ok = await g.generate(0)
    if (ok) navigate({ to: '/result' })
    else setGenError(true)
  }

  const analysis = g.analysis
  const ai = analysis.status === 'done' && analysis.analysis.isOutdoorSpace ? analysis.analysis : null
  const sunLight = g.input.facing ? estimateSun(g.input.spaceType, g.input.facing, g.lat).light : null
  const lightTag =
    sunLight === g.input.light ? 'คำนวณจากทิศ' : ai?.light === g.input.light && !g.input.facing ? 'AI แนะนำ' : null

  return (
    <main>
      <section className="hero">
        <span className="hand">
          ถ่ายพื้นที่ว่าง
          <br />
          เปลี่ยนเป็นสวน
        </span>
        <HandArrow style={{ position: 'absolute', right: 70, top: 30, zIndex: 3 }} />
        <HeroArt className="hero-art" />
        <h1>
          เปลี่ยนมุมร้าง
          <br />
          ให้เป็นปอดของเมือง
        </h1>
        <p>ถ่ายรูปพื้นที่ว่าง แล้วให้ AI จัดสวนฟอกอากาศที่เหมาะกับบ้านคุณให้ดูทันที</p>
      </section>

      <div
        className={`upload${g.photo ? ' has-photo' : ''}${dragging ? ' dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {g.photo ? (
          <>
            <img src={g.photo.dataUrl} alt="ภาพพื้นที่ของคุณ" />
            {!g.generating && (
              <button type="button" className="photo-chip" onClick={() => libraryRef.current?.click()}>
                <ImagePlus size={15} /> เปลี่ยนรูป
              </button>
            )}
            {!g.generating && analysis.status === 'running' && (
              <div className="analysis-chip" role="status">
                <LoaderCircle size={17} className="animate-spin" />
                AI กำลังดูพื้นที่ของคุณ เพื่อตั้งค่าด้านล่างให้อัตโนมัติ…
              </div>
            )}
            {!g.generating && ai && (
              <div className="analysis-chip" role="status">
                <ScanSearch size={17} />
                <span>
                  <b>AI มองเห็น:</b> {ai.summaryTh}
                </span>
              </div>
            )}
            {!g.generating && analysis.status === 'done' && !analysis.analysis.isOutdoorSpace && (
              <div className="analysis-chip warn" role="status">
                <TriangleAlert size={17} />
                <span>ภาพนี้อาจไม่ใช่พื้นที่สำหรับวางต้นไม้ ลองถ่ายระเบียง ลานบ้าน หรือดาดฟ้าให้เห็นพื้นชัด ๆ</span>
              </div>
            )}
            {g.generating && (
              <div className="scan" role="status" aria-live="polite">
                <span className="scan-label">
                  <Sparkles size={15} /> {SCAN_STEPS[step]}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="lens">
              {loadingPhoto ? <LoaderCircle size={30} className="animate-spin" /> : <Camera size={32} strokeWidth={1.8} />}
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => cameraRef.current?.click()}
              disabled={loadingPhoto}
            >
              ถ่ายรูปพื้นที่ว่างของคุณ
            </button>
            <div>
              <button type="button" className="alt-action" onClick={() => libraryRef.current?.click()}>
                <Upload size={15} /> หรือ อัปโหลดรูปจากแกลเลอรี
              </button>
            </div>
          </>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*,.heic,.heif"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {!g.photo && (
        <div className="link-row" style={{ marginTop: 10 }}>
          <button type="button" onClick={() => void loadPhoto(sampleImage)}>
            ไม่มีรูปตอนนี้? ลองใช้ภาพตัวอย่างระเบียงคอนกรีต
          </button>
        </div>
      )}

      {photoError && (
        <div className="notice warn" role="alert">
          <CircleAlert size={17} />
          {photoError}
        </div>
      )}

      <div className="section-head">
        <h2>
          <Leaf size={20} /> ตั้งค่าข้อมูลพื้นที่
        </h2>
        <span className="hand" style={{ transform: 'rotate(-5deg)', textAlign: 'right', maxWidth: 150 }}>
          ข้อมูลยิ่งละเอียด
          <br />
          AI ยิ่งแนะนำได้แม่นยำ!
        </span>
      </div>

      <SelectField<SpaceType>
        label="ประเภทพื้นที่"
        Icon={Building2}
        value={g.input.spaceType}
        options={SPACE_OPTIONS}
        tag={ai?.spaceType === g.input.spaceType ? 'AI แนะนำ' : null}
        onChange={(spaceType) => g.setInput({ spaceType })}
      />
      <FacingField />
      <SelectField<Light>
        label="ปริมาณแสงแดด"
        Icon={Sun}
        value={g.input.light}
        options={LIGHT_OPTIONS}
        tag={lightTag}
        onChange={(light) => g.setInput({ light })}
      />
      <SelectField<SpaceSize>
        label="ขนาดพื้นที่โดยประมาณ"
        Icon={Ruler}
        value={g.input.size}
        options={SIZE_OPTIONS}
        tag={ai?.size === g.input.size ? 'AI แนะนำ' : null}
        onChange={(size) => g.setInput({ size })}
      />

      <div className="pill-toggles">
        <button
          type="button"
          className="pill-toggle"
          aria-pressed={g.input.hasPets}
          onClick={() => g.setInput({ hasPets: !g.input.hasPets })}
        >
          <PawPrint size={15} /> มีน้องหมาน้องแมว
        </button>
        <button
          type="button"
          className="pill-toggle"
          aria-pressed={g.input.beginner}
          onClick={() => g.setInput({ beginner: !g.input.beginner })}
        >
          <Sprout size={15} /> มือใหม่หัดปลูก
        </button>
      </div>
      {g.input.hasPets && <p className="fine" style={{ margin: '8px 2px 0' }}>เลือกเฉพาะต้นไม้ที่ไม่เป็นพิษต่อสัตว์เลี้ยง</p>}

      <button type="button" className="cta" onClick={onGenerate} disabled={!g.photo || g.generating || loadingPhoto}>
        <span className="cta-icon">
          {g.generating ? <LoaderCircle size={22} className="animate-spin" /> : <Sparkles size={22} />}
        </span>
        <span className="cta-text">
          <b>{g.generating ? 'กำลังจัดสวน…' : 'Let AI Generate'}</b>
          <small>{g.photo ? '(เริ่มจัดสวนเลย)' : 'ถ่ายหรืออัปโหลดรูปก่อนนะ'}</small>
        </span>
        <ArrowRight size={22} />
      </button>

      {genError && (
        <div className="notice warn" role="alert">
          <CircleAlert size={17} />
          สร้างภาพไม่สำเร็จ ลองใหม่อีกครั้ง
        </div>
      )}

      <p className="fine" style={{ textAlign: 'center', margin: '14px 8px 0' }}>
        {g.aiEnabled
          ? 'รูปถูกย่อขนาดและลบข้อมูลตำแหน่ง (GPS) ก่อนส่งให้ Google Gemini ประมวลผล GreenLens ไม่เก็บรูปไว้บนเซิร์ฟเวอร์'
          : 'โหมดภาพจำลอง: รูปของคุณถูกประมวลผลบนเครื่องนี้เท่านั้น ไม่ถูกอัปโหลด'}
      </p>

      <div className="link-row">
        <Link to="/about">วิธีทำงาน</Link>
        <span className="sep">|</span>
        <Link to="/about" hash="method">
          วิธีคำนวณ
        </Link>
        <span className="sep">|</span>
        <Link to="/about" hash="privacy">
          ความเป็นส่วนตัว
        </Link>
      </div>
    </main>
  )
}
