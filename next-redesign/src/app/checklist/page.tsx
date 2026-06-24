import { CheckSquare, ClipboardList, ShieldCheck } from "lucide-react";
import { ChecklistBoard } from "@/components/checklist/ChecklistBoard";
import { TravelPageHero } from "@/components/layout/TravelPageHero";
import { checklist2026 } from "@/data/checklist-2026";

const checklistHeroStats = [
  {
    value: "勾選狀態保存在此裝置",
    label: "下次打開仍會保留",
    icon: CheckSquare,
  },
  {
    value: "票券、飯店、行李分區管理",
    label: "避免所有準備事項混在一起",
    icon: ClipboardList,
  },
  {
    value: "出發前逐項收斂",
    label: "把還沒處理的事情留在畫面上",
    icon: ShieldCheck,
  },
];

export default function ChecklistPage() {
  return (
    <main className="travel-paper min-h-screen bg-[#f0e3cf] pb-20 md:pb-0">
      <TravelPageHero
        eyebrow="出發前控管台"
        title="出發準備手帖"
        stats={checklistHeroStats}
      />
      <ChecklistBoard tasks={checklist2026} />
    </main>
  );
}
