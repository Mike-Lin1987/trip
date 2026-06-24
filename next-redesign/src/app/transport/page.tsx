import {
  AlertTriangle,
  Clock,
  MapPin,
  PlaneLanding,
  PlaneTakeoff,
  TrainFront,
} from "lucide-react";
import { PageIntro } from "@/components/layout/SectionHeading";
import { MapRoutePreview } from "@/components/trip/MapRoutePreview";
import { TransportComfortCard } from "@/components/trip/TransportComfortCard";
import { flightGroups } from "@/data/flights";
import { routeStops, transportComfortCards } from "@/data/homepage";

const transportHighlights = [
  {
    title: "京都 → 金澤",
    detail:
      "Thunderbird 京都/大阪方向 → 敦賀 + 北陸新幹線 敦賀 → 金澤。轉乘時間抓寬，爸媽同行不要壓線。",
  },
  {
    title: "山中溫泉 → 新大阪",
    detail:
      "加賀溫泉 → 敦賀：北陸新幹線；敦賀 → 新大阪：Thunderbird。這天不再安排景點。",
  },
  {
    title: "大件行李",
    detail:
      "宅配優先，若帶上車請依 JR-WEST 官方最新規則確認。",
  },
] as const;

export default function TransportPage() {
  return (
    <main className="travel-paper min-h-screen bg-[#f8f4ec] pb-20 md:pb-0">
      <PageIntro
        eyebrow="Comfort Transport"
        title="交通手帖"
        description="JR、計程車、行李宅配、敦賀轉乘與航班時間都集中在這裡。"
      />
      <section className="mx-auto max-w-7xl space-y-8 px-5 pb-12 sm:px-8 lg:px-10">
        <MapRoutePreview stops={routeStops} />

        <section className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
          <div className="mb-4 space-y-2">
            <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
              Route Map
            </p>
            <h2 className="font-serif text-[28px] leading-tight text-[#2f2a24] sm:text-[34px]">
              關西北陸行程地圖
            </h2>
          </div>
          <div className="mx-auto max-w-sm overflow-hidden rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="關西北陸行程地圖"
              className="aspect-[3/4] w-full object-cover object-top"
              loading="lazy"
              decoding="async"
              width={900}
              height={1200}
              src="/images/trip-assets/kansai-hokuriku-route-map.webp"
            />
          </div>
        </section>

        <section
          className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm sm:p-6"
          aria-labelledby="private-transport-heading"
        >
          <div className="mb-6 space-y-2">
            <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
              Private Route Notes
            </p>
            <h2
              id="private-transport-heading"
              className="font-serif text-[30px] leading-tight text-[#2f2a24] sm:text-[38px]"
            >
              完整交通與航班
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {transportHighlights.map((item) => (
              <article
                className="rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-4"
                key={item.title}
              >
                <TrainFront className="mb-3 size-6 text-[#a33a2b]" />
                <h3 className="text-[22px] font-semibold text-[#2f2a24]">
                  {item.title}
                </h3>
                <p className="mt-3 text-[17px] leading-8 text-[#5f5549]">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm sm:p-6"
          aria-labelledby="flight-schedule-heading"
        >
          <div className="mb-6 space-y-2">
            <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
              Flight
            </p>
            <h2
              id="flight-schedule-heading"
              className="font-serif text-[30px] leading-tight text-[#2f2a24] sm:text-[38px]"
            >
              高雄組與台北組航班時間
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {flightGroups.map((group) => (
              <article
                className="rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-4 sm:p-5"
                key={group.id}
              >
                <h3 className="mb-4 text-[22px] font-semibold text-[#2f2a24]">
                  {group.name}
                </h3>
                <div className="grid gap-4">
                  {group.legs.map((leg) => (
                    <div
                      className="rounded-[8px] bg-[#fffdf8] p-4"
                      key={`${group.id}-${leg.label}`}
                    >
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex min-h-8 items-center rounded-full bg-[#a33a2b] px-3 text-[15px] font-semibold text-white">
                          {leg.label}
                        </span>
                        <span className="inline-flex min-h-8 items-center rounded-full bg-[#2f2a24] px-3 font-mono text-[15px] font-semibold text-white">
                          {leg.flightNumber}
                        </span>
                        <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#e6d8c3] px-3 text-[15px] font-semibold text-[#6b4a2f]">
                          <Clock className="size-4" />
                          {leg.date}
                        </span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-[16px] font-semibold text-[#a33a2b]">
                            <PlaneTakeoff className="size-4" />
                            出發 {leg.departure.time}
                          </p>
                          <p className="flex items-start gap-2 text-[16px] leading-7 text-[#5f5549]">
                            <MapPin className="mt-1 size-4 shrink-0 text-[#8a5a3b]" />
                            <span>
                              {leg.departure.city}｜{leg.departure.airport}
                              <br />
                              {leg.departure.terminal}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-[16px] font-semibold text-[#607348]">
                            <PlaneLanding className="size-4" />
                            抵達 {leg.arrival.time}
                          </p>
                          <p className="flex items-start gap-2 text-[16px] leading-7 text-[#5f5549]">
                            <MapPin className="mt-1 size-4 shrink-0 text-[#8a5a3b]" />
                            <span>
                              {leg.arrival.city}｜{leg.arrival.airport}
                              <br />
                              {leg.arrival.terminal}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <article className="rounded-[8px] border border-[#d8c3a3] bg-[#fffaf1] p-5 shadow-sm">
          <p className="mb-2 flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
            <AlertTriangle className="size-4" />
            Transfer Alert
          </p>
          <h2 className="font-serif text-[30px] text-[#2f2a24]">
            敦賀轉乘提醒
          </h2>
          <ul className="mt-4 space-y-2 text-[17px] leading-8 text-[#5f5549]">
            <li>京都/大阪方向的 Thunderbird 與北陸新幹線在敦賀銜接。</li>
            <li>爸媽同行建議抓寬轉乘時間，先找電梯與洗手間位置。</li>
            <li>若遇雨或大件行李，優先減少車站內折返與臨時購物。</li>
          </ul>
        </article>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {transportComfortCards.map((item) => (
            <TransportComfortCard item={item} key={item.title} />
          ))}
        </div>
      </section>
    </main>
  );
}
