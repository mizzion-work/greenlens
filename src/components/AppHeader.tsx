import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ClipboardList, House, Images, Info, Lightbulb, Menu, RotateCcw, Sprout, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useGarden } from '../state/garden'
import { AppIcon } from './art'
import { NAV_TABS } from './BottomNav'

export function AppHeader() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const g = useGarden()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (st) => st.location.pathname })

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <header className="app-header" ref={ref}>
      <Link to="/" className="brand" onClick={close}>
        <AppIcon size={42} />
        <span>
          <b>GreenLens AI</b>
          <small>เปลี่ยนมุมร้าง ให้เป็นปอดของเมือง</small>
        </span>
      </Link>
      <nav className="top-nav" aria-label="เมนูหลัก">
        {NAV_TABS.map(({ to, Icon, label, match }) => {
          const active = match(pathname)
          return (
            <Link key={to} to={to} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
              <Icon size={18} strokeWidth={1.9} />
              {label}
            </Link>
          )
        })}
      </nav>
      <button
        type="button"
        className="icon-btn"
        aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <nav className="menu-sheet" aria-label="เมนู">
          <Link to="/" onClick={close}>
            <House size={18} /> หน้าแรก
          </Link>
          {g.result && (
            <>
              <Link to="/result" onClick={close}>
                <Images size={18} /> ภาพก่อน/หลังล่าสุด
              </Link>
              <Link to="/plan" onClick={close}>
                <ClipboardList size={18} /> ผลลัพธ์และรายการต้นไม้
              </Link>
            </>
          )}
          <Link to="/garden" onClick={close}>
            <Sprout size={18} /> สวนของฉัน
          </Link>
          <Link to="/tips" onClick={close}>
            <Lightbulb size={18} /> เคล็ดลับดูแลต้นไม้
          </Link>
          <Link to="/about" onClick={close}>
            <Info size={18} /> เกี่ยวกับ GreenLens
          </Link>
          {g.photo && (
            <>
              <hr />
              <button
                type="button"
                onClick={() => {
                  g.reset()
                  close()
                  navigate({ to: '/' })
                }}
              >
                <RotateCcw size={18} /> เริ่มใหม่ด้วยรูปอื่น
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
