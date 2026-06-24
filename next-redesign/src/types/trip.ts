export type PaceMode = "relaxed" | "standard" | "deep";

export type Area = "kyoto" | "kanazawa" | "yamanaka-onsen" | "osaka";

export type WalkingLoad = "low" | "medium" | "high";

export type StairLevel = "none" | "few" | "some" | "many";

export type AutumnStatus = "peak" | "coloring" | "early" | "late";

export type Intensity = "easy" | "moderate" | "active";

export type TimeBlockType =
  | "transport"
  | "sightseeing"
  | "meal"
  | "rest"
  | "onsen"
  | "hotel"
  | "luggage";

export type ChecklistCategory =
  | "system"
  | "tickets"
  | "hotel"
  | "packing"
  | "luggage";

export type SeniorFriendlyInfo = {
  walkingLoad: WalkingLoad;
  stairs: StairLevel;
  stayMinutes: number;
  hasRestSpots: boolean;
  seniorFriendly: boolean;
  taxiRecommended: boolean;
};

export type Destination = {
  id: string;
  name: string;
  area: Area;
  mapUrl: string;
  autumnStatus: AutumnStatus;
  description: string;
  highlights: string[];
  seniorInfo: SeniorFriendlyInfo;
};

export type TimeBlock = {
  title: string;
  type: TimeBlockType;
  isMainSpot: boolean;
  seniorInfo?: SeniorFriendlyInfo;
  notes?: string[];
};

export type OptionalNightView = {
  id: string;
  title: string;
  location: string;
  optional: true;
  reason: string;
  seniorInfo: SeniorFriendlyInfo;
};

export type ItineraryDay = {
  day: number;
  date: string;
  weekday: string;
  title: string;
  city: string;
  todayStay: string;
  todayTransport: string;
  mustDo: string[];
  intensity: Intensity;
  morning: TimeBlock[];
  afternoon: TimeBlock[];
  evening: TimeBlock[];
  optionalNightViews: OptionalNightView[];
  luggageNotes?: string[];
  plans: Record<DailyPlanKey, DailyPlanVariant>;
};

export type DailyPlanKey = "standard" | "lowEnergy" | "rainy";

export type DailyPlanVariant = {
  label: "標準版" | "低體力版" | "雨天版";
  overview: string;
  walkingLoad: string;
  taxiAdvice: string;
  restStops: string[];
  toiletCoffeeBackups: string[];
  mustDo: string[];
};

export type ChecklistTask = {
  id: string;
  category: ChecklistCategory;
  title: string;
  detail: string;
  dueDate?: string;
};

export type PlanCard = {
  days: 5 | 6 | 7 | 8;
  title: string;
  bestFor: string;
  rhythm: string;
  route: string[];
};

export type HighlightCard = {
  title: string;
  subtitle: string;
  description: string;
};

export type BestTimeEntry = {
  area: string;
  period: string;
  note: string;
};

export type RouteStop = {
  label: string;
  area: Area;
  transport: string;
  comfortNote: string;
};

export type MapRouteSegment = {
  id: string;
  dayRange: string;
  from: string;
  to: string;
  transport: string;
  duration: string;
  comfort: string;
  seniorTip: string;
};

export type MapHighlight = {
  id: string;
  title: string;
  area: Area;
  description: string;
  stay: string;
  taxiRecommended: boolean;
};

export type RestSpot = {
  name: string;
  area: Area;
  reason: string;
  bestTiming: string;
};

export type OnsenStay = {
  name: string;
  area: Area;
  comfortPoints: string[];
};

export type HotelStay = {
  id: string;
  stayDates: string;
  dayRange: string;
  name: string;
  englishName: string;
  image: string;
  imageAlt: string;
  city: string;
  area: Area;
  mapUrl: string;
  accessNote: string;
  familyFriendlyNote: string;
  features: string[];
  seniorNotes: string[];
  onsenHighlights?: string[];
  source: "飯店資訊整理與介紹";
};

export type TransportComfort = {
  title: string;
  icon: "train" | "taxi" | "luggage" | "seat";
  description: string;
};

export type FlightLeg = {
  label: "去程" | "回程";
  date: string;
  flightNumber: string;
  departure: {
    time: string;
    city: string;
    airport: string;
    terminal: string;
  };
  arrival: {
    time: string;
    city: string;
    airport: string;
    terminal: string;
  };
};

export type FlightGroup = {
  id: string;
  name: "高雄組" | "台北組";
  legs: FlightLeg[];
};
