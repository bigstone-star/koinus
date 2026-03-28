import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '교차로 휴스턴 — Houston 한인 비즈니스 디렉토리',
  description: 'Houston 한인 업소 704개 정보. 식당, 의료, 법률, 미용, 마트 등.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-100 min-h-screen">{children}</body>
    </html>
  )
}