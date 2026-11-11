import { ChevronDown, Compass, LoaderCircle, Navigation, Sun } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { hasCompass, readCameraHeading } from '../client/compass'
import { LIGHT_LABEL } from '../lib/plants'
import { estimateSun, FACING_LABEL, FACINGS, facingFromHeading } from '../lib/sun'
import type { Facing } from '../lib/types'
import { useGarden } from '../state/garden'

/** "Which way does the space face?" with an optional phone-compass reading. */
export function FacingField() {
  const g = useGarden()
  const id = useId()
  const [compassOk, setCompassOk] = useState(false)
  const [reading, setReading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => setCompassOk(hasCompass()), [])

  const facing = g.input.facing ?? null
  const sun = facing ? estimateSun(g.input.spaceType, facing, g.lat) : null

  async function useCompass() {
    setReading(true)
    setMsg(null)
    try {
      const heading = await readCameraHeading()
      const f = facingFromHeading(heading)
      g.setInput({ facing: f })
      setMsg(`เข็มทิศอ่านได้ ${Math.round(heading)}° → ${FACING_LABEL[f]} (ปรับเองได้ถ้าไม่ตรง)`)
    } catch (err) {
      setMsg(
        err instanceof Error && err.message === 'permission-denied'
          ? 'ไม่ได้รับอนุญาตให้ใช้เข็มทิศ เลือกทิศเองได้เลย'
          : 'อ่านเข็มทิศไม่ได้ เลือกทิศเองได้เลย',
      )
    } finally {
      setReading(false)
    }
  }

  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>
          <Compass size={17} strokeWidth={2} />
          ทิศทางแสงแดด
        </label>
        {compassOk && (
          <button type="button" className="mini-pill" onClick={useCompass} disabled={reading}>
            {reading ? <LoaderCircle size={13} className="animate-spin" /> : <Navigation size={13} />}
            ใช้เข็มทิศ
          </button>
        )}
      </div>
      <div className="select">
        <select
          id={id}
          value={facing ?? ''}
          onChange={(e) => g.setInput({ facing: e.target.value ? (e.target.value as Facing) : null })}
        >
          <option value="">ไม่แน่ใจ · ข้ามได้</option>
          {FACINGS.map((f) => (
            <option key={f} value={f}>
              ด้านที่เปิดโล่งหัน{FACING_LABEL[f]}
            </option>
          ))}
        </select>
        <ChevronDown size={18} />
      </div>

      {sun && (
        <p className="sun-note">
          <Sun size={15} />
          <span>
            {g.input.spaceType === 'rooftop' ? 'ดาดฟ้าโดนแดดเกือบทั้งวันทุกทิศ · ' : ''}
            แดดส่องตรงเฉลี่ย ~{sun.hours} ชม./วัน
            {sun.afternoonSun ? ' · แดดบ่ายร้อน' : ''} → <b>{LIGHT_LABEL[sun.light]}</b>
          </span>
        </p>
      )}
      {msg && <p className="fine" style={{ margin: '6px 2px 0' }}>{msg}</p>}
      {!facing && !msg && (
        <p className="fine" style={{ margin: '6px 2px 0' }}>
          {compassOk
            ? 'ยืนในห้อง หันกล้องหลังออกไปทางระเบียง แล้วกด “ใช้เข็มทิศ”'
            : 'บอกทิศที่ระเบียงหรือหน้าบ้านหันไป ระบบจะคำนวณแสงแดดจากเส้นทางดวงอาทิตย์ให้'}
        </p>
      )}
    </div>
  )
}
