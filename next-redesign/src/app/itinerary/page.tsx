import { PageIntro } from "@/components/layout/SectionHeading";
import { MapRoutePreview } from "@/components/trip/MapRoutePreview";
import { RelaxedItineraryTimeline } from "@/components/trip/RelaxedItineraryTimeline";
import { mapRouteSegments } from "@/data/map";
import { routeStops } from "@/data/homepage";
import { itinerary2026 } from "@/data/itinerary-2026";

export default function ItineraryPage() {
  return (
    <main className="travel-paper min-h-screen bg-[#f8f4ec] pb-20 md:pb-0">
      <PageIntro
        eyebrow="2026 Itinerary"
        title="每日行程手帖"
        description="用下拉選單切換日期；畫面只保留當天的早上、下午、晚上三段式行程。"
      />
      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-12 sm:px-8 lg:px-10">
        <RelaxedItineraryTimeline days={itinerary2026} />
        <div className="space-y-5">
          <MapRoutePreview stops={routeStops} />
          <div className="grid gap-4 lg:grid-cols-2">
            {mapRouteSegments.map((segment) => (
              <article
                className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm"
                key={segment.id}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-8 items-center rounded-[8px] bg-[#a33a2b]/10 px-3 text-[15px] font-semibold text-[#a33a2b]">
                    {segment.dayRange}
                  </span>
                  <span className="inline-flex min-h-8 items-center rounded-[8px] bg-[#607348]/12 px-3 text-[15px] font-semibold text-[#445433]">
                    {segment.duration}
                  </span>
                </div>
                <h2 className="font-serif text-[27px] leading-tight text-[#2f2a24]">
                  {segment.from} → {segment.to}
                </h2>
                <p className="mt-3 text-[17px] font-semibold text-[#8a5a3b]">
                  {segment.transport}
                </p>
                <p className="mt-3 text-[17px] leading-8 text-[#5f5549]">
                  {segment.comfort}
                </p>
                <p className="mt-3 rounded-[8px] bg-[#f8f4ec] p-4 text-[16px] leading-7 text-[#5f5549]">
                  {segment.seniorTip}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
