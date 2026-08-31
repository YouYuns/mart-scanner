-- 🛒 마트나침반 100% 무료 Supabase DB 테이블 생성 SQL
-- Supabase 대시보드 -> SQL Editor에 복사하여 [RUN]을 누르면 1초 만에 생성됩니다.

-- 1. 상품 마스터 및 실시간 가격 테이블
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  spec TEXT,
  mart_price INTEGER DEFAULT 0,
  lowest_online_price INTEGER DEFAULT 0,
  lowest_online_mall TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 유저별 자주 사는 단골 상품 (개인화 테이블)
CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_device_id TEXT NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_device_id, product_id)
);

-- 3. 마트 5사별 실시간 매장 가격 테이블
CREATE TABLE IF NOT EXISTS mart_prices (
  id BIGSERIAL PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  mart_name TEXT NOT NULL, -- 이마트, 트레이더스, 홈플러스, 롯데마트, 롯데슈퍼
  price INTEGER NOT NULL,
  unit_price INTEGER,
  badge TEXT,
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 읽기/쓰기 누구나 무료 허용 정책 (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read all" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update" ON products FOR ALL USING (true);

CREATE POLICY "Allow user favorites" ON user_favorites FOR ALL USING (true);
CREATE POLICY "Allow public mart prices" ON mart_prices FOR ALL USING (true);
