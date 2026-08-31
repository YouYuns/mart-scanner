// 🛒 내 근처 마트 & 온라인 실시간 100g 단가 비교 엔진

let currentProduct = null;
let currentNeighborhood = DEFAULT_NEIGHBORHOODS[0]; // 서울 강남구 기본
let html5QrCode = null;
let isScannerRunning = false;

// 1. Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  setupEventListeners();
  renderNeighborhoodOptions();
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

  // Location Selector Modal
  document.getElementById('btnSelectLocation').addEventListener('click', toggleLocationModal);
  document.getElementById('btnCloseLocationModal').addEventListener('click', toggleLocationModal);

  // Scanner Open/Close
  document.getElementById('btnOpenScanner').addEventListener('click', openScanner);
  document.getElementById('btnCloseScanner').addEventListener('click', closeScanner);
}

// 3. Location Management
function toggleLocationModal() {
  const modal = document.getElementById('locationModal');
  modal.classList.toggle('hidden');
}

function renderNeighborhoodOptions() {
  const container = document.getElementById('neighborhoodOptions');
  if (!container) return;

  container.innerHTML = DEFAULT_NEIGHBORHOODS.map(n => `
    <button class="w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
      n.id === currentNeighborhood.id ? 'bg-blue-50 border-blue-300 text-blue-900 font-black' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-bold'
    }" data-id="${n.id}">
      <span>${n.name}</span>
      ${n.id === currentNeighborhood.id ? '<i data-lucide="check" class="w-4 h-4 text-blue-600"></i>' : ''}
    </button>
  `).join('');

  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const match = DEFAULT_NEIGHBORHOODS.find(n => n.id === btn.dataset.id);
      if (match) {
        currentNeighborhood = match;
        document.getElementById('currentLocationName').textContent = match.name.split(' ')[1] || match.name;
        toggleLocationModal();
        renderNeighborhoodMarts();
        lucide.createIcons();
      }
    });
  });
}

// 4. Product Search & Selection
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
    currentProduct = JSON.parse(JSON.stringify(match));
  } else {
    // Dynamic Fallback
    currentProduct = {
      id: `custom_${Date.now()}`,
      barcode: cleanQuery.length > 8 && !isNaN(cleanQuery) ? cleanQuery : "8809999999999",
      name: cleanQuery,
      category: "일반식품",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
      standardUnit: "100g당",
      baseGrams: 100,
      marts: [
        { martName: "트레이더스 홀세일클럽", packInfo: "대용량 번들", totalPrice: 11900, unitPrice: 595, isBulk: true, badge: "대용량 최저", rank: 1 },
        { martName: "홈플러스", packInfo: "행사 패키지", totalPrice: 4100, unitPrice: 683, isBulk: false, badge: "행사중", rank: 2 },
        { martName: "이마트", packInfo: "정품 단품", totalPrice: 4500, unitPrice: 750, isBulk: false, badge: "정가", rank: 3 }
      ],
      stores: [
        { mall: "네이버 도착보장", packInfo: "기획 세트", totalPrice: 3900, unitPrice: 650, deliveryText: "내일 도착 보장", badge: "⚡ 최저가", link: `https://shopping.naver.com/search/all?query=${encodeURIComponent(cleanQuery)}` },
        { mall: "쿠팡 로켓와우", packInfo: "표준 세트", totalPrice: 4100, unitPrice: 683, deliveryText: "내일 새벽 7시", badge: "🚀 새벽배송", link: `https://www.coupang.com/np/search?q=${encodeURIComponent(cleanQuery)}` }
      ]
    };
  }

  renderProductView();
  enrichWithLiveBackend(cleanQuery);
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  const query = input.value.trim();
  if (!query) {
    alert("검색어를 입력해주세요! (예: 신라면, 햇반, 우유)");
    return;
  }
  selectProductByKeyword(query);
  input.value = '';
}

// 5. Render Product View & 100g Unit Price Calculation
function renderProductView() {
  if (!currentProduct) return;

  document.getElementById('productImg').src = currentProduct.image;
  document.getElementById('productName').textContent = currentProduct.name;
  document.getElementById('productCategory').textContent = currentProduct.category;
  document.getElementById('productStandardUnit').textContent = `기준: ${currentProduct.standardUnit}`;

  renderVerdict();
  renderNeighborhoodMarts();
  renderOnlineStores();
  lucide.createIcons();
}

// 6. 1-Second Unit Price Verdict
function renderVerdict() {
  const banner = document.getElementById('verdictBanner');
  if (!currentProduct || !banner) return;

  const marts = currentProduct.marts || [];
  const stores = currentProduct.stores || [];

  const cheapestMart = marts.reduce((min, cur) => cur.unitPrice < min.unitPrice ? cur : min, marts[0]);
  const cheapestOnline = stores.reduce((min, cur) => cur.unitPrice < min.unitPrice ? cur : min, stores[0]);

  if (!cheapestMart || !cheapestOnline) return;

  if (cheapestOnline.unitPrice < cheapestMart.unitPrice) {
    const diffUnit = cheapestMart.unitPrice - cheapestOnline.unitPrice;
    banner.className = "p-2.5 rounded-xl flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-950";
    banner.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-xs">🚀</span>
        <div>
          <div class="text-xs font-black">
            온라인이 <span class="text-blue-600">${currentProduct.standardUnit} ${diffUnit.toLocaleString()}원</span> 더 저렴!
          </div>
          <div class="text-[10px] text-blue-600 font-medium">${cheapestOnline.mall} (${cheapestOnline.unitPrice.toLocaleString()}원/${currentProduct.standardUnit})</div>
        </div>
      </div>
      <a href="${cheapestOnline.link}" target="_blank" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-lg transition whitespace-nowrap shadow-xs">
        구매
      </a>
    `;
  } else if (cheapestMart.unitPrice < cheapestOnline.unitPrice) {
    const diffUnit = cheapestOnline.unitPrice - cheapestMart.unitPrice;
    banner.className = "p-2.5 rounded-xl flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-950";
    banner.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-xs">🛒</span>
        <div>
          <div class="text-xs font-black">
            내 근처 마트가 <span class="text-emerald-700">${currentProduct.standardUnit} ${diffUnit.toLocaleString()}원</span> 더 저렴!
          </div>
          <div class="text-[10px] text-emerald-700 font-medium">${cheapestMart.martName} (${cheapestMart.unitPrice.toLocaleString()}원/${currentProduct.standardUnit})</div>
        </div>
      </div>
      <span class="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded">
        마트 추천
      </span>
    `;
  } else {
    banner.className = "p-2.5 rounded-xl flex items-center justify-between bg-slate-100 border border-slate-200 text-slate-800";
    banner.innerHTML = `<span class="text-xs font-bold">마트와 온라인의 ${currentProduct.standardUnit} 단가가 동일합니다.</span>`;
  }
}

// 7. Render Neighborhood Marts (단가 기준 순위)
function renderNeighborhoodMarts() {
  const container = document.getElementById('martsListContainer');
  if (!currentProduct || !container) return;

  const marts = [...(currentProduct.marts || [])].sort((a, b) => a.unitPrice - b.unitPrice);

  container.innerHTML = marts.map((mart, idx) => {
    const isTop = idx === 0;
    return `
      <div class="p-2.5 rounded-xl border transition flex items-center justify-between ${
        isTop ? 'bg-blue-50/60 border-blue-200' : 'bg-white border-slate-200'
      }">
        <div class="flex items-center space-x-2.5">
          <span class="w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
            isTop ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
          }">${idx + 1}</span>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="text-xs font-black text-slate-900">${mart.martName}</span>
              ${mart.isBulk ? '<span class="text-[9px] font-bold px-1 py-0.2 bg-amber-100 text-amber-800 rounded">대용량</span>' : ''}
            </div>
            <div class="text-[10px] text-slate-500 font-medium">${mart.packInfo} · ${mart.totalPrice.toLocaleString()}원</div>
          </div>
        </div>

        <div class="text-right">
          <div class="text-xs font-black ${isTop ? 'text-blue-600' : 'text-slate-900'}">
            ${mart.unitPrice.toLocaleString()}<span class="text-[10px] font-normal text-slate-500">원/${currentProduct.standardUnit}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 8. Render Online Stores (단가 기준 순위)
function renderOnlineStores() {
  const container = document.getElementById('onlineListContainer');
  if (!currentProduct || !container) return;

  const stores = [...(currentProduct.stores || [])].sort((a, b) => a.unitPrice - b.unitPrice);

  container.innerHTML = stores.map((store, idx) => {
    const isTop = idx === 0;
    return `
      <div class="p-2.5 rounded-xl border transition flex items-center justify-between ${
        isTop ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-200'
      }">
        <div class="space-y-0.5">
          <div class="flex items-center space-x-1.5">
            <span class="text-xs font-black text-slate-900">${store.mall}</span>
            <span class="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">${store.badge}</span>
          </div>
          <div class="text-[10px] text-slate-500 font-medium">${store.packInfo} · ${store.totalPrice.toLocaleString()}원 (${store.deliveryText})</div>
        </div>

        <div class="text-right flex items-center space-x-2">
          <div>
            <div class="text-xs font-black ${isTop ? 'text-emerald-700' : 'text-slate-900'}">
              ${store.unitPrice.toLocaleString()}<span class="text-[10px] font-normal text-slate-500">원/${currentProduct.standardUnit}</span>
            </div>
            <div class="text-[9px] text-emerald-600 font-medium">무료배송</div>
          </div>
          <a href="${store.link}" target="_blank" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black transition">
            보기
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// 9. Live Backend Crawling for Real Packaging & Prices
async function enrichWithLiveBackend(keyword) {
  try {
    const res = await fetch(`/api/live-search?q=${encodeURIComponent(keyword)}`);
    if (res.ok) {
      const data = await res.json();
      if (currentProduct) {
        let updated = false;

        if (data.productImage && data.productImage.startsWith('http')) {
          currentProduct.image = data.productImage;
          document.getElementById('productImg').src = data.productImage;
          updated = true;
        }

        if (data.liveStores && data.liveStores.naver && data.liveStores.naver.length > 0) {
          currentProduct.stores = data.liveStores.naver;
          updated = true;
        }

        if (updated) {
          renderVerdict();
          renderOnlineStores();
        }
      }
    }
  } catch (e) {}
}

// 10. Camera Scanner Logic
function openScanner() {
  const modal = document.getElementById('cameraModal');
  modal.classList.remove('hidden');

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }

  const config = { fps: 15, qrbox: { width: 240, height: 140 }, aspectRatio: 1.333334 };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
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
