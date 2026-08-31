// 🛒 실시간 마트 5사 & 온라인 쇼핑몰 라이브 크롤링/API 백엔드 서버
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// .env 환경변수 자동 파싱 (외부 패키지 없이 순수 Node.js로 로드)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// 1. 프론트엔드용 안전한 환경변수 설정 반환 엔드포인트
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// 2. 실시간 네이버 쇼핑 라이브 크롤러
async function scrapeNaverShoppingLive(keyword) {
  try {
    const url = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      timeout: 5000
    });

    const $ = cheerio.load(data);
    const results = [];

    $('[class*="product_item"]').slice(0, 4).each((i, el) => {
      const title = $(el).find('[class*="product_title"]').text().trim();
      const priceText = $(el).find('[class*="price_num"]').text().replace(/[^0-9]/g, '');
      const mallName = $(el).find('[class*="product_mall"]').text().trim() || "네이버 쇼핑";
      const link = $(el).find('a[class*="product_link"]').attr('href') || "https://shopping.naver.com";
      const isFast = $(el).text().includes('도착보장') || $(el).text().includes('오늘출발');

      if (title && priceText) {
        const price = parseInt(priceText);
        results.push({
          mall: mallName,
          type: isFast ? "naver_fast" : "normal",
          badge: isFast ? "⚡ 도착보장" : "📦 일반택배",
          deliveryText: isFast ? "내일 도착 보장" : "2~3일 내 도착",
          deliverySpeedRank: isFast ? 1 : 2,
          price: price,
          shippingFee: 0,
          link: link.startsWith('http') ? link : `https://search.shopping.naver.com${link}`,
          unitPrice: Math.round(price / 5),
          inStock: true
        });
      }
    });

    return results.length > 0 ? results : null;
  } catch (err) {
    return null;
  }
}

// 3. 실시간 쿠팡 라이브 크롤러
async function scrapeCoupangLive(keyword) {
  try {
    const url = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword)}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      timeout: 5000
    });

    const $ = cheerio.load(data);
    const results = [];

    $('.search-product').slice(0, 3).each((i, el) => {
      const priceText = $(el).find('.price-value').text().replace(/[^0-9]/g, '');
      const isRocket = $(el).find('.badge.rocket').length > 0 || $(el).text().includes('로켓배송');
      const href = $(el).find('a').attr('href');

      if (priceText) {
        const price = parseInt(priceText);
        results.push({
          mall: "쿠팡",
          type: isRocket ? "rocket" : "normal",
          badge: isRocket ? "🚀 로켓배송" : "📦 일반배송",
          deliveryText: isRocket ? "내일 새벽 7시 전 도착" : "모레 도착 예정",
          deliverySpeedRank: isRocket ? 1 : 2,
          price: price,
          shippingFee: 0,
          link: href ? `https://www.coupang.com${href}` : `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`,
          unitPrice: Math.round(price / 5),
          inStock: true
        });
      }
    });

    return results.length > 0 ? results : null;
  } catch (err) {
    return null;
  }
}

// 4. 실시간 SSG / 이마트 크롤러
async function scrapeSSGLive(keyword) {
  try {
    const url = `https://www.ssg.com/search.ssg?target=all&query=${encodeURIComponent(keyword)}`;
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000
    });

    const $ = cheerio.load(data);
    const priceText = $('.ssg_price').first().text().replace(/[^0-9]/g, '');

    if (priceText) {
      return {
        martName: "이마트 (SSG몰)",
        branch: "전국 쓱배송",
        badge: "🚚 쓱배송",
        price: parseInt(priceText),
        unitPrice: Math.round(parseInt(priceText) / 5),
        event: "오늘 시간지정 쓱배송",
        inStock: true,
        rank: 3
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

// 5. 통합 실시간 검색 엔드포인트
app.get('/api/live-search', async (req, res) => {
  const query = req.query.q || req.query.code;
  if (!query) return res.status(400).json({ error: "Query required" });

  try {
    const [naverLive, coupangLive, ssgLive] = await Promise.all([
      scrapeNaverShoppingLive(query),
      scrapeCoupangLive(query),
      scrapeSSGLive(query)
    ]);

    res.json({
      success: true,
      query: query,
      liveStores: {
        naver: naverLive,
        coupang: coupangLive,
        ssg: ssgLive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 마트나침반 실시간 서버 구동 완료: http://localhost:${PORT}`);
  console.log(`🔒 .env 환경변수 및 Supabase DB 연동 준비 완료!`);
  console.log(`====================================================`);
});
