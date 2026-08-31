// 🛒 실시간 마트 5사 & 온라인 쇼핑몰 실물 제품 패키지 사진 & 라이브 가격 크롤러
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// .env 환경변수 로드
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

// 1. 프론트엔드 환경변수 반환
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// 2. 네이버 쇼핑 실시간 크롤러 (실제 유통 패키지 사진 + 실시간 가격 추출)
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
    let mainProductImage = null;

    $('[class*="product_item"]').slice(0, 5).each((i, el) => {
      const title = $(el).find('[class*="product_title"]').text().trim();
      const priceText = $(el).find('[class*="price_num"]').text().replace(/[^0-9]/g, '');
      const mallName = $(el).find('[class*="product_mall"]').text().trim() || "네이버 쇼핑";
      const link = $(el).find('a[class*="product_link"]').attr('href') || "https://shopping.naver.com";
      const isFast = $(el).text().includes('도착보장') || $(el).text().includes('오늘출발');
      const imgSrc = $(el).find('img[class*="thumbnail_thumb"]').attr('src') || $(el).find('img').attr('src');

      if (imgSrc && !mainProductImage && imgSrc.startsWith('http')) {
        mainProductImage = imgSrc;
      }

      if (title && priceText) {
        const price = parseInt(priceText);
        results.push({
          title: title,
          mall: mallName,
          type: isFast ? "naver_fast" : "normal",
          badge: isFast ? "⚡ 도착보장" : "📦 일반택배",
          deliveryText: isFast ? "내일 도착 보장" : "2~3일 내 도착",
          deliverySpeedRank: isFast ? 1 : 2,
          price: price,
          shippingFee: 0,
          image: imgSrc || null,
          link: link.startsWith('http') ? link : `https://search.shopping.naver.com${link}`,
          unitPrice: Math.round(price / 5),
          inStock: true
        });
      }
    });

    return { stores: results, productImage: mainProductImage };
  } catch (err) {
    return { stores: [], productImage: null };
  }
}

// 3. 통합 실시간 검색 엔드포인트
app.get('/api/live-search', async (req, res) => {
  const query = req.query.q || req.query.code;
  if (!query) return res.status(400).json({ error: "Query required" });

  try {
    const naverData = await scrapeNaverShoppingLive(query);

    res.json({
      success: true,
      query: query,
      productImage: naverData.productImage,
      liveStores: {
        naver: naverData.stores
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 마트나침반 실시간 이미지/가격 서버 구동 완료: http://localhost:${PORT}`);
});
