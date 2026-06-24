import { Armchair } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RestSpot } from "@/types/trip";

type RestSpotCardProps = {
  spot: RestSpot;
};

export function RestSpotCard({ spot }: RestSpotCardProps) {
  return (
    <Card className="rounded-[8px] bg-[#fffdf8] shadow-sm">
      <CardHeader>
        <Armchair className="mb-3 size-7 text-[#607348]" />
        <CardTitle className="text-[21px] text-[#2f2a24]">{spot.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-[17px] leading-8 text-[#5f5549]">
        <p>{spot.reason}</p>
        <p className="font-semibold text-[#8a5a3b]">建議時段：{spot.bestTiming}</p>
      </CardContent>
    </Card>
  );
}
