-- ================================================================
-- 교차로 휴스턴 v3.0 — 추가 스키마 (Supabase SQL Editor에서 실행)
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 유저 프로필
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, name TEXT, phone TEXT, avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user','business_owner','admin','super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, name, avatar_url)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. businesses 추가 컬럼
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS description_kr TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sns_instagram TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sns_kakao TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 3. subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('basic','pro','premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','past_due','trialing')),
  current_period_end TIMESTAMPTZ,
  amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read" ON businesses FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "owner_update" ON businesses FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY IF NOT EXISTS "owner_insert" ON businesses FOR INSERT WITH CHECK (owner_id = auth.uid());

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "profiles_own" ON user_profiles USING (id = auth.uid());

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "subs_own" ON subscriptions FOR SELECT USING (user_id = auth.uid());

SELECT 'v3 Schema Ready!' as result;
