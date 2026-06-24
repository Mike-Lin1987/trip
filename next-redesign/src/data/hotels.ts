import type { HotelStay } from "@/types/trip";

export const hotelStays: HotelStay[] = [
  {
    id: "kansai-airport-washington",
    stayDates: "11/14（六）",
    dayRange: "Day 1",
    name: "關西機場華盛頓酒店",
    englishName: "Kansai Airport Washington Hotel",
    image: "/images/trip-assets/kansai-airport-washington-hotel.webp",
    imageAlt: "關西機場華盛頓酒店 介紹照片",
    city: "關西機場・臨空城",
    area: "osaka",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Kansai%20Airport%20Washington%20Hotel",
    accessNote: "步行至臨空城站約 3 分鐘，飯店提供免費機場送機大巴。",
    familyFriendlyNote:
      "抵達日不進大阪市區，先在機場旁睡一晚，隔天再舒服往京都移動。",
    features: [
      "適合晚班機抵達後直接休息",
      "2 樓有 24 小時全家超商",
      "對面有大型藥妝店與超市",
    ],
    seniorNotes: ["減少抵達日拖行李時間", "隔天再安排 JR 移動，節奏比較穩"],
    source: "飯店資訊整理與介紹",
  },
  {
    id: "solaria-kyoto-premier",
    stayDates: "11/15（日）- 11/16（一）",
    dayRange: "Day 2-3",
    name: "京都三條索拉利亞西鐵尊貴酒店",
    englishName: "Solaria Nishitetsu Hotel Kyoto Premier",
    image: "/images/trip-assets/solaria-nishitetsu-hotel-kyoto-premier.webp",
    imageAlt: "京都三條索拉利亞西鐵尊貴酒店 介紹照片",
    city: "京都・三條鴨川",
    area: "kyoto",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Solaria%20Nishitetsu%20Hotel%20Kyoto%20Premier",
    accessNote: "步行至三條站或先斗町約 3 分鐘，覓食與回飯店都方便。",
    familyFriendlyNote:
      "緊鄰鴨川河畔，三人房收納設計佳，窗邊沙發茶几區適合長輩休息。",
    features: [
      "鴨川窗景安靜舒服",
      "三人房空間與收納表現好",
      "附設免費男女大浴場",
      "提供館內浴衣、木屐與提袋",
    ],
    seniorNotes: ["早晚可回飯店休息", "大浴場可作為京都段的恢復安排"],
    onsenHighlights: ["免費男女大浴場", "寺院散策後可回飯店泡湯休息"],
    source: "飯店資訊整理與介紹",
  },
  {
    id: "hotel-nikko-kanazawa",
    stayDates: "11/17（二）",
    dayRange: "Day 4",
    name: "金澤日航酒店",
    englishName: "Hotel Nikko Kanazawa",
    image: "/images/trip-assets/hotel-nikko-kanazawa.webp",
    imageAlt: "金澤日航酒店 介紹照片",
    city: "金澤・車站前",
    area: "kanazawa",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Hotel%20Nikko%20Kanazawa",
    accessNote: "金澤車站周邊住宿，適合隔天銜接加賀溫泉方向移動。",
    familyFriendlyNote:
      "房間皆在 17 樓以上，可俯瞰金澤車站鼓門，房間面積 30 平方米以上。",
    features: [
      "高樓層景觀佳",
      "大行李箱攤開後仍保留走道",
      "早餐種類多且精緻",
    ],
    seniorNotes: ["金澤只住一晚，選車站旁降低轉乘壓力", "早餐品質好，隔天不用急著外出覓食"],
    source: "飯店資訊整理與介紹",
  },
  {
    id: "kagari-kisshotei",
    stayDates: "11/18（三）- 11/19（四）",
    dayRange: "Day 5-6",
    name: "山中溫泉 Kagari 吉祥亭",
    englishName: "Kagari Kisshotei",
    image: "/images/trip-assets/kagari-kisshotei.webp",
    imageAlt: "山中溫泉 Kagari 吉祥亭 介紹照片",
    city: "山中溫泉・鶴仙溪",
    area: "yamanaka-onsen",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Kagari%20Kisshotei",
    accessNote: "可提前預約加賀溫泉站免費接送車，減少轉乘與步行負擔。",
    familyFriendlyNote:
      "緊鄰蟋蟀橋與鶴仙溪步道，一泊二食的炭火燒會席與加賀料理適合長輩。",
    features: [
      "連泊兩晚，讓旅程中段真正恢復體力",
      "溫泉街券可兌換免費冰淇淋",
      "大廳晚上提供免費牛乳、熱茶與咖啡",
      "溪谷散步與旅館休息可彈性切換",
    ],
    seniorNotes: ["下午提早入住，不再追加遠距離景點", "遇雨可直接留在旅館泡湯休息"],
    onsenHighlights: [
      "露天溫泉與房間皆能欣賞溪谷四季景緻。",
      "炭火燒會席與加賀料理可直接安排在旅館內。",
      "加賀溫泉站免費接送車適合孝親旅程。",
    ],
    source: "飯店資訊整理與介紹",
  },
  {
    id: "karaksa-shin-osaka",
    stayDates: "11/20（五）",
    dayRange: "Day 7",
    name: "karaksa hotel grande 新大阪 Tower",
    englishName: "karaksa hotel grande Shin-Osaka Tower",
    image: "/images/trip-assets/karaksa-hotel-grande-shin-osaka-tower.webp",
    imageAlt: "karaksa hotel grande 新大阪 Tower 介紹照片",
    city: "新大阪・車站周邊",
    area: "osaka",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=karaksa%20hotel%20grande%20Shin-Osaka%20Tower",
    accessNote: "新大阪站 4 號出口步行約 5 分鐘，銜接新幹線、JR、HARUKA 方便。",
    familyFriendlyNote:
      "適合回程前整理行李，多人房與連通房選擇多，衛浴乾濕分離。",
    features: [
      "西日本樞紐，回程交通壓力低",
      "有三人房與連通房選項",
      "電視可即時查看大浴場混雜狀況",
      "上廁所、淋浴、洗手可分流使用",
    ],
    seniorNotes: ["最後一晚住車站旁，隔天不用拖行李長距離移動", "適合把購物與行李整理集中在回程前"],
    onsenHighlights: ["館內大浴場可用電視確認混雜狀況，再避開尖峰時段。"],
    source: "飯店資訊整理與介紹",
  },
];
