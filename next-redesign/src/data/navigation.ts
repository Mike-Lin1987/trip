import {
  Bed,
  CheckSquare,
  Coins,
  Map,
  MapPin,
  Route,
  Train,
} from "lucide-react";

export const siteNavItems = [
  {
    href: "/itinerary",
    label: "每日行程",
    title: "每日三段式行程",
    description: "早上、下午、晚上分段，只顯示當天安排。",
    icon: Map,
  },
  {
    href: "/destinations",
    label: "景點",
    title: "景點、亮點與紅葉期",
    description: "孝親友善景點、三大紅葉亮點、夜楓備案與最佳賞楓時序。",
    icon: MapPin,
  },
  {
    href: "/transport",
    label: "交通",
    title: "舒適交通規劃",
    description: "JR、計程車、行李宅配與座位預約提醒。",
    icon: Train,
  },
  {
    href: "/hotels",
    label: "飯店",
    title: "飯店介紹與溫泉住宿",
    description: "依住宿順序整理飯店、交通銜接、大浴場與山中溫泉恢復段。",
    icon: Bed,
  },
  {
    href: "/checklist",
    label: "清單",
    title: "行前準備清單",
    description: "依 2026 Family Trip Checklist 匯入可勾選的行前任務。",
    icon: CheckSquare,
  },
  {
    href: "/trip/hokuriku-2026/expenses",
    label: "記帳",
    title: "五人共同記帳",
    description: "新增旅途中共同支出，依付款人、參與人與匯率計算分帳。",
    icon: Coins,
  },
] as const;

export const mobileNavItems = [
  { href: "/itinerary", label: "行程", icon: Route },
  { href: "/destinations", label: "景點", icon: MapPin },
  { href: "/transport", label: "交通", icon: Train },
  { href: "/hotels", label: "飯店", icon: Bed },
  { href: "/checklist", label: "清單", icon: CheckSquare },
  { href: "/trip/hokuriku-2026/expenses", label: "記帳", icon: Coins },
] as const;
