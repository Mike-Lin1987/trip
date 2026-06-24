import type {
  BestTimeEntry,
  HighlightCard,
  OnsenStay,
  PlanCard,
  RestSpot,
  RouteStop,
  TransportComfort,
} from "@/types/trip";

export const heroImage = "/images/yamanaka-onsen.webp";

export const highlightCards: HighlightCard[] = [
  {
    title: "京都夜楓",
    subtitle: "Optional",
    description: "清水寺、永觀堂、叡山電鐵都列為可選，不硬塞進必走行程。",
  },
  {
    title: "金澤兼六園",
    subtitle: "庭園散策",
    description: "把金澤重點集中在兼六園與近江町市場，移動少、節奏穩。",
  },
  {
    title: "山中溫泉鶴仙溪",
    subtitle: "溪谷溫泉",
    description: "連泊溫泉飯店，保留真正休息時間，而不是每天換城市。",
  },
];

export const planCards: PlanCard[] = [
  {
    days: 5,
    title: "短假輕鬆版",
    bestFor: "只想京都加溫泉，不拉太遠的家庭。",
    rhythm: "每天 1 個主景點，夜楓全部 optional。",
    route: ["京都", "山中溫泉", "大阪"],
  },
  {
    days: 6,
    title: "平衡標準版",
    bestFor: "想保留金澤，但仍希望每天早點回飯店。",
    rhythm: "每天最多 2 個主景點，午後安排休息。",
    route: ["京都", "金澤", "山中溫泉", "大阪"],
  },
  {
    days: 8,
    title: "家族完整版",
    bestFor: "符合 2026 行程表，京都、金澤、溫泉與回程緩衝都保留。",
    rhythm: "交通與行李分流，山中溫泉連泊恢復體力。",
    route: ["關西機場", "京都", "金澤", "山中溫泉", "新大阪", "關西機場"],
  },
];

export const bestTimeEntries: BestTimeEntry[] = [
  {
    area: "京都",
    period: "11 月中旬到 12 月上旬",
    note: "夜楓名所人潮多，爸媽同行建議只挑一處 optional。",
  },
  {
    area: "金澤",
    period: "11 月中旬到 11 月下旬",
    note: "兼六園庭園動線可長可短，適合排在上午。",
  },
  {
    area: "山中溫泉",
    period: "11 月中旬到 11 月下旬",
    note: "溪谷色彩與溫泉連泊最搭，下午提早入住更舒服。",
  },
];

export const routeStops: RouteStop[] = [
  {
    label: "關西機場",
    area: "osaka",
    transport: "機場飯店",
    comfortNote: "第一晚不進市區，降低抵達日壓力。",
  },
  {
    label: "京都",
    area: "kyoto",
    transport: "Haruka + 計程車",
    comfortNote: "先寄放大行李，再開始寺院行程。",
  },
  {
    label: "金澤",
    area: "kanazawa",
    transport: "特急 + 新幹線",
    comfortNote: "京都行李先宅配到溫泉，金澤輕裝。",
  },
  {
    label: "山中溫泉",
    area: "yamanaka-onsen",
    transport: "加賀溫泉接駁",
    comfortNote: "連泊溫泉，安排溪谷短散步。",
  },
  {
    label: "新大阪",
    area: "osaka",
    transport: "北陸新幹線 + Thunderbird",
    comfortNote: "回程前住新大阪，整理行李並保留隔天機場緩衝。",
  },
  {
    label: "關西機場",
    area: "osaka",
    transport: "JR 或機場交通",
    comfortNote: "Day 8 只做機場移動與登機，不再增加市區景點。",
  },
];

export const restSpots: RestSpot[] = [
  {
    name: "京都飯店大廳",
    area: "kyoto",
    reason: "早上先寄放行李，必要時直接休息再出門。",
    bestTiming: "Day 2 上午",
  },
  {
    name: "嵐山湯豆腐午餐",
    area: "kyoto",
    reason: "把用餐當成正式休息，不再多排咖啡點。",
    bestTiming: "Day 3 中午",
  },
  {
    name: "山中溫泉 Kagari 吉祥亭",
    area: "yamanaka-onsen",
    reason: "Day 5 下午提早入住，讓溫泉住宿成為恢復體力的核心。",
    bestTiming: "Day 5 下午後",
  },
];

export const onsenStay: OnsenStay = {
  name: "山中溫泉 Kagari 吉祥亭",
  area: "yamanaka-onsen",
  comfortPoints: ["溪谷旁住宿", "連住兩晚", "晚餐與溫泉集中", "與宅配行李會合"],
};

export const transportComfortCards: TransportComfort[] = [
  {
    title: "計程車補位",
    icon: "taxi",
    description: "京都飯店、清水寺、兼六園周邊遇到坡道或人潮時，直接用車補位。",
  },
  {
    title: "行李宅配",
    icon: "luggage",
    description: "京都到山中溫泉採行李直送，金澤只帶一晚輕便用品。",
  },
  {
    title: "JR 劃位",
    icon: "train",
    description:
      "大件行李宅配優先，若帶上車請依 JR-WEST 官方最新規則確認。",
  },
  {
    title: "早回飯店",
    icon: "seat",
    description: "夜楓一律 optional，每天晚上保留休息與泡湯空間。",
  },
];
