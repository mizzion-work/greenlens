import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronRight, CircleAlert, Download, Info, Leaf, RefreshCw, Share2, Sparkles, Sprout } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dataUrlToBlob } from '../client/image'
import { BeforeAfter } from '../components/BeforeAfter'
import { getPlant } from '../lib/plants'
import { FAILURE_MESSAGE, useGarden } from '../state/garden'

export const Route = createFileRoute('/result')({
  head: () => ({ meta: [{ title: 'สวนของฉัน — GreenLens AI' }] }),
  component: ResultPage,
})

function ResultPage() {
  const g = useGarden()
  const navigate = useNavigate()
  const [canShare, setCanShare] = useState(false)
  const [regenError, setRegenError] = useState(false)

  useEffect(() => {
    if (g.hydrated && (!g.result || !g.photo)) navigate({ to: '/', replace: true })
  }, [g.hydrated, g.result, g.photo, navigate])

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  if (!g.result || !g.photo || !g.plan) {
    return <p className="fine">กำลังโหลด…</p>
  }

  const { result, photo, plan } = g
  const ext = result.image.startsWith('data:image/png') ? 'png' : 'jpg'
  const fileName = `greenlens-garden.${ext}`

  async function regenerate() {
    setRegenError(false)
    const ok = await g.generate(plan.variant + 1)
    if (!ok) setRegenError(true)
  }

  async function share() {
    const file = new File([dataUrlToBlob(result.image)], fileName, {
      type: ext === 'png' ? 'image/png' : 'image/jpeg',
    })
    const data: ShareData = {
      title: 'GreenLens AI',
      text: 'ถ้าพื้นที่ของฉันมีต้นไม้จะเป็นแบบนี้ ลองจัดสวนด้วย GreenLens AI',
      url: window.location.origin,
    }
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ ...data, files: [file] })
      else await navigator.share(data)
    } catch {
      /* user cancelled */
    }
  }

  return (
    <main>
      <header className="result-head">
        <h1 className="page-title">
          พื้นที่สีเขียวของคุณ
          <br />
          ในแบบที่เป็นไปได้!
        </h1>
        <p>
          {result.source === 'ai' ? 'AI จำลองพื้นที่สีเขียวที่เหมาะกับคุณ' : 'ภาพจำลองพื้นที่สีเขียวที่เหมาะกับคุณ'}
          <Leaf size={15} />
        </p>
      </header>

      {result.source === 'preview' && (
        <div className="notice warn" role="status">
          <Info size={17} />
          <span>
            <b>ภาพจำลองแบบง่าย</b> · {FAILURE_MESSAGE[result.fallbackReason ?? 'not-configured']}
          </span>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <BeforeAfter before={photo.dataUrl} after={result.image} width={photo.width} height={photo.height} />
        {g.generating && (
          <div className="scan" role="status" aria-live="polite" style={{ borderRadius: 24 }}>
            <span className="scan-label">
              <Sparkles size={15} /> กำลังจัดสวนแบบใหม่…
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="plant-strip" aria-label="ต้นไม้ในภาพ" style={{ flex: 1, minWidth: 0 }}>
          {plan.items.map((it) => (
            <span key={it.plantId}>
              <Sprout size={13} />
              {getPlant(it.plantId).nameTh} × {it.count}
            </span>
          ))}
        </div>
        <span className="hand" style={{ flex: 'none', marginTop: 10, transform: 'rotate(-5deg)' }} aria-hidden="true">
          ลองเลื่อนดูสิ!
        </span>
      </div>

      <button type="button" className="soft-action" onClick={regenerate} disabled={g.generating}>
        <span className="sa-icon">
          <RefreshCw size={19} className={g.generating ? 'animate-spin' : undefined} />
        </span>
        <span>
          <b>Regenerate</b>
          <small>ลองจัดสวนแบบอื่น</small>
        </span>
        <Sparkles size={20} className="sa-end" />
      </button>
      {regenError && (
        <div className="notice warn" role="alert">
          <CircleAlert size={17} />
          สร้างภาพใหม่ไม่สำเร็จ ลองอีกครั้ง
        </div>
      )}

      <Link to="/plan" className="cta">
        <span className="cta-icon">
          <Leaf size={22} />
        </span>
        <span className="cta-text">
          <b>ดูรายการต้นไม้</b>
          <small>View Action Plan</small>
        </span>
        <ChevronRight size={22} />
      </Link>

      <div className="mini-actions">
        <a href={result.image} download={fileName}>
          <Download size={15} /> บันทึกภาพ
        </a>
        {canShare && (
          <button type="button" onClick={share}>
            <Share2 size={15} /> แชร์
          </button>
        )}
      </div>

      <p className="fine" style={{ textAlign: 'center', marginTop: 14 }}>
        * ภาพนี้{result.source === 'ai' ? 'สร้างโดย AI' : 'เป็นภาพจำลอง'}เพื่อเป็นแรงบันดาลใจ
        ขนาดและตำแหน่งจริงของต้นไม้อาจต่างไปตามพื้นที่ของคุณ
      </p>
    </main>
  )
}
