import {
  Armchair,
  CarTaxiFront,
  Clock,
  ExternalLink,
  Footprints,
  MapPin,
  Route,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Destination } from "@/types/trip";
import { AutumnStatusBadge } from "@/components/trip/AutumnStatusBadge";
import { SeniorFriendlyBadge } from "@/components/trip/SeniorFriendlyBadge";
import { WalkingDifficultyBadge } from "@/components/trip/WalkingDifficultyBadge";

const stairLabels = {
  none: "幾乎無階梯",
  few: "少量階梯",
  some: "部分階梯",
  many: "階梯較多",
};

type DestinationCardProps = {
  destination: Destination;
};

export function DestinationCard({ destination }: DestinationCardProps) {
  const { seniorInfo } = destination;

  return (
    <Card className="rounded-[8px] bg-card shadow-sm">
      <CardHeader className="gap-4 border-b border-[#e6d8c3] bg-[#fffaf1]">
        <div className="flex flex-wrap gap-2">
          <AutumnStatusBadge status={destination.autumnStatus} />
          <WalkingDifficultyBadge load={seniorInfo.walkingLoad} />
        </div>
        <CardTitle className="text-[22px] leading-snug text-[#2f2a24]">
          {destination.name}
        </CardTitle>
        <a
          className="inline-flex min-h-9 w-fit items-center gap-2 rounded-[8px] border border-[#d9c6a8] bg-white px-3 text-[15px] font-semibold text-[#6b4a2f] transition hover:border-[#a33a2b] hover:text-[#a33a2b]"
          href={destination.mapUrl}
          rel="noreferrer"
          target="_blank"
        >
          <MapPin className="size-4" />
          Google Maps 定位
          <ExternalLink className="size-4" />
        </a>
      </CardHeader>
      <CardContent className="space-y-5 text-[17px] leading-8 text-[#5f5549]">
        <p>{destination.description}</p>
        <div className="flex flex-wrap gap-2">
          {destination.highlights.map((highlight) => (
            <span
              className="rounded-[8px] bg-[#f4ead8] px-3 py-1 text-[15px] text-[#6b4a2f]"
              key={highlight}
            >
              {highlight}
            </span>
          ))}
        </div>
        <dl className="grid gap-3 rounded-[8px] bg-[#fbf7ef] p-4 text-[16px] sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Footprints className="size-5 text-[#8a5a3b]" />
            <dt className="sr-only">階梯程度</dt>
            <dd>{stairLabels[seniorInfo.stairs]}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-[#8a5a3b]" />
            <dt className="sr-only">建議停留時間</dt>
            <dd>{seniorInfo.stayMinutes} 分鐘</dd>
          </div>
          <div className="flex items-center gap-2">
            <Armchair className="size-5 text-[#8a5a3b]" />
            <dt className="sr-only">休息點</dt>
            <dd>{seniorInfo.hasRestSpots ? "有休息點" : "休息點少"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <CarTaxiFront className="size-5 text-[#8a5a3b]" />
            <dt className="sr-only">計程車建議</dt>
            <dd>{seniorInfo.taxiRecommended ? "建議計程車" : "可步行銜接"}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <SeniorFriendlyBadge friendly={seniorInfo.seniorFriendly} />
          <span className="inline-flex h-8 items-center gap-2 rounded-[8px] border border-[#e6d8c3] px-3 text-[15px] text-[#6b4a2f]">
            <Route className="size-4" />
            慢走優先
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
