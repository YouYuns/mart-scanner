// 🗄️ Supabase 100% 무료 클라우드 DB 연동 클라이언트 (.env 자동 연동)

const SUPABASE_CONFIG = {
  url: localStorage.getItem('SUPABASE_URL') || '',
  anonKey: localStorage.getItem('SUPABASE_ANON_KEY') || ''
};

class SupabaseDB {
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.initFromBackendEnv();
  }

  // .env에 설정된 Supabase 환경변수 자동 로드
  async initFromBackendEnv() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const config = await res.json();
        if (config.supabaseUrl && config.supabaseAnonKey) {
          SUPABASE_CONFIG.url = config.supabaseUrl;
          SUPABASE_CONFIG.anonKey = config.supabaseAnonKey;
          console.log("🔒 [.env SUPABASE DB CONNECTED SUCCESSFULLY]");
        }
      }
    } catch (e) {}
  }

  getOrCreateDeviceId() {
    let id = localStorage.getItem('device_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('device_user_id', id);
    }
    return id;
  }

  isConfigured() {
    return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
  }

  // 1. 단골 상품 목록 조회
  async getFavorites() {
    if (!this.isConfigured()) {
      const localFavs = localStorage.getItem('user_favorites');
      return localFavs ? JSON.parse(localFavs) : ["prod_shin", "prod_hetbahn", "prod_milk"];
    }

    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/user_favorites?user_device_id=eq.${this.deviceId}&select=product_id`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map(d => d.product_id);
      }
    } catch (e) {
      console.warn("Supabase fetch failed, fallback to local:", e);
    }
    return ["prod_shin", "prod_hetbahn", "prod_milk"];
  }

  // 2. 단골 상품 추가/삭제
  async toggleFavorite(productId) {
    let favs = await this.getFavorites();
    const exists = favs.includes(productId);

    if (exists) {
      favs = favs.filter(id => id !== productId);
    } else {
      favs.unshift(productId);
    }

    localStorage.setItem('user_favorites', JSON.stringify(favs));

    if (this.isConfigured()) {
      try {
        if (exists) {
          await fetch(`${SUPABASE_CONFIG.url}/rest/v1/user_favorites?user_device_id=eq.${this.deviceId}&product_id=eq.${productId}`, {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_CONFIG.anonKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
          });
        } else {
          await fetch(`${SUPABASE_CONFIG.url}/rest/v1/user_favorites`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_CONFIG.anonKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              user_device_id: this.deviceId,
              product_id: productId
            })
          });
        }
      } catch (e) {
        console.warn("Supabase sync failed:", e);
      }
    }

    return favs;
  }
}

const supabaseDB = new SupabaseDB();
