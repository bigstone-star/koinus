import './globals.css'
import type { Metadata } from 'next'
import GlobalHeader from '@/components/GlobalHeader'
import ThemeLoader from '@/components/ThemeLoader'

export const metadata = {
  title: {
    default: 'KOinUS',
    template: '%s | KOinUS',
  },
  description: 'KOinUS 한인 비즈니스 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <ThemeLoader />

        <div className="fixed top-0 left-0 right-0 z-50">
          <GlobalHeader />
        </div>

        <div className="pt-[56px]">
          {children}
        </div>
      </body>
    </html>
  )
}
