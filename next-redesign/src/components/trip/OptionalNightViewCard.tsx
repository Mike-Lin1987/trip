import { CarTaxiFront, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OptionalNightView } from "@/types/trip";
import { WalkingDifficultyBadge } from "@/components/trip/WalkingDifficultyBadge";

type OptionalNightViewCardProps = {
  nightView: OptionalNightView;
};

export function OptionalNightViewCard({
  nightView,
}: OptionalNightViewCardProps) {
  return (
    <Card className="rounded-[8px] border-[#d8c3a3] bg-[#fffdf8] shadow-sm">
      <CardHeader>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center gap-2 rounded-[8px] bg-[#2f2a24] px-3 text-[15px] text-white">
            <Moon className="size-4" />
            Optional
          </span>
          <WalkingDifficultyBadge load={nightView.seniorInfo.walkingLoad} />
        </div>
        <CardTitle className="text-[22px] text-[#2f2a24]">
          {nightView.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-[17px] leading-8 text-[#5f5549]">
        <p>{nightView.reason}</p>
        <p className="flex items-center gap-2 font-semibold text-[#8a5a3b]">
          <CarTaxiFront className="size-5" />
          {nightView.seniorInfo.taxiRecommended ? "建議計程車接駁" : "可自行銜接"}
        </p>
      </CardContent>
    </Card>
  );
}
