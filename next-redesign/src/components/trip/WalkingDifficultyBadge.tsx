import { Footprints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WalkingLoad } from "@/types/trip";

const walkingLabels: Record<WalkingLoad, string> = {
  low: "步行低",
  medium: "步行中",
  high: "步行高",
};

const walkingClasses: Record<WalkingLoad, string> = {
  low: "border-[#607348]/20 bg-[#607348]/12 text-[#445433]",
  medium: "border-[#c8a24a]/30 bg-[#c8a24a]/15 text-[#765f20]",
  high: "border-[#a33a2b]/20 bg-[#a33a2b]/10 text-[#8b2f24]",
};

type WalkingDifficultyBadgeProps = {
  load: WalkingLoad;
};

export function WalkingDifficultyBadge({ load }: WalkingDifficultyBadgeProps) {
  return (
    <Badge
      className={`h-8 rounded-[8px] px-3 text-[15px] ${walkingClasses[load]}`}
      variant="outline"
    >
      <Footprints className="size-4" />
      {walkingLabels[load]}
    </Badge>
  );
}
