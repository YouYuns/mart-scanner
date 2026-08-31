// 🛒 대한민국 대표 마트 및 온라인 실시간 정품 매장 유통 패키지 사진 & 가격 데이터베이스

const PRODUCT_DATABASE = [
  {
    id: "prod_shin",
    barcode: "8801043014838",
    name: "농심 신라면 (5개입 멀티팩)",
    category: "라면/면류",
    image: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=600&auto=format&fit=crop&q=80",
    standardSpec: "120g x 5개입 (총 600g)",
    unitType: "100g",
    offlineMartPrice: 4380,
    marts: [
      { martName: "이마트 트레이더스", badge: "최저가", price: 3780, unitPrice: 630, rank: 1, note: "대용량 환산" },
      { martName: "홈플러스", badge: "행사중", price: 4100, unitPrice: 683, rank: 2, note: "2개 이상 10%할인" },
      { martName: "롯데마트", badge: "정가", price: 4200, unitPrice: 700, rank: 3, note: "L.POINT 적립" },
      { martName: "이마트", badge: "정가", price: 4380, unitPrice: 730, rank: 4, note: "신세계포인트" },
      { martName: "롯데슈퍼", badge: "동네슈퍼", price: 4580, unitPrice: 763, rank: 5, note: "단품 위주" }
    ],
    stores: [
      { mall: "네이버 도착보장", badge: "⚡ 내일 도착", deliveryText: "내일(화) 도착 보장", price: 3500, shippingFee: 0, link: "https://shopping.naver.com", unitPrice: 583 },
      { mall: "쿠팡", badge: "🚀 로켓와우", deliveryText: "내일(화) 새벽 7시 도착", price: 3680, shippingFee: 0, link: "https://www.coupang.com", unitPrice: 613 },
      { mall: "이마트몰(SSG)", badge: "🚚 쓱배송", deliveryText: "오늘 오후 시간지정", price: 4380, shippingFee: 0, link: "https://www.ssg.com", unitPrice: 730 }
    ],
    alternatives: [
      { id: "alt_001", name: "오뚜기 열라면 (5개입)", badge: "32% 절약", price: 2980, reason: "신라면 대비 1,400원 저렴", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80" }
    ]
  },
  {
    id: "prod_hetbahn",
    barcode: "8801007052913",
    name: "CJ 햇반 백미 210g (12개입 번들)",
    category: "즉석밥/쌀",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    standardSpec: "210g x 12개입",
    unitType: "1개당",
    offlineMartPrice: 15800,
    marts: [
      { martName: "이마트 트레이더스", badge: "최저가", price: 11900, unitPrice: 991, rank: 1, note: "박스 특가" },
      { martName: "홈플러스", badge: "행사중", price: 12800, unitPrice: 1066, rank: 2, note: "햇반 2박스 추가할인" },
      { martName: "롯데마트", badge: "정가", price: 15800, unitPrice: 1316, rank: 3, note: "정상가" },
      { martName: "이마트", badge: "정가", price: 15800, unitPrice: 1316, rank: 4, note: "정상가" }
    ],
    stores: [
      { mall: "네이버 도착보장", badge: "⚡ 내일 도착", deliveryText: "내일 도착 보장", price: 12100, shippingFee: 0, link: "https://shopping.naver.com", unitPrice: 1008 },
      { mall: "쿠팡", badge: "🚀 로켓와우", deliveryText: "내일 새벽 7시 도착", price: 12400, shippingFee: 0, link: "https://www.coupang.com", unitPrice: 1033 }
    ],
    alternatives: [
      { id: "alt_003", name: "쿠팡 곰곰 우리쌀 밥 210g (12개)", badge: "40% 절약", price: 9480, reason: "개당 790원의 가성비 쌀밥", image: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&auto=format&fit=crop&q=80" }
    ]
  },
  {
    id: "prod_milk",
    barcode: "8801115114154",
    name: "서울우유 나100% 1000ml (1L 팩)",
    category: "유제품/음료",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
    standardSpec: "1000ml (1팩)",
    unitType: "100ml",
    offlineMartPrice: 2980,
    marts: [
      { martName: "홈플러스", badge: "묶음할인", price: 2850, unitPrice: 285, rank: 1, note: "2팩 5,700원" },
      { martName: "이마트", badge: "정가", price: 2980, unitPrice: 298, rank: 2, note: "정상가" },
      { martName: "롯데마트", badge: "정가", price: 2980, unitPrice: 298, rank: 3, note: "정상가" },
      { martName: "롯데슈퍼", badge: "동네슈퍼", price: 3150, unitPrice: 315, rank: 4, note: "정상가" }
    ],
    stores: [
      { mall: "이마트몰(SSG)", badge: "🚚 쓱배송", deliveryText: "오늘 오후 배송", price: 2980, shippingFee: 0, link: "https://www.ssg.com", unitPrice: 298 },
      { mall: "쿠팡", badge: "🚀 로켓프레시", deliveryText: "내일 새벽 도착 (2팩)", price: 6180, shippingFee: 0, link: "https://www.coupang.com", unitPrice: 309 }
    ],
    alternatives: []
  },
  {
    id: "prod_spam",
    barcode: "8801007038108",
    name: "CJ 스팸 클래식 340g x 3개입 세트",
    category: "통조림/육가공",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    standardSpec: "340g x 3캔 (1020g)",
    unitType: "100g",
    offlineMartPrice: 17800,
    marts: [
      { martName: "이마트 트레이더스", badge: "최저가", price: 14500, unitPrice: 1421, rank: 1, note: "대용량 번들" },
      { martName: "홈플러스", badge: "행사중", price: 15900, unitPrice: 1558, rank: 2, note: "CJ 브랜드전" },
      { martName: "이마트", badge: "정가", price: 17800, unitPrice: 1745, rank: 3, note: "정상가" },
      { martName: "롯데마트", badge: "정가", price: 17800, unitPrice: 1745, rank: 4, note: "정상가" }
    ],
    stores: [
      { mall: "네이버 도착보장", badge: "⚡ 도착보장", deliveryText: "내일 도착", price: 12500, shippingFee: 0, link: "https://shopping.naver.com", unitPrice: 1225 },
      { mall: "쿠팡", badge: "🚀 로켓와우", deliveryText: "내일 새벽 도착", price: 12900, shippingFee: 0, link: "https://www.coupang.com", unitPrice: 1264 }
    ],
    alternatives: []
  }
];
