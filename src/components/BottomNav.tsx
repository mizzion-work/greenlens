import { Link } from '@tanstack/react-router'
import { House, Info, Lightbulb, Sprout, type LucideIcon } from 'lucide-react'
import { useGarden } from '../state/garden'

const TABS: { to: '/' | '/result' | '/plan' | '/about'; Icon: LucideIcon; label: string; needsResult: boolean }[] = [
  { to: '/', Icon: House, label: 'หน้าแรก', needsResult: false },
  { to: '/result', Icon: Sprout, label: 'สวนของฉัน', needsResult: true },
  { to: '/plan', Icon: Lightbulb, label: 'ผลลัพธ์', needsResult: true },
  { to: '/about', Icon: Info, label: 'เกี่ยวกับ', needsResult: false },
]

export function BottomNav() {
  const { result } = useGarden()
  return (
    <nav className="bottom-nav" aria-label="เมนูหลัก">
      <div>
        {TABS.map(({ to, Icon, label, needsResult }) =>
          needsResult && !result ? (
            <span key={to} aria-disabled="true" title="สร้างภาพสวนก่อน">
              <Icon size={22} strokeWidth={1.8} />
              {label}
            </span>
          ) : (
            <Link key={to} to={to} activeProps={{ className: 'active' }} activeOptions={{ exact: true }}>
              <Icon size={22} strokeWidth={1.8} />
              {label}
            </Link>
          ),
        )}
      </div>
    </nav>
  )
}
