import './globals.css'
import type { Metadata } from 'next'
import GlobalHeader from '@/components/GlobalHeader'

export const metadata: Metadata = {
  metadataBase: new URL('https://kyocharo-houston.vercel.app'),
  title: '교차로 휴스턴 | Houston 한인 비즈니스 디렉토리',
  description: 'Houston 한인 업소 디렉토리',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <GlobalHeader />
        {children}
      </body>
    </html>
  )
}
