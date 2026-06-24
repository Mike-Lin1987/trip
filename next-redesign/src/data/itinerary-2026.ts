import type {
  DailyPlanVariant,
  Destination,
  ItineraryDay,
  OptionalNightView,
  PaceMode,
  SeniorFriendlyInfo,
} from "@/types/trip";

export const DEFAULT_PACE_MODE: PaceMode = "relaxed";

export const seniorProfiles = {
  veryEasy: {
    walkingLoad: "low",
    stairs: "none",
    stayMinutes: 45,
    hasRestSpots: true,
    seniorFriendly: true,
    taxiRecommended: false,
  },
  easyTaxi: {
    walkingLoad: "low",
    stairs: "few",
    stayMinutes: 60,
    hasRestSpots: true,
    seniorFriendly: true,
    taxiRecommended: true,
  },
  medium: {
    walkingLoad: "medium",
    stairs: "some",
    stayMinutes: 75,
    hasRestSpots: true,
    seniorFriendly: true,
    taxiRecommended: true,
  },
  activeOptional: {
    walkingLoad: "high",
    stairs: "many",
    stayMinutes: 60,
    hasRestSpots: false,
    seniorFriendly: false,
    taxiRecommended: true,
  },
} satisfies Record<string, SeniorFriendlyInfo>;

export const destinations: Destination[] = [
  {
    id: "toji",
    name: "東寺",
    area: "kyoto",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Toji%20Temple%20Kyoto",
    autumnStatus: "coloring",
    description: "抵達京都後的第一個慢節奏寺院，適合買御守、短暫散步。",
    highlights: ["五重塔", "御守採買", "平坦動線"],
    seniorInfo: seniorProfiles.veryEasy,
  },
  {
    id: "fushimi-inari",
    name: "伏見稻荷大社",
    area: "kyoto",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Fushimi%20Inari%20Taisha",
    autumnStatus: "coloring",
    description: "只走前段鳥居與本殿，避免攻頂，保留體力給晚上休息。",
    highlights: ["千本鳥居前段", "參拜抽籤", "車站近"],
    seniorInfo: seniorProfiles.medium,
  },
  {
    id: "sagano-train",
    name: "嵐山小火車",
    area: "kyoto",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Torokko%20Saga%20Station",
    autumnStatus: "peak",
    description: "用坐車方式看溪谷紅葉，降低步行負擔，是孝親紅葉主菜。",
    highlights: ["龜岡到嵐山", "溪谷紅葉", "需提前搶票"],
    seniorInfo: seniorProfiles.veryEasy,
  },
  {
    id: "jojakkoji",
    name: "常寂光寺",
    area: "kyoto",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Jojakkoji%20Temple%20Kyoto",
    autumnStatus: "peak",
    description: "楓色很美但有坡與階梯，列為標準版主景點，走不動可改茶屋休息。",
    highlights: ["紅葉名所", "多層次庭園", "可彈性縮短"],
    seniorInfo: seniorProfiles.medium,
  },
  {
    id: "kenrokuen",
    name: "兼六園",
    area: "kanazawa",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kenrokuen%20Kanazawa",
    autumnStatus: "peak",
    description: "金澤核心景點，庭園動線可長可短，適合放慢腳步拍照。",
    highlights: ["日本三名園", "庭園散策", "長輩友善節奏"],
    seniorInfo: seniorProfiles.easyTaxi,
  },
  {
    id: "omicho",
    name: "近江町市場",
    area: "kanazawa",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Omicho%20Market%20Kanazawa",
    autumnStatus: "coloring",
    description: "把午餐與採買合併，不另外拉長行程，減少移動次數。",
    highlights: ["海鮮午餐", "室內市場", "雨天友善"],
    seniorInfo: seniorProfiles.veryEasy,
  },
  {
    id: "kakusenkei",
    name: "山中溫泉鶴仙溪",
    area: "yamanaka-onsen",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kakusenkei%20Gorge%20Yamanaka%20Onsen",
    autumnStatus: "peak",
    description: "以溪畔短散步和溫泉住宿為主，不追景點，讓旅程真正慢下來。",
    highlights: ["溪谷紅葉", "溫泉住宿", "連泊放鬆"],
    seniorInfo: seniorProfiles.easyTaxi,
  },
];

const optionalNightViews: OptionalNightView[] = [
  {
    id: "eizan-maple-tunnel",
    title: "叡山電鐵紅葉隧道",
    location: "京都洛北",
    optional: true,
    reason: "坐車賞楓很舒服，但夜間溫度低，視長輩體力決定。",
    seniorInfo: seniorProfiles.easyTaxi,
  },
  {
    id: "kiyomizu-night",
    title: "清水寺夜楓",
    location: "東山",
    optional: true,
    reason: "夜景漂亮但坡道與人潮明顯，建議計程車接駁且不勉強。",
    seniorInfo: seniorProfiles.activeOptional,
  },
  {
    id: "eikando-night",
    title: "永觀堂夜楓",
    location: "京都岡崎",
    optional: true,
    reason: "紅葉密度高，但排隊與夜間步行負擔較高，適合深度版。",
    seniorInfo: seniorProfiles.medium,
  },
];

function createDailyPlans({
  standard,
  lowEnergy,
  rainy,
  walkingLoad,
  taxiAdvice,
  restStops,
  toiletCoffeeBackups,
  mustDo,
}: {
  standard: string;
  lowEnergy: string;
  rainy: string;
  walkingLoad: string;
  taxiAdvice: string;
  restStops: string[];
  toiletCoffeeBackups: string[];
  mustDo: string[];
}): ItineraryDay["plans"] {
  const common = {
    walkingLoad,
    taxiAdvice,
    restStops,
    toiletCoffeeBackups,
    mustDo,
  };

  return {
    standard: {
      label: "標準版",
      overview: standard,
      ...common,
    },
    lowEnergy: {
      label: "低體力版",
      overview: lowEnergy,
      ...common,
      walkingLoad: `${walkingLoad}；主動刪減一個點`,
    },
    rainy: {
      label: "雨天版",
      overview: rainy,
      ...common,
      taxiAdvice: `${taxiAdvice}；雨天優先用計程車或車站商場銜接。`,
    },
  } satisfies Record<string, DailyPlanVariant>;
}

export const itinerary2026: ItineraryDay[] = [
  {
    day: 1,
    date: "2026-11-14",
    weekday: "六",
    title: "關西機場會合，關西機場華盛頓酒店休息",
    city: "關西機場",
    todayStay: "關西機場華盛頓酒店",
    todayTransport: "抵達後直接前往關西機場華盛頓酒店",
    mustDo: ["全員會合", "確認網路可用", "隔天交通票券放在隨身包"],
    intensity: "easy",
    morning: [],
    afternoon: [
      {
        title: "台灣出發，南北家人在關西機場會合",
        type: "transport",
        isMainSpot: false,
        notes: ["高雄組 CI176 15:25 出發、19:10 抵達；台北組 CI172 14:20 出發、17:50 抵達。"],
      },
    ],
    evening: [
      {
        title: "直奔關西機場華盛頓酒店辦理入住",
        type: "hotel",
        isMainSpot: false,
        notes: ["晚抵達日不進大阪市區，降低長輩與行李壓力。"],
      },
    ],
    optionalNightViews: [],
    plans: createDailyPlans({
      standard: "全員會合後直接入住，附近補水與簡單晚餐即可。",
      lowEnergy: "若抵達時間落差大，先讓早到成員入住休息，不等待集體行動。",
      rainy: "全程室內銜接，機場與飯店之間優先搭接駁或計程車。",
      walkingLoad: "步行負擔：低，只有機場與飯店移動。",
      taxiAdvice: "計程車建議：若行李多或雨勢明顯，直接叫車。",
      restStops: ["機場到著大廳座位區", "關西機場華盛頓酒店大廳"],
      toiletCoffeeBackups: ["關西機場洗手間", "機場便利商店與咖啡店"],
      mustDo: ["全員會合", "確認隔天交通", "早點睡"],
    }),
  },
  {
    day: 2,
    date: "2026-11-15",
    weekday: "日",
    title: "京都慢啟動，東寺與伏見稻荷",
    city: "京都",
    todayStay: "京都三條索拉利亞西鐵尊貴酒店",
    todayTransport: "Haruka 到京都後，計程車銜接京都三條索拉利亞西鐵尊貴酒店寄放行李",
    mustDo: ["寄放大行李", "東寺御守", "伏見稻荷只走前段"],
    intensity: "moderate",
    morning: [
      {
        title: "早班 Haruka 前往京都，計程車到京都三條索拉利亞西鐵尊貴酒店寄放行李",
        type: "transport",
        isMainSpot: false,
        notes: ["先放大行李，再開始行程。"],
      },
      {
        title: "東寺採買御守",
        type: "sightseeing",
        isMainSpot: true,
        seniorInfo: seniorProfiles.veryEasy,
      },
    ],
    afternoon: [
      {
        title: "伏見稻荷本殿與千本鳥居前段",
        type: "sightseeing",
        isMainSpot: true,
        seniorInfo: seniorProfiles.medium,
        notes: ["不攻頂，走到覺得舒服就折返。"],
      },
      {
        title: "出町柳周邊晚餐前休息",
        type: "rest",
        isMainSpot: false,
      },
    ],
    evening: [
      {
        title: "晚餐後回京都三條索拉利亞西鐵尊貴酒店或視體力加選夜楓",
        type: "meal",
        isMainSpot: false,
      },
    ],
    optionalNightViews: optionalNightViews.slice(0, 2),
    plans: createDailyPlans({
      standard: "東寺加伏見稻荷前段，晚上只保留 optional 夜楓。",
      lowEnergy: "只走東寺與飯店周邊，伏見稻荷改到車站商場休息。",
      rainy: "東寺短停後改京都車站或三條商店街，不排戶外鳥居長走。",
      walkingLoad: "步行負擔：中，伏見稻荷前段需控制折返點。",
      taxiAdvice: "計程車建議：京都車站到飯店、東山坡道可直接補位。",
      restStops: ["京都三條索拉利亞西鐵尊貴酒店大廳", "東寺休憩區", "三條周邊咖啡店"],
      toiletCoffeeBackups: ["京都車站", "東寺周邊商店", "三條商店街"],
      mustDo: ["寄放行李", "買御守", "不要攻頂"],
    }),
  },
  {
    day: 3,
    date: "2026-11-16",
    weekday: "一",
    title: "嵐山小火車與常寂光寺",
    city: "京都嵐山",
    todayStay: "京都三條索拉利亞西鐵尊貴酒店",
    todayTransport: "京都市區往返嵐山，小火車為主景點",
    mustDo: ["嵐山小火車", "午餐休息拉長", "常寂光寺視體力縮短"],
    intensity: "moderate",
    morning: [
      {
        title: "嵐山小火車：龜岡往嵐山方向",
        type: "sightseeing",
        isMainSpot: true,
        seniorInfo: seniorProfiles.veryEasy,
        notes: ["10/16 09:00 台灣時間搶票。"],
      },
    ],
    afternoon: [
      {
        title: "天龍寺周邊湯豆腐午餐與休息",
        type: "meal",
        isMainSpot: false,
      },
      {
        title: "常寂光寺紅葉散策",
        type: "sightseeing",
        isMainSpot: true,
        seniorInfo: seniorProfiles.medium,
      },
    ],
    evening: [
      {
        title: "回京都市區休息，夜楓僅作備案",
        type: "rest",
        isMainSpot: false,
      },
    ],
    optionalNightViews: optionalNightViews.slice(2),
    plans: createDailyPlans({
      standard: "小火車加常寂光寺，午餐當正式休息點。",
      lowEnergy: "保留小火車，常寂光寺改竹林或車站周邊短散步。",
      rainy: "小火車照常可行；午後改嵐山車站、商店街與咖啡休息。",
      walkingLoad: "步行負擔：中，常寂光寺有坡與階梯。",
      taxiAdvice: "計程車建議：回程若疲累，嵐山到京都三條索拉利亞西鐵尊貴酒店可直接叫車。",
      restStops: ["小火車車站", "湯豆腐午餐店", "嵐山咖啡店"],
      toiletCoffeeBackups: ["嵐山站", "天龍寺周邊", "嵯峨嵐山站"],
      mustDo: ["小火車票券", "午餐休息", "傍晚前回城"],
    }),
  },
  {
    day: 4,
    date: "2026-11-17",
    weekday: "二",
    title: "大行李寄溫泉，輕裝前往金澤",
    city: "京都到金澤",
    todayStay: "金澤日航酒店",
    todayTransport: "Thunderbird 京都/大阪方向 → 敦賀 + 北陸新幹線 敦賀 → 金澤",
    mustDo: ["大行李宅配", "敦賀轉乘抓寬", "金澤只排短散步"],
    intensity: "easy",
    morning: [
      {
        title: "京都三條索拉利亞西鐵尊貴酒店退房，大行李宅配到山中溫泉",
        type: "luggage",
        isMainSpot: false,
        notes: ["只帶一日輕便換洗衣物前往金澤。"],
      },
    ],
    afternoon: [
      {
        title: "Thunderbird 京都/大阪方向 → 敦賀，北陸新幹線 敦賀 → 金澤",
        type: "transport",
        isMainSpot: false,
      },
      {
        title: "金澤市區短散步",
        type: "sightseeing",
        isMainSpot: true,
        seniorInfo: seniorProfiles.veryEasy,
      },
    ],
    evening: [
      {
        title: "入住金澤日航酒店，早點休息",
        type: "hotel",
        isMainSpot: false,
      },
    ],
    optionalNightViews: [],
    luggageNotes: ["此夜大行李不在身邊，需預留盥洗與保暖用品。"],
    plans: createDailyPlans({
      standard: "完成宅配後輕裝移動到金澤，下午只做車站周邊短散步。",
      lowEnergy: "抵達金澤後直接入住，晚餐在車站或金澤日航酒店周邊解決。",
      rainy: "金澤戶外散步取消，改車站商場與咖啡休息。",
      walkingLoad: "步行負擔：低到中，主要壓力是轉乘與行李。",
      taxiAdvice: "計程車建議：金澤站到金澤日航酒店若下雨或疲累就叫車。",
      restStops: ["京都三條索拉利亞西鐵尊貴酒店大廳", "敦賀站候車區", "金澤站商場"],
      toiletCoffeeBackups: ["京都站", "敦賀站", "金澤站"],
      mustDo: ["宅配行李", "確認轉乘月台", "保留晚間休息"],
    }),
  },
  {
    day: 5,
    date: "2026-11-18",
    weekday: "三",
    title: "兼六園、近江町市場，午後進溫泉",
    city: "金澤到山中溫泉",
    todayStay: "山中溫泉 Kagari 吉祥亭",
    todayTransport: "金澤市區短移動後往加賀溫泉方向",
    mustDo: ["兼六園上午走", "近江町市場午餐", "提早進溫泉"],
    intensity: "moderate",
    morning: [
      {
        title: "兼六園紅葉庭園散策",
        type: "sightseeing",
        isMainSpot: true,
        seniorInfo: seniorProfiles.easyTaxi,
      },
    ],
    afternoon: [
      {
        title: "近江町市場海鮮午餐",
        type: "sightseeing",
        isMainSpot: true,
        seniorInfo: seniorProfiles.veryEasy,
      },
      {
        title: "提早前往山中溫泉 Kagari 吉祥亭 Check-in",
        type: "onsen",
        isMainSpot: false,
        notes: ["與宅配大行李會合。"],
      },
    ],
    evening: [
      {
        title: "溫泉晚餐與休息，停止追景點",
        type: "onsen",
        isMainSpot: false,
      },
    ],
    optionalNightViews: [],
    plans: createDailyPlans({
      standard: "兼六園加近江町市場，下午提早到山中溫泉。",
      lowEnergy: "只走兼六園短路線，午餐後直接進山中溫泉 Kagari 吉祥亭。",
      rainy: "兼六園縮短，近江町市場作為室內午餐與採買重點。",
      walkingLoad: "步行負擔：中，兼六園可依體力縮短。",
      taxiAdvice: "計程車建議：金澤市區移動與加賀溫泉到山中溫泉 Kagari 吉祥亭都可補位。",
      restStops: ["兼六園茶店", "近江町市場座位區", "山中溫泉 Kagari 吉祥亭大廳"],
      toiletCoffeeBackups: ["兼六園周邊", "近江町市場", "加賀溫泉站"],
      mustDo: ["上午賞園", "午餐補體力", "泡湯休息"],
    }),
  },
  {
    day: 6,
    date: "2026-11-19",
    weekday: "四",
    title: "山中溫泉連泊，鶴仙溪慢散步",
    city: "山中溫泉",
    todayStay: "山中溫泉 Kagari 吉祥亭",
    todayTransport: "山中溫泉 Kagari 吉祥亭周邊步行或短程計程車",
    mustDo: ["晚起早餐", "鶴仙溪短散步", "第二晚泡湯"],
    intensity: "easy",
    morning: [
      {
        title: "晚起早餐，溫泉街慢慢開始",
        type: "rest",
        isMainSpot: false,
      },
    ],
    afternoon: [
      {
        title: "鶴仙溪溪畔短散步",
        type: "sightseeing",
        isMainSpot: true,
        seniorInfo: seniorProfiles.easyTaxi,
      },
    ],
    evening: [
      {
        title: "連住山中溫泉 Kagari 吉祥亭第二晚",
        type: "onsen",
        isMainSpot: false,
      },
    ],
    optionalNightViews: [],
    plans: createDailyPlans({
      standard: "鶴仙溪短散步加溫泉街，保留大量旅館休息。",
      lowEnergy: "只在山中溫泉 Kagari 吉祥亭內休息泡湯，傍晚看體力再出門。",
      rainy: "取消溪谷步道，改山中溫泉 Kagari 吉祥亭內泡湯、咖啡與紀念品整理。",
      walkingLoad: "步行負擔：低，溪谷段可隨時折返。",
      taxiAdvice: "計程車建議：若要到較遠店家用餐，直接叫短程車。",
      restStops: ["山中溫泉 Kagari 吉祥亭大廳", "溫泉街茶店", "鶴仙溪周邊座位"],
      toiletCoffeeBackups: ["山中溫泉 Kagari 吉祥亭", "溫泉街公共設施", "咖啡店"],
      mustDo: ["睡飽", "短散步", "泡湯"],
    }),
  },
  {
    day: 7,
    date: "2026-11-20",
    weekday: "五",
    title: "溫泉退房，帶大行李回大阪",
    city: "山中溫泉到大阪",
    todayStay: "karaksa hotel grande 新大阪 Tower",
    todayTransport: "加賀溫泉 → 敦賀：北陸新幹線；敦賀 → 新大阪：Thunderbird",
    mustDo: ["退房不要趕", "敦賀轉乘", "新大阪整理行李"],
    intensity: "easy",
    morning: [
      {
        title: "山中溫泉退房，前往加賀溫泉站",
        type: "transport",
        isMainSpot: false,
      },
    ],
    afternoon: [
      {
        title: "加賀溫泉 → 敦賀：北陸新幹線；敦賀 → 新大阪：Thunderbird",
        type: "transport",
        isMainSpot: false,
        notes: ["大件行李宅配優先，若帶上車請依 JR-WEST 官方最新規則確認。"],
      },
    ],
    evening: [
      {
        title: "入住 karaksa hotel grande 新大阪 Tower，回程前整理行李",
        type: "hotel",
        isMainSpot: false,
      },
    ],
    optionalNightViews: [],
    luggageNotes: ["回程大行李移動日，不再安排主要景點。"],
    plans: createDailyPlans({
      standard: "慢慢退房後回新大阪，晚間只整理行李。",
      lowEnergy: "抵達新大阪後直接入住，不安排購物或市區移動。",
      rainy: "全日以車站與 karaksa hotel grande 新大阪 Tower 為主，避免拖行李走戶外。",
      walkingLoad: "步行負擔：中，重點是大行李與轉乘。",
      taxiAdvice: "計程車建議：山中溫泉 Kagari 吉祥亭到加賀溫泉站、新大阪站周邊可補位。",
      restStops: ["加賀溫泉站", "敦賀站候車區", "新大阪站咖啡店"],
      toiletCoffeeBackups: ["加賀溫泉站", "敦賀站", "新大阪站"],
      mustDo: ["確認行李", "敦賀轉乘抓寬", "回程前打包"],
    }),
  },
  {
    day: 8,
    date: "2026-11-21",
    weekday: "六",
    title: "新大阪到關西機場，回台灣",
    city: "新大阪到關西機場",
    todayStay: "返台日，不再住宿",
    todayTransport: "新大阪 → 關西機場 → 回台灣",
    mustDo: ["退房前清點證件", "提早到機場", "伴手禮與行李重量確認"],
    intensity: "easy",
    morning: [
      {
        title: "karaksa hotel grande 新大阪 Tower 退房，行李集中整理",
        type: "luggage",
        isMainSpot: false,
        notes: ["先確認護照、票券、充電線與藥品都在隨身包。"],
      },
    ],
    afternoon: [
      {
        title: "新大阪前往關西機場，預留機場緩衝",
        type: "transport",
        isMainSpot: false,
        notes: ["高雄組 CI177 20:10 起飛、22:45 抵達；台北組 CI173 19:00 起飛、21:15 抵達。"],
      },
    ],
    evening: [
      {
        title: "關西機場辦理登機，回台灣",
        type: "transport",
        isMainSpot: false,
      },
    ],
    optionalNightViews: [],
    luggageNotes: ["最後一天以機場移動與登機緩衝為主，不新增市區景點。"],
    plans: createDailyPlans({
      standard: "退房後直接往機場，提早完成報到與托運。",
      lowEnergy: "早餐後留在 karaksa hotel grande 新大阪 Tower 休息，到時間再直接去機場。",
      rainy: "全程走車站與機場室內動線，避免臨時購物加重行李。",
      walkingLoad: "步行負擔：低到中，機場內距離需抓寬。",
      taxiAdvice: "計程車建議：若行李太多，karaksa hotel grande 新大阪 Tower 到新大阪站可叫車。",
      restStops: ["新大阪站", "關西機場候機區", "登機口附近座位"],
      toiletCoffeeBackups: ["新大阪站", "關西機場出境前後", "候機區咖啡店"],
      mustDo: ["護照確認", "提早到機場", "行李重量確認"],
    }),
  },
];
