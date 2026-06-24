import { Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AutumnStatus } from "@/types/trip";

const statusLabels: Record<AutumnStatus, string> = {
  peak: "紅葉見頃",
  coloring: "轉色中",
  early: "稍早",
  late: "稍晚",
};

const statusClasses: Record<AutumnStatus, string> = {
  peak: "border-[#a33a2b]/20 bg-[#a33a2b]/10 text-[#8b2f24]",
  coloring: "border-[#c8a24a]/30 bg-[#c8a24a]/15 text-[#765f20]",
  early: "border-[#607348]/20 bg-[#607348]/12 text-[#445433]",
  late: "border-[#8a5a3b]/20 bg-[#8a5a3b]/10 text-[#684329]",
};

type AutumnStatusBadgeProps = {
  status: AutumnStatus;
};

export function AutumnStatusBadge({ status }: AutumnStatusBadgeProps) {
  return (
    <Badge
      className={`h-8 rounded-[8px] px-3 text-[15px] ${statusClasses[status]}`}
      variant="outline"
    >
      <Leaf className="size-4" />
      {statusLabels[status]}
    </Badge>
  );
}
