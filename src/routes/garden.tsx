import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronRight, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { deleteGarden, listGardens, MAX_GARDENS, type GardenSummary } from '../client/gardens-db'
import { LeafMark } from '../components/art'
import { getPlant, LIGHT_LABEL, SPACE_LABEL } from '../lib/plants'
import { FACING_LABEL } from '../lib/sun'
import { useGarden } from '../state/garden'

export const Route = createFileRoute('/garden')({
  head: () => ({ meta: [{ title: 'สวนของฉัน — GreenLens AI' }] }),
  component: GardenPage,
})

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function GardenPage() {
  const g = useGarden()
  const navigate = useNavigate()
  const [items, setItems] = useState<GardenSummary[] | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [opening, setOpening] = useState<string | null>(null)

  useEffect(() => {
    listGardens()
      .then(setItems)
      .catch(() => {
        setUnavailable(true)
        setItems([])
      })
    // Refresh when a new garden was just generated.
  }, [g.result])

  async function open(id: string) {
    setOpening(id)
    const ok = await g.openSaved(id)
    setOpening(null)
    if (ok) navigate({ to: '/result' })
  }

  async function remove(id: string) {
    await deleteGarden(id).catch(() => {})
    setItems((list) => list?.filter((x) => x.id !== id) ?? null)
    setConfirmId(null)
  }

  return (
    <main>
      <div className="section-head" style={{ marginTop: 6 }}>
        <h1 className="page-title">สวนของฉัน</h1>
        <span className="hand" style={{ transform: 'rotate(-5deg)', textAlign: 'right' }}>
          เก็บไว้ในเครื่องนี้
          <br />
          กลับมาดูได้ตลอด
        </span>
      </div>

      {items === null && <p className="fine">กำลังโหลด…</p>}

      {items !== null && items.length === 0 && (
        <div className="empty">
          <LeafMark size={44} />
          <h2>{unavailable ? 'เบราว์เซอร์นี้บันทึกสวนไม่ได้' : 'ยังไม่มีสวน'}</h2>
          <p className="muted">
            {unavailable
              ? 'อาจเปิดโหมดไม่ระบุตัวตนอยู่ ลองเปิดในหน้าต่างปกติ'
              : 'ถ่ายรูปพื้นที่ว่างแล้วให้ AI จัดสวน สวนที่สร้างจะถูกเก็บไว้ที่นี่อัตโนมัติ'}
          </p>
          <Link to="/" className="cta">
            <span className="cta-icon">
              <Sparkles size={22} />
            </span>
            <span className="cta-text">
              <b>เริ่มจัดสวนแรกของคุณ</b>
              <small>ถ่ายรูประเบียงหรือลานบ้าน</small>
            </span>
            <ArrowRight size={22} />
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <>
          <ul className="saved-list">
            {items.map((it) => (
              <li key={it.id} className="saved-card">
                <button type="button" className="saved-open" onClick={() => open(it.id)} disabled={opening === it.id}>
                  <img className="saved-thumb" src={it.thumb} alt="" />
                  <span className="saved-body">
                    <span className="saved-date">
                      {formatDate(it.updatedAt)}
                      {it.id === g.currentId && <span className="chip green">กำลังดูอยู่</span>}
                    </span>
                    <b>
                      {SPACE_LABEL[it.input.spaceType]}
                      {it.input.facing ? ` · หัน${FACING_LABEL[it.input.facing]}` : ''}
                    </b>
                    <span className="fine">
                      {LIGHT_LABEL[it.input.light]} · {it.plan.items.reduce((a, x) => a + x.count, 0)} กระถาง ·{' '}
                      {it.source === 'ai' ? 'ภาพจาก AI' : 'ภาพจำลอง'}
                    </span>
                    <span className="chips" style={{ marginTop: 6 }}>
                      {it.plan.items.map((x) => (
                        <span key={x.plantId} className="chip green">
                          {getPlant(x.plantId).nameTh} × {x.count}
                        </span>
                      ))}
                    </span>
                  </span>
                  <ChevronRight size={20} className="saved-chevron" />
                </button>
                <div className="saved-actions">
                  {confirmId === it.id ? (
                    <>
                      <span className="fine">ลบสวนนี้ถาวร?</span>
                      <button type="button" className="text-btn danger" onClick={() => remove(it.id)}>
                        ลบเลย
                      </button>
                      <button type="button" className="text-btn" onClick={() => setConfirmId(null)}>
                        ยกเลิก
                      </button>
                    </>
                  ) : (
                    <button type="button" className="text-btn muted-btn" onClick={() => setConfirmId(it.id)}>
                      <Trash2 size={14} /> ลบ
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="fine" style={{ textAlign: 'center', marginTop: 14 }}>
            บันทึกอัตโนมัติในเครื่องนี้เท่านั้น ไม่ถูกส่งไปที่ใด เก็บได้สูงสุด {MAX_GARDENS} สวน
          </p>
        </>
      )}
    </main>
  )
}
