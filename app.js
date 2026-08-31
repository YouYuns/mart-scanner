// 🛒 깔끔한 마트 5사 & 온라인 통합 가격비교 및 개인화 엔진

let currentProduct = null;
let activeMainTab = 'marts'; // 'marts' | 'online' | 'alternatives'
let onlineSort = 'fastest'; // 'fastest' | 'cheapest'
let html5QrCode = null;
let isScannerRunning = false;

// 1. Initial Setup
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  setupEventListeners();
  await loadFavorites();
  loadApiSettings();
  
  // Default product
  selectProductByKeyword("신라면");
});

// 2. Event Listeners Wiring
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const btnSearch = document.getElementById('btnSearch');

  if (btnSearch) btnSearch.addEventListener('click', handleSearch);
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  // Main 3-Way Tabs
  document.getElementById('tabMarts').addEventListener('click', () => switchMainTab('marts'));
  document.getElementById('tabOnline').addEventListener('click', () => switchMainTab('online'));
  document.getElementById('tabAlternatives').addEventListener('click', () => switchMainTab('alternatives'));

  // Online Sub-filters
  document.getElementById('subFastest').addEventListener('click', () => switchOnlineSort('fastest'));
  document.getElementById('subCheapest').addEventListener('click', () => switchOnlineSort('cheapest'));

  // Scanner Open/Close
  document.getElementById('btnOpenScanner').addEventListener('click', openScanner);
  document.getElementById('navScan').addEventListener('click', openScanner);
  document.getElementById('btnCloseScanner').addEventListener('click', closeScanner);

  // Bottom Navigation
  document.getElementById('navHome').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('navFavorites').addEventListener('click', () => {
    document.getElementById('favoritesList').scrollIntoView({ behavior: 'smooth' });
  });

  // Favorite toggle on main card
  document.getElementById('btnToggleFavorite').addEventListener('click', toggleCurrentFavorite);

  // Mart price recalculation
  document.getElementById('btnRecalculate').addEventListener('click', () => {
    if (!currentProduct) return;
    const inputVal = parseInt(document.getElementById('martPriceInput').value);
    if (!isNaN(inputVal) && inputVal > 0) {
      currentProduct.offlineMartPrice = inputVal;
      renderVerdict();
      renderCurrentTabContent();
    }
  });

  // API Settings Modal
  document.getElementById('btnOpenApiSettings').addEventListener('click', toggleApiSettings);
  document.getElementById('btnCloseApiSettings').addEventListener('click', toggleApiSettings);
  document.getElementById('btnSaveApiKeys').addEventListener('click', saveApiSettings);

  // Preset buttons inside scanner modal
  document.querySelectorAll('.modal-test-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const keyword = e.currentTarget.dataset.keyword;
      if (keyword) {
        selectProductByKeyword(keyword);
        closeScanner();
      }
    });
  });
}

// 3. Personalized Favorites (100% 무료 Supabase DB + 로컬 영구 연동)
async function loadFavorites() {
  const container = document.getElementById('favoritesList');
  if (!container) return;

  const favIds = await supabaseDB.getFavorites();
  const favProducts = PRODUCT_DATABASE.filter(p => favIds.includes(p.id));

  container.innerHTML = favProducts.map(p => `
    <div class="fav-item flex items-center space-x-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 px-3 py-2 rounded-2xl cursor-pointer transition flex-shrink-0" data-id="${p.id}">
      <img src="${p.image}" class="w-8 h-8 rounded-xl object-cover border border-white shadow-xs">
      <div class="text-left">
        <div class="text-xs font-bold text-slate-800">${p.name.split(' ')[1] || p.name.split(' ')[0]}</div>
        <div class="text-[10px] text-slate-400 font-medium">${p.offlineMartPrice.toLocaleString()}원</div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.fav-item').forEach(el => {
    el.addEventListener('click', () => {
      const prod = PRODUCT_DATABASE.find(p => p.id === el.dataset.id);
      if (prod) applyProduct(prod);
    });
  });
}

async function toggleCurrentFavorite() {
  if (!currentProduct) return;
  await supabaseDB.toggleFavorite(currentProduct.id);
  await loadFavorites();
  await updateHeartButton();
}

async function updateHeartButton() {
  const btn = document.getElementById('btnToggleFavorite');
  if (!btn || !currentProduct) return;

  const favs = await supabaseDB.getFavorites();
  const isFav = favs.includes(currentProduct.id);

  if (isFav) {
    btn.innerHTML = `<i data-lucide="heart" class="w-3.5 h-3.5 text-rose-500 fill-rose-500"></i>`;
  } else {
    btn.innerHTML = `<i data-lucide="heart" class="w-3.5 h-3.5 text-slate-400"></i>`;
  }
  lucide.createIcons();
}

// 4. Product Selection & Search
function selectProductByKeyword(query) {
  if (!query) return;
  const cleanQuery = query.trim();

  const match = PRODUCT_DATABASE.find(p => 
    p.barcode === cleanQuery || 
    p.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(cleanQuery.toLowerCase()) ||
    cleanQuery.toLowerCase().includes(p.name.split(' ')[1]?.toLowerCase() || '')
  );

  if (match) {
    applyProduct(match);
  } else {
    const dynamicProduct = {
      id: `custom_${Date.now()}`,
      barcode: cleanQuery.length > 8 && !isNaN(cleanQuery) ? cleanQuery : "8809999999999",
      name: `${cleanQuery}`,
      category: "일반식품",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
      standardSpec: "1세트 / 표준 규격",
      unitType: "1개당",
      offlineMartPrice: 4500,
      marts: [
        { martName: "이마트 트레이더스", badge: "최저가", price: 3800, unitPrice: 3800, rank: 1, note: "대용량 특가" },
        { martName: "홈플러스", badge: "행사중", price: 4100, unitPrice: 4100, rank: 2, note: "특가 행사" },
        { martName: "이마트", badge: "정가", price: 4500, unitPrice: 4500, rank: 3, note: "정상가" },
        { martName: "롯데마트", badge: "정가", price: 4500, unitPrice: 4500, rank: 4, note: "정상가" }
      ],
      stores: [
        { mall: "네이버 도착보장", badge: "⚡ 내일 도착", deliveryText: "내일 도착 보장", price: 3900, shippingFee: 0, link: `https://shopping.naver.com/search/all?query=${encodeURIComponent(cleanQuery)}`, unitPrice: 3900 },
        { mall: "쿠팡", badge: "🚀 로켓배송", deliveryText: "내일 새벽 7시 도착", price: 4100, shippingFee: 0, link: `https://www.coupang.com/np/search?q=${encodeURIComponent(cleanQuery)}`, unitPrice: 4100 }
      ],
      alternatives: []
    };
    applyProduct(dynamicProduct);
  }

  enrichWithLiveBackend(cleanQuery);
}

function applyProduct(product) {
  currentProduct = JSON.parse(JSON.stringify(product));
  renderProductView();
}

async function enrichWithLiveBackend(keyword) {
  try {
    const res = await fetch(`http://localhost:3000/api/live-search?q=${encodeURIComponent(keyword)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.liveStores && currentProduct) {
        let updated = false;
        if (data.liveStores.naver && data.liveStores.naver.length > 0) {
          currentProduct.stores = data.liveStores.naver;
          updated = true;
        }
        if (data.liveStores.coupang && data.liveStores.coupang.length > 0) {
          currentProduct.stores.unshift(...data.liveStores.coupang);
          updated = true;
        }
        if (data.liveStores.ssg) {
          const emart = currentProduct.marts.find(m => m.martName.includes("이마트"));
          if (emart) emart.price = data.liveStores.ssg.price;
          updated = true;
        }
        if (updated) {
          renderVerdict();
          renderCurrentTabContent();
        }
      }
    }
  } catch (e) {}
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  const query = input.value.trim();
  if (!query) {
    alert("검색어를 입력해주세요! (예: 신라면, 햇반, 진라면, 우유)");
    return;
  }
  selectProductByKeyword(query);
  input.value = '';
}

// 5. Render Main Product View
function renderProductView() {
  if (!currentProduct) return;

  document.getElementById('productImg').src = currentProduct.image;
  document.getElementById('productName').textContent = currentProduct.name;
  document.getElementById('productCategory').textContent = currentProduct.category;
  document.getElementById('productSpec').textContent = currentProduct.standardSpec;
  document.getElementById('martPriceInput').value = currentProduct.offlineMartPrice;

  updateHeartButton();
  renderVerdict();
  renderCurrentTabContent();
  lucide.createIcons();
}

// 6. 1-Second Verdict Calculation
function renderVerdict() {
  const banner = document.getElementById('verdictBanner');
  if (!currentProduct || !banner) return;

  const currentMartPrice = currentProduct.offlineMartPrice;
  const validStores = currentProduct.stores.filter(s => s.price > 0);
  const cheapestOnline = validStores.reduce((min, cur) => {
    const curTotal = cur.price + (cur.shippingFee || 0);
    const minTotal = min.price + (min.shippingFee || 0);
    return curTotal < minTotal ? cur : min;
  }, validStores[0]);

  const onlineTotal = cheapestOnline ? (cheapestOnline.price + (cheapestOnline.shippingFee || 0)) : currentMartPrice;
  const diffOnline = Math.abs(currentMartPrice - onlineTotal);

  if (currentMartPrice < onlineTotal) {
    banner.className = "p-3 rounded-2xl flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-xs";
    banner.innerHTML = `
      <div class="flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
          🛒
        </div>
        <div>
          <div class="text-xs font-black text-emerald-900">
            마트가 <span class="text-emerald-700">${diffOnline.toLocaleString()}원</span> 더 저렴합니다
          </div>
          <div class="text-[11px] text-emerald-600 font-medium">지금 카트에 담으세요!</div>
        </div>
      </div>
      <span class="px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg whitespace-nowrap">
        마트 추천
      </span>
    `;
  } else if (onlineTotal < currentMartPrice) {
    banner.className = "p-3 rounded-2xl flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-950 shadow-xs";
    banner.innerHTML = `
      <div class="flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
          🚀
        </div>
        <div>
          <div class="text-xs font-black text-blue-950">
            온라인이 <span class="text-blue-600">${diffOnline.toLocaleString()}원</span> 더 저렴합니다
          </div>
          <div class="text-[11px] text-blue-600 font-medium">${cheapestOnline.mall} ${cheapestOnline.deliveryText}</div>
        </div>
      </div>
      <a href="${cheapestOnline.link}" target="_blank" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition whitespace-nowrap">
        구매하기
      </a>
    `;
  } else {
    banner.className = "p-3 rounded-2xl flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-800";
    banner.innerHTML = `
      <div class="text-xs font-bold text-slate-700">마트와 온라인 가격이 동일합니다</div>
    `;
  }
}

// 7. Switch Main Tabs
function switchMainTab(tab) {
  activeMainTab = tab;

  const tabMarts = document.getElementById('tabMarts');
  const tabOnline = document.getElementById('tabOnline');
  const tabAlternatives = document.getElementById('tabAlternatives');
  const onlineSubFilters = document.getElementById('onlineSubFilters');

  [tabMarts, tabOnline, tabAlternatives].forEach(el => {
    el.className = "flex-1 py-2.5 rounded-xl transition text-slate-500 font-bold hover:text-slate-900";
  });

  if (tab === 'marts') {
    tabMarts.className = "flex-1 py-2.5 rounded-xl transition text-slate-900 bg-white shadow-xs font-bold";
    onlineSubFilters.classList.add('hidden');
  } else if (tab === 'online') {
    tabOnline.className = "flex-1 py-2.5 rounded-xl transition text-slate-900 bg-white shadow-xs font-bold";
    onlineSubFilters.classList.remove('hidden');
  } else if (tab === 'alternatives') {
    tabAlternatives.className = "flex-1 py-2.5 rounded-xl transition text-slate-900 bg-white shadow-xs font-bold relative";
    onlineSubFilters.classList.add('hidden');
  }

  renderCurrentTabContent();
}

function switchOnlineSort(sort) {
  onlineSort = sort;
  const subFastest = document.getElementById('subFastest');
  const subCheapest = document.getElementById('subCheapest');

  if (sort === 'fastest') {
    subFastest.className = "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 text-white shadow-xs";
    subCheapest.className = "px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700";
  } else {
    subFastest.className = "px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700";
    subCheapest.className = "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 text-white shadow-xs";
  }

  renderOnlineStoresView();
}

// 8. Render Tab Contents
function renderCurrentTabContent() {
  const container = document.getElementById('offersContainer');
  if (!currentProduct || !container) return;

  container.innerHTML = '';

  if (activeMainTab === 'marts') {
    renderMartsView(container);
  } else if (activeMainTab === 'online') {
    renderOnlineStoresView(container);
  } else if (activeMainTab === 'alternatives') {
    renderAlternativesView(container);
  }

  lucide.createIcons();
}

// 9. Render Marts View (Clean List)
function renderMartsView(container) {
  const marts = currentProduct.marts || [];

  marts.forEach((mart, idx) => {
    const isTop = idx === 0;
    const card = document.createElement('div');
    card.className = `p-3 rounded-2xl border transition flex items-center justify-between ${
      isTop ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100'
    }`;

    card.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
          isTop ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
        }">${idx + 1}</span>
        <div>
          <div class="flex items-center space-x-1.5">
            <span class="text-xs font-bold text-slate-900">${mart.martName}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isTop ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }">${mart.badge}</span>
          </div>
          <div class="text-[11px] text-slate-400 font-medium mt-0.5">${mart.note || '전국 매장'}</div>
        </div>
      </div>

      <div class="text-right">
        <div class="text-sm font-black text-slate-900">${mart.price.toLocaleString()}<span class="text-xs font-normal">원</span></div>
        <div class="text-[10px] text-slate-400 font-medium">${currentProduct.unitType}당 ${mart.unitPrice.toLocaleString()}원</div>
      </div>
    `;

    container.appendChild(card);
  });
}

// 10. Render Online Stores View
function renderOnlineStoresView(container) {
  let sortedStores = [...currentProduct.stores];

  if (onlineSort === 'fastest') {
    sortedStores.sort((a, b) => (a.deliverySpeedRank || 2) - (b.deliverySpeedRank || 2));
  } else {
    sortedStores.sort((a, b) => (a.price + (a.shippingFee || 0)) - (b.price + (b.shippingFee || 0)));
  }

  sortedStores.forEach((store, idx) => {
    const isTop = idx === 0;
    const total = store.price + (store.shippingFee || 0);

    const card = document.createElement('div');
    card.className = `p-3 rounded-2xl border transition flex items-center justify-between ${
      isTop ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100'
    }`;

    card.innerHTML = `
      <div class="space-y-0.5">
        <div class="flex items-center space-x-1.5">
          <span class="text-xs font-bold text-slate-900">${store.mall}</span>
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">${store.badge}</span>
        </div>
        <div class="text-[11px] text-slate-500">${store.deliveryText}</div>
      </div>

      <div class="text-right flex items-center space-x-2.5">
        <div>
          <div class="text-sm font-black text-slate-900">${total.toLocaleString()}<span class="text-xs font-normal">원</span></div>
          <div class="text-[10px] text-emerald-600 font-medium">무료배송</div>
        </div>
        <a href="${store.link}" target="_blank" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition">
          보기
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

// 11. Render Alternatives View
function renderAlternativesView(container) {
  const alts = currentProduct.alternatives || [];

  if (alts.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">등록된 가성비 대체재가 없습니다.</div>`;
    return;
  }

  alts.forEach(alt => {
    const card = document.createElement('div');
    card.className = "p-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex space-x-3 items-center";
    card.innerHTML = `
      <img src="${alt.image}" class="w-14 h-14 rounded-xl object-cover border border-slate-100 flex-shrink-0">
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-900 truncate">${alt.name}</span>
          <span class="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">${alt.badge}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">${alt.reason}</p>
        <div class="text-xs font-black text-slate-900 mt-1">${alt.price.toLocaleString()}원</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// 12. Camera Scanner Logic
function openScanner() {
  const modal = document.getElementById('cameraModal');
  modal.classList.remove('hidden');

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }

  const config = { fps: 15, qrbox: { width: 260, height: 160 }, aspectRatio: 1.333334 };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      playBeep();
      closeScanner();
      selectProductByKeyword(decodedText);
    },
    () => {}
  ).then(() => {
    isScannerRunning = true;
  }).catch(err => console.warn("Camera init:", err));
}

function closeScanner() {
  const modal = document.getElementById('cameraModal');
  modal.classList.add('hidden');

  if (html5QrCode && isScannerRunning) {
    html5QrCode.stop().then(() => {
      isScannerRunning = false;
    }).catch(err => console.error("Stop error:", err));
  }
}

// 13. Free Supabase DB Settings Modal
function toggleApiSettings() {
  const modal = document.getElementById('apiSettingsModal');
  modal.classList.toggle('hidden');
}

function loadApiSettings() {
  document.getElementById('cfgSupabaseUrl').value = localStorage.getItem('SUPABASE_URL') || '';
  document.getElementById('cfgSupabaseKey').value = localStorage.getItem('SUPABASE_ANON_KEY') || '';
}

function saveApiSettings() {
  const url = document.getElementById('cfgSupabaseUrl').value.trim();
  const key = document.getElementById('cfgSupabaseKey').value.trim();

  localStorage.setItem('SUPABASE_URL', url);
  localStorage.setItem('SUPABASE_ANON_KEY', key);

  SUPABASE_CONFIG.url = url;
  SUPABASE_CONFIG.anonKey = key;

  alert("무료 Supabase 클라우드 DB 설정이 저장되었습니다!");
  toggleApiSettings();
  loadFavorites();
}
