import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '교차로 휴스턴 | Houston 한인 비즈니스 디렉토리',
  description: 'Houston 한인 업소 705개. 식당, 의료, 법률, 미용, 마트 등. 교차로 휴스턴에서 찾으세요.',
  keywords: ['휴스턴', '한인', '비즈니스', '디렉토리', 'Houston', 'Korean', 'Business', '교차로'],
  authors: [{ name: '교차로 휴스턴' }],
  openGraph: {
    title: '교차로 휴스턴 | Houston 한인 비즈니스 디렉토리',
    description: 'Houston 한인 업소 705개. 식당, 의료, 법률, 미용, 마트 등.',
    url: 'https://kyocharo-houston.vercel.app',
    siteName: '교차로 휴스턴',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '교차로 휴스턴 | Houston 한인 비즈니스 디렉토리',
    description: 'Houston 한인 업소 705개. 식당, 의료, 법률, 미용, 마트 등.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://kyocharo-houston.vercel.app',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1a1a2e" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}
