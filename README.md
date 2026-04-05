# 교차로 휴스턴 v3.0

Houston 한인 비즈니스 디렉토리 — Next.js + Supabase + Stripe

## 기능
- 구글/카카오/이메일 로그인 (Supabase Auth)
- 업소 등록 (2단계 폼)
- VIP 구독 결제 (Stripe) Basic $29 / Pro $49 / Premium $79
- 14일 무료 체험
- 업소주 대시보드
- 관리자 페이지 (업소 승인/카테고리/배너 관리)
- 배너 광고 시스템 ($200~500/월)
- SEO 최적화 (OG, Twitter, robots)

## 실행
```bash
npm install && npm run dev
```

## 환경 변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://mgmnijwwishjdoqfeore.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_MONTHLY=price_...
STRIPE_PRO_MONTHLY=price_...
STRIPE_PREMIUM_MONTHLY=price_...
STRIPE_BASIC_YEARLY=price_...
STRIPE_PRO_YEARLY=price_...
STRIPE_PREMIUM_YEARLY=price_...
NEXT_PUBLIC_URL=https://kyocharo-houston.vercel.app
```

## Stripe 설정
1. Stripe 대시보드에서 Products 6개 생성 (Basic/Pro/Premium × Monthly/Yearly)
2. Webhook 등록: `https://kyocharo-houston.vercel.app/api/webhooks/stripe`
   - 이벤트: checkout.session.completed, invoice.payment_succeeded,
     invoice.payment_failed, customer.subscription.deleted, customer.subscription.updated

## DB 테이블
- `user_profiles` — 유저 프로필 (role: user/business_owner/admin/super_admin)
- `businesses` — 업소 정보
- `categories` — 카테고리 (DB 관리)
- `subscriptions` — Stripe 구독
- `banners` — 배너 광고

## 수익 구조
- VIP 구독: Basic $29, Pro $49, Premium $79/월
- 배너 광고: $200~500/월 per 광고주
- 연간 결제 시 17% 할인

## 관리자
- `/admin` — 업소 관리, 카테고리, 배너
- role: `admin` 또는 `super_admin`
// trigger redeploy
