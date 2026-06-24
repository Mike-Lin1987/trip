import { MapPin } from "lucide-react";
import type { RouteStop } from "@/types/trip";

type MapRoutePreviewProps = {
  stops: RouteStop[];
};

export function MapRoutePreview({ stops }: MapRoutePreviewProps) {
  return (
    <section
      className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm sm:p-6"
      aria-labelledby="route-preview-heading"
    >
      <div className="mb-6 space-y-2">
        <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
          Route
        </p>
        <h2
          id="route-preview-heading"
          className="font-serif text-[30px] leading-tight text-[#2f2a24] sm:text-[38px]"
        >
          關西機場 → 京都 → 金澤 → 山中溫泉 → 新大阪 → 關西機場
        </h2>
      </div>
      <ol className="grid gap-4 lg:grid-cols-6">
        {stops.map((stop, index) => (
          <li
            className="relative rounded-[8px] bg-[#f8f4ec] p-4"
            key={`${stop.label}-${index}`}
          >
            <div className="mb-3 flex items-center gap-2 text-[18px] font-semibold text-[#2f2a24]">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#a33a2b] text-white">
                {index + 1}
              </span>
              {stop.label}
            </div>
            <p className="mb-2 flex items-center gap-2 text-[16px] font-semibold text-[#8a5a3b]">
              <MapPin className="size-4" />
              {stop.transport}
            </p>
            <p className="text-[16px] leading-7 text-[#5f5549]">
              {stop.comfortNote}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
