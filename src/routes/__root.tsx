import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BottomNav } from '../components/BottomNav'
import { Decor } from '../components/art'
import { getAiStatus } from '../server/functions'
import { GardenProvider } from '../state/garden'

import appCss from '../styles.css?url'

const TITLE = 'GreenLens AI — เปลี่ยนมุมร้าง ให้เป็นปอดของเมือง'
const DESCRIPTION =
  'ถ่ายรูประเบียงหรือลานบ้าน ให้ AI จัดสวนฟอกอากาศให้ดูแบบ Before/After พร้อมรายการต้นไม้ที่เหมาะกับแสงแดด และผลประเมินการลดความร้อนและฝุ่น PM2.5'

export const Route = createRootRoute({
  loader: () => getAiStatus(),
  // AI availability only changes on redeploy; don't refetch on every navigation.
  staleTime: Infinity,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#f3f8f1' },
      { name: 'color-scheme', content: 'light' },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&family=Prompt:wght@500;600;700&family=Sriracha&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const { aiEnabled } = Route.useLoaderData()
  return (
    <GardenProvider aiEnabled={aiEnabled}>
      <Decor />
      <div className="app">
        <AppHeader />
        <Outlet />
      </div>
      <BottomNav />
    </GardenProvider>
  )
}
