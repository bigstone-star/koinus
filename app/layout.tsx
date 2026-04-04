import './globals.css'
import type { Metadata } from 'next'
import GlobalHeader from '@/components/GlobalHeader'
import ThemeLoader from '@/components/ThemeLoader'

export const metadata: Metadata = {
  metadataBase: new URL('https://kyocharo-houston.vercel.app'),
  title: '교차로 휴스턴',
  description: '한인 업소 디렉토리',
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
