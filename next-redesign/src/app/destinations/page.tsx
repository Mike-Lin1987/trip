import { CalendarDays, Leaf, Moon } from "lucide-react";
import { TravelPageHero } from "@/components/layout/TravelPageHero";
import { OptionalNightViewCard } from "@/components/trip/OptionalNightViewCard";
import { DestinationCard } from "@/components/trip/DestinationCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bestTimeEntries, highlightCards } from "@/data/homepage";
import { destinations, itinerary2026 } from "@/data/itinerary-2026";

const destinationHeroStats = [
  {
    value: "7 個孝親友善景點",
    label: "每個景點都有步行與階梯資訊",
    icon: Leaf,
  },
  {
    value: "夜楓只做備案",
    label: "晚上不排成必去，保留體力",
    icon: Moon,
  },
  {
    value: "紅葉期集中在 11 月中旬到 12 月上旬",
    label: "用時間軸安排主景點順序",
    icon: CalendarDays,
  },
];

export default function DestinationsPage() {
  const nightViews = itinerary2026.flatMap((day) => day.optionalNightViews);

  return (
    <main className="travel-paper min-h-screen bg-[#f0e3cf] pb-20 md:pb-0">
      <TravelPageHero
        eyebrow="賞楓導覽手帖"
        title="孝親友善景點列表"
        summary="把京都夜楓、金澤庭園、山中溫泉溪谷整理成可慢走、可休息、可臨時縮短的賞楓清單。"
        stats={destinationHeroStats}
      />
      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-3">
          {destinations.map((destination) => (
            <DestinationCard destination={destination} key={destination.id} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">
        <div className="mb-6 max-w-3xl space-y-3">
          <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
            Three Highlights
          </p>
          <h2 className="font-serif text-[34px] leading-tight text-[#2f2a24] sm:text-[46px]">
            三大紅葉亮點
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {highlightCards.map((highlight) => (
            <Card className="rounded-[8px] bg-[#fffdf8] shadow-sm" key={highlight.title}>
              <CardHeader>
                <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#c8a24a]">
                  {highlight.subtitle}
                </p>
                <CardTitle className="font-serif text-[28px] text-[#2f2a24]">
                  {highlight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[17px] leading-8 text-[#5f5549]">
                  {highlight.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">
        <div className="mb-6 max-w-3xl space-y-3">
          <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
            Autumn Calendar
          </p>
          <h2 className="font-serif text-[34px] leading-tight text-[#2f2a24] sm:text-[46px]">
            紅葉最佳時期 Timeline
          </h2>
        </div>
        <ol className="grid gap-4 lg:grid-cols-3">
          {bestTimeEntries.map((entry) => (
            <li
              className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm"
              key={entry.area}
            >
              <CalendarDays className="mb-5 size-8 text-[#a33a2b]" />
              <h3 className="mb-2 font-serif text-[28px] text-[#2f2a24]">
                {entry.area}
              </h3>
              <p className="mb-3 text-[18px] font-semibold text-[#8a5a3b]">
                {entry.period}
              </p>
              <p className="text-[17px] leading-8 text-[#5f5549]">
                {entry.note}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[#fffaf1] py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <h2 className="mb-6 font-serif text-[34px] text-[#2f2a24]">
            夜楓備案
          </h2>
          <div className="grid gap-5 lg:grid-cols-3">
            {nightViews.map((nightView) => (
              <OptionalNightViewCard nightView={nightView} key={nightView.id} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
