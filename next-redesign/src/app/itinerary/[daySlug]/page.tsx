import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Coffee,
  ListChecks,
  Moon,
  Sun,
  Sunset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionalNightViewCard } from "@/components/trip/OptionalNightViewCard";
import { itinerary2026 } from "@/data/itinerary-2026";
import {
  getAdjacentItineraryDays,
  getItineraryDayBySlug,
  getItineraryDaySlug,
} from "@/lib/trip-guards";
import type { DailyPlanKey, Intensity, ItineraryDay, TimeBlock } from "@/types/trip";

const intensityLabels: Record<Intensity, string> = {
  easy: "輕鬆",
  moderate: "適中",
  active: "偏高",
};

const typeLabels: Record<TimeBlock["type"], string> = {
  transport: "交通",
  sightseeing: "景點",
  meal: "用餐",
  rest: "休息",
  onsen: "溫泉",
  hotel: "住宿",
  luggage: "行李",
};

const periodConfig = {
  morning: { label: "早上", icon: Sun },
  afternoon: { label: "下午", icon: Sunset },
  evening: { label: "晚上", icon: Moon },
} as const;

const planOrder: DailyPlanKey[] = ["standard", "lowEnergy", "rainy"];

type Params = {
  daySlug: string;
};

export function generateStaticParams() {
  return itinerary2026.map((day) => ({
    daySlug: getItineraryDaySlug(day),
  }));
}

function TimeBlockCard({ block }: { block: TimeBlock }) {
  return (
    <li className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-[8px] bg-[#607348]/12 px-3 py-1 text-[15px] font-semibold text-[#445433]">
          {typeLabels[block.type]}
        </span>
        {block.isMainSpot ? (
          <span className="rounded-[8px] bg-[#a33a2b]/10 px-3 py-1 text-[15px] font-semibold text-[#8b2f24]">
            主景點
          </span>
        ) : null}
      </div>
      <h3 className="mb-3 text-[23px] font-semibold leading-snug text-[#2f2a24]">
        {block.title}
      </h3>
      {block.seniorInfo ? (
        <dl className="mb-4 grid gap-2 rounded-[8px] bg-[#f8f4ec] p-4 text-[16px] leading-7 text-[#5f5549] sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-[#2f2a24]">停留時間</dt>
            <dd>{block.seniorInfo.stayMinutes} 分鐘</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#2f2a24]">步行負擔</dt>
            <dd>{block.seniorInfo.walkingLoad}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#2f2a24]">階梯程度</dt>
            <dd>{block.seniorInfo.stairs}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#2f2a24]">交通建議</dt>
            <dd>
              {block.seniorInfo.taxiRecommended
                ? "建議計程車補位"
                : "可步行銜接"}
            </dd>
          </div>
        </dl>
      ) : null}
      {block.notes?.length ? (
        <ul className="space-y-2 text-[17px] leading-8 text-[#766c5f]">
          {block.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function PeriodSection({
  day,
  period,
}: {
  day: ItineraryDay;
  period: keyof typeof periodConfig;
}) {
  const config = periodConfig[period];
  const Icon = config.icon;
  const blocks = day[period];

  return (
    <section aria-label={`${day.title}${config.label}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-6 text-[#a33a2b]" />
        <h2 className="font-serif text-[30px] text-[#2f2a24]">
          {config.label}
        </h2>
      </div>
      {blocks.length ? (
        <ul className="space-y-4">
          {blocks.map((block) => (
            <TimeBlockCard block={block} key={block.title} />
          ))}
        </ul>
      ) : (
        <p className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 text-[17px] text-[#766c5f]">
          不排固定行程，保留休息。
        </p>
      )}
    </section>
  );
}

function DailyPlanSection({ day }: { day: ItineraryDay }) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">
      <div className="mb-5 flex items-center gap-2">
        <ListChecks className="size-6 text-[#a33a2b]" />
        <h2 className="font-serif text-[34px] text-[#2f2a24]">
          三種當日方案
        </h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {planOrder.map((planKey) => {
          const plan = day.plans[planKey];

          return (
            <article
              className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm"
              key={planKey}
            >
              <h3 className="text-[24px] font-semibold text-[#2f2a24]">
                {plan.label}
              </h3>
              <p className="mt-3 text-[17px] leading-8 text-[#5f5549]">
                {plan.overview}
              </p>
              <dl className="mt-4 grid gap-3 text-[16px] leading-7">
                <PlanDetail label="步行負擔" value={plan.walkingLoad} />
                <PlanDetail label="計程車建議" value={plan.taxiAdvice} />
                <PlanList label="休息點" values={plan.restStops} />
                <PlanList label="廁所/咖啡備案" values={plan.toiletCoffeeBackups} />
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PlanDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#f8f4ec] p-3">
      <dt className="font-semibold text-[#8a5a3b]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#2f2a24]">{value}</dd>
    </div>
  );
}

function PlanList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-[8px] bg-[#f8f4ec] p-3">
      <dt className="font-semibold text-[#8a5a3b]">{label}</dt>
      <dd className="mt-1 space-y-1 font-semibold text-[#2f2a24]">
        {values.map((value) => (
          <p className="flex gap-2" key={value}>
            <Coffee className="mt-1 size-4 shrink-0 text-[#607348]" />
            <span>{value}</span>
          </p>
        ))}
      </dd>
    </div>
  );
}

export default async function ItineraryDayDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { daySlug } = await params;
  const day = getItineraryDayBySlug(daySlug);

  if (!day) {
    notFound();
  }

  const adjacent = getAdjacentItineraryDays(daySlug);

  return (
    <main className="min-h-screen bg-[#f8f4ec] pb-20 md:pb-0">
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-28 sm:px-8 lg:px-10">
        <Button asChild variant="outline" className="mb-6 h-12 rounded-[8px] px-4 text-[17px]">
          <Link href="/itinerary" prefetch={false}>
            <ArrowLeft className="size-5" />
            回每日行程
          </Link>
        </Button>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="mb-3 text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
              Day {day.day} Detail
            </p>
            <h1 className="font-serif text-[38px] leading-tight text-[#2f2a24] sm:text-[58px]">
              {day.title}
            </h1>
            <p className="mt-4 text-[19px] leading-9 text-[#5f5549]">
              {day.date}（{day.weekday}）・{day.city}
            </p>
          </div>
          <aside className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-[18px] font-semibold text-[#445433]">
              <Armchair className="size-6" />
              行程強度：{intensityLabels[day.intensity]}
            </div>
            <p className="text-[17px] leading-8 text-[#5f5549]">
              此頁只顯示 Day {day.day} 的完整細節，適合出發當天或前一晚確認。
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-12 sm:px-8 lg:grid-cols-3 lg:px-10">
        <PeriodSection day={day} period="morning" />
        <PeriodSection day={day} period="afternoon" />
        <PeriodSection day={day} period="evening" />
      </section>

      <DailyPlanSection day={day} />

      {day.luggageNotes?.length ? (
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">
          <div className="rounded-[8px] border border-[#d8c3a3] bg-[#fffdf8] p-5 text-[17px] leading-8 text-[#5f5549] shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-[24px] font-semibold text-[#2f2a24]">
              <BriefcaseBusiness className="size-6 text-[#8a5a3b]" />
              行李提醒
            </h2>
            {day.luggageNotes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>
      ) : null}

      {day.optionalNightViews.length ? (
        <section className="bg-[#fffaf1] py-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <h2 className="mb-6 font-serif text-[34px] text-[#2f2a24]">
              夜楓 optional
            </h2>
            <div className="grid gap-5 lg:grid-cols-3">
              {day.optionalNightViews.map((nightView) => (
                <OptionalNightViewCard nightView={nightView} key={nightView.id} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-12 sm:px-8 md:flex-row md:justify-between lg:px-10">
        {adjacent.previous ? (
          <Button asChild variant="outline" className="h-14 rounded-[8px] px-5 text-[17px]">
            <Link
              href={`/itinerary/${getItineraryDaySlug(adjacent.previous)}`}
              prefetch={false}
            >
              <ArrowLeft className="size-5" />
              Day {adjacent.previous.day}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Button asChild className="h-14 rounded-[8px] bg-[#a33a2b] px-5 text-[17px] text-white hover:bg-[#8b2f24]">
            <Link
              href={`/itinerary/${getItineraryDaySlug(adjacent.next)}`}
              prefetch={false}
            >
              Day {adjacent.next.day}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        ) : null}
      </section>
    </main>
  );
}
