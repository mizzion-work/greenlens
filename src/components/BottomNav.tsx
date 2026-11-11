import { Link, useRouterState } from '@tanstack/react-router'
import { House, Info, Lightbulb, Sprout, type LucideIcon } from 'lucide-react'

const TABS: { to: '/' | '/garden' | '/tips' | '/about'; Icon: LucideIcon; label: string; match: (p: string) => boolean }[] = [
  { to: '/', Icon: House, label: 'หน้าแรก', match: (p) => p === '/' },
  {
    to: '/garden',
    Icon: Sprout,
    label: 'สวนของฉัน',
    match: (p) => p.startsWith('/garden') || p.startsWith('/result') || p.startsWith('/plan'),
  },
  { to: '/tips', Icon: Lightbulb, label: 'เคล็ดลับ', match: (p) => p.startsWith('/tips') },
  { to: '/about', Icon: Info, label: 'เกี่ยวกับ', match: (p) => p.startsWith('/about') },
]

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav className="bottom-nav" aria-label="เมนูหลัก">
      <div>
        {TABS.map(({ to, Icon, label, match }) => {
          const active = match(pathname)
          return (
            <Link key={to} to={to} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
              <Icon size={22} strokeWidth={1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
