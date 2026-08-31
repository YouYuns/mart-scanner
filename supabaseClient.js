// 🗄️ Supabase 100% 무료 클라우드 DB & 개인화 유저 프로필 클라이언트

const SUPABASE_CONFIG = {
  url: localStorage.getItem('SUPABASE_URL') || 'https://ubhropwdbvuzbgfsuusk.supabase.co',
  anonKey: localStorage.getItem('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaHJvcHdkYnZ1emJnZnN1dXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMjk1MDQsImV4cCI6MjEwMzcwNTUwNH0.PTYQNqJ59KhMgtDM9jhappthLnJOdb2Oc2-_15tIFEE'
};

class SupabaseDB {
  constructor() {
    this.user = this.getCurrentUser();
    this.initFromBackendEnv();
  }

  async initFromBackendEnv() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const config = await res.json();
        if (config.supabaseUrl && config.supabaseAnonKey) {
          SUPABASE_CONFIG.url = config.supabaseUrl;
          SUPABASE_CONFIG.anonKey = config.supabaseAnonKey;
        }
      }
    } catch (e) {}
  }

  // 1. 현재 로그인 유저 또는 디바이스 프로필
  getCurrentUser() {
    const saved = localStorage.getItem('current_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const defaultUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      nickname: '알뜰장보기',
      isLoggedIn: false
    };
    localStorage.setItem('current_user_profile', JSON.stringify(defaultUser));
    return defaultUser;
  }

  login(nickname) {
    this.user = {
      id: 'usr_' + nickname.trim(),
      nickname: nickname.trim(),
      isLoggedIn: true
    };
    localStorage.setItem('current_user_profile', JSON.stringify(this.user));
    return this.user;
  }

  logout() {
    localStorage.removeItem('current_user_profile');
    this.user = this.getCurrentUser();
    return this.user;
  }

  isConfigured() {
    return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
  }

  // 2. 내 개인화 단골 상품 DB에서 실시간 조회
  async getFavorites() {
    // 1) 클라우드 Supabase DB에서 유저 단골 목록 조회
    if (this.isConfigured()) {
      try {
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/user_favorites?user_device_id=eq.${this.user.id}&select=product_id`, {
          headers: {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const ids = data.map(d => d.product_id);
            localStorage.setItem(`user_fav_${this.user.id}`, JSON.stringify(ids));
            return ids;
          }
        }
      } catch (e) {
        console.warn("Supabase fetch fallback:", e);
      }
    }

    // 2) 로컬 DB 조회
    const local = localStorage.getItem(`user_fav_${this.user.id}`);
    return local ? JSON.parse(local) : [];
  }

  // 3. 단골 상품 추가/삭제 (Supabase DB 즉시 동기화)
  async toggleFavorite(productId) {
    let favs = await this.getFavorites();
    const exists = favs.includes(productId);

    if (exists) {
      favs = favs.filter(id => id !== productId);
    } else {
      favs.unshift(productId);
    }

    localStorage.setItem(`user_fav_${this.user.id}`, JSON.stringify(favs));

    if (this.isConfigured()) {
      try {
        if (exists) {
          await fetch(`${SUPABASE_CONFIG.url}/rest/v1/user_favorites?user_device_id=eq.${this.user.id}&product_id=eq.${productId}`, {
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
              user_device_id: this.user.id,
              product_id: productId
            })
          });
        }
      } catch (e) {}
    }

    return favs;
  }

  // 4. 최근 검색 기록 DB 저장
  saveSearchHistory(query, product) {
    let history = JSON.parse(localStorage.getItem(`history_${this.user.id}`) || '[]');
    history = history.filter(h => h.name !== product.name);
    history.unshift({
      id: product.id,
      name: product.name,
      image: product.image,
      martPrice: product.offlineMartPrice,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    });
    if (history.length > 10) history.pop();
    localStorage.setItem(`history_${this.user.id}`, JSON.stringify(history));
  }

  getSearchHistory() {
    return JSON.parse(localStorage.getItem(`history_${this.user.id}`) || '[]');
  }
}

const supabaseDB = new SupabaseDB();
