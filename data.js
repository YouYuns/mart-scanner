// 🛒 내 근처 마트 & 온라인 실시간 100g/단위당 정밀 가격 데이터베이스

const DEFAULT_NEIGHBORHOODS = [
  { id: "gangnam", name: "서울 강남구 (역삼/서초)", marts: ["이마트 역삼점", "트레이더스 위례점", "홈플러스 스페셜 강남", "롯데마트 서초점"] },
  { id: "songpa", name: "서울 송파구 (잠실/문정)", marts: ["롯데마트 제타플렉스 잠실", "트레이더스 송파점", "홈플러스 잠실점", "이마트 가든파이브"] },
  { id: "mapo", name: "서울 마포/영등포", marts: ["이마트 마포점", "홈플러스 영등포점", "코스트코 양평점", "트레이더스 영등포점"] },
  { id: "bundang", name: "경기 성남/분당", marts: ["이마트 분당점", "트레이더스 구성점", "홈플러스 야탑점", "롯데마트 판교점"] }
];

const PRODUCT_DATABASE = [
  {
    id: "prod_shin",
    barcode: "8801043014838",
    name: "농심 신라면",
    category: "라면/면류",
    image: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=600&auto=format&fit=crop&q=80",
    standardUnit: "100g당",
    baseGrams: 120, // 1봉지 120g
    // 내 근처 오프라인 마트 (소용량 vs 트레이더스 대용량 단가 정밀 비교)
    marts: [
      { 
        martName: "트레이더스 홀세일클럽", 
        packInfo: "20봉 대용량 박스", 
        totalPrice: 15120, 
        unitPrice: 630, // 100g당 630원 (1봉당 756원)
        isBulk: true,
        badge: "100g당 마트최저",
        rank: 1 
      },
      { 
        martName: "홈플러스", 
        packInfo: "5봉 멀티팩 (2팩 이상 행사)", 
        totalPrice: 4100, 
        unitPrice: 683, // 100g당 683원 (1봉당 820원)
        isBulk: false,
        badge: "행사중",
        rank: 2 
      },
      { 
        martName: "롯데마트", 
        packInfo: "5봉 멀티팩", 
        totalPrice: 4200, 
        unitPrice: 700, // 100g당 700원 (1봉당 840원)
        isBulk: false,
        badge: "정가",
        rank: 3 
      },
      { 
        martName: "이마트", 
        packInfo: "5봉 멀티팩", 
        totalPrice: 4380, 
        unitPrice: 730, // 100g당 730원 (1봉당 876원)
        isBulk: false,
        badge: "정가",
        rank: 4 
      }
    ],
    // 온라인 쇼핑몰 실시간
    stores: [
      { 
        mall: "네이버 도착보장", 
        packInfo: "5봉 멀티팩",
        totalPrice: 3500, 
        unitPrice: 583, // 100g당 583원
        deliveryText: "내일 도착 보장 (무료배송)", 
        badge: "⚡ 100g당 전체1위",
        link: "https://shopping.naver.com" 
      },
      { 
        mall: "쿠팡 로켓와우", 
        packInfo: "5봉 멀티팩",
        totalPrice: 3680, 
        unitPrice: 613, // 100g당 613원
        deliveryText: "내일 새벽 7시 전 도착", 
        badge: "🚀 새벽도착",
        link: "https://www.coupang.com" 
      },
      { 
        mall: "이마트몰 (쓱배송)", 
        packInfo: "5봉 멀티팩",
        totalPrice: 4380, 
        unitPrice: 730, 
        deliveryText: "오늘 오후 당일 배송", 
        badge: "🚚 당일도착",
        link: "https://www.ssg.com" 
      }
    ]
  },
  {
    id: "prod_hetbahn",
    barcode: "8801007052913",
    name: "CJ 햇반 백미 210g",
    category: "즉석밥/쌀",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    standardUnit: "1개당",
    baseGrams: 210,
    marts: [
      { 
        martName: "트레이더스 홀세일클럽", 
        packInfo: "24개입 대용량 박스", 
        totalPrice: 21900, 
        unitPrice: 912, // 개당 912원
        isBulk: true,
        badge: "개당 912원 (최저)",
        rank: 1 
      },
      { 
        martName: "홈플러스", 
        packInfo: "12개입 번들 (2박스 행사)", 
        totalPrice: 12800, 
        unitPrice: 1066, 
        isBulk: false,
        badge: "행사중",
        rank: 2 
      },
      { 
        martName: "이마트", 
        packInfo: "12개입 번들", 
        totalPrice: 15800, 
        unitPrice: 1316, 
        isBulk: false,
        badge: "정가",
        rank: 3 
      },
      { 
        martName: "롯데마트", 
        packInfo: "12개입 번들", 
        totalPrice: 15800, 
        unitPrice: 1316, 
        isBulk: false,
        badge: "정가",
        rank: 4 
      }
    ],
    stores: [
      { 
        mall: "네이버 도착보장", 
        packInfo: "12개입",
        totalPrice: 12100, 
        unitPrice: 1008, 
        deliveryText: "내일 도착 보장", 
        badge: "⚡ 최저가",
        link: "https://shopping.naver.com" 
      },
      { 
        mall: "쿠팡 로켓와우", 
        packInfo: "12개입",
        totalPrice: 12400, 
        unitPrice: 1033, 
        deliveryText: "내일 새벽 7시 도착", 
        badge: "🚀 새벽도착",
        link: "https://www.coupang.com" 
      }
    ]
  },
  {
    id: "prod_milk",
    barcode: "8801115114154",
    name: "서울우유 나100% 1000ml",
    category: "유제품/음료",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
    standardUnit: "100ml당",
    baseGrams: 1000,
    marts: [
      { 
        martName: "홈플러스", 
        packInfo: "2팩 묶음 기획팩 (2000ml)", 
        totalPrice: 5700, 
        unitPrice: 285, // 100ml당 285원
        isBulk: true,
        badge: "묶음할인",
        rank: 1 
      },
      { 
        martName: "이마트", 
        packInfo: "1L 팩 단품", 
        totalPrice: 2980, 
        unitPrice: 298, 
        isBulk: false,
        badge: "정가",
        rank: 2 
      },
      { 
        martName: "롯데마트", 
        packInfo: "1L 팩 단품", 
        totalPrice: 2980, 
        unitPrice: 298, 
        isBulk: false,
        badge: "정가",
        rank: 3 
      }
    ],
    stores: [
      { 
        mall: "이마트몰 (쓱배송)", 
        packInfo: "1L 팩",
        totalPrice: 2980, 
        unitPrice: 298, 
        deliveryText: "오늘 오후 당일 배송", 
        badge: "🚚 당일도착",
        link: "https://www.ssg.com" 
      },
      { 
        mall: "쿠팡 로켓프레시", 
        packInfo: "2팩 묶음 (2L)",
        totalPrice: 6180, 
        unitPrice: 309, 
        deliveryText: "내일 새벽 7시 전 도착", 
        badge: "🚀 프레시",
        link: "https://www.coupang.com" 
      }
    ]
  }
];
