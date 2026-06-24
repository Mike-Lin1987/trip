"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Armchair,
  Briefcase,
  Clock,
  Coffee,
  ListChecks,
  MapPinned,
  Moon,
  NotebookTabs,
  Sun,
  Sunset,
  Train,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getItineraryDaySlug } from "@/lib/trip-guards";
import type { DailyPlanKey, Intensity, ItineraryDay, TimeBlock } from "@/types/trip";

const intensityLabels: Record<Intensity, string> = {
  easy: "輕鬆",
  moderate: "適中",
  active: "偏高",
};

const periodIcon = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
};

const periodLabels = {
  morning: "早上",
  afternoon: "下午",
  evening: "晚上",
};

const periodStyles = {
  morning: "border-[#e6d8c3] bg-[#fffdf8]",
  afternoon: "border-[#dec9aa] bg-[#fffaf1]",
  evening: "border-[#d8c3a3] bg-[#f4eadb]",
};

function getBlocksForDay(day: ItineraryDay) {
  return [...day.morning, ...day.afternoon, ...day.evening];
}

function getMovingBlockCount(day: ItineraryDay) {
  return getBlocksForDay(day).filter((block) =>
    ["transport", "hotel", "onsen", "luggage"].includes(block.type),
  ).length;
}

function getLuggageSummary(day: ItineraryDay) {
  const luggageBlocks = getBlocksForDay(day)
    .filter((block) => block.type === "luggage")
    .map((block) => block.title);

  return [...luggageBlocks, ...(day.luggageNotes ?? [])];
}

function TimelineBlock({ block }: { block: TimeBlock }) {
  return (
    <li className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 text-[17px] leading-8 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[#2f2a24]">{block.title}</span>
        {block.isMainSpot ? (
          <span className="rounded-[8px] bg-[#a33a2b]/10 px-2 py-1 text-[14px] text-[#8b2f24]">
            主景點
          </span>
        ) : null}
      </div>
      {block.seniorInfo ? (
        <p className="text-[#5f5549]">
          建議停留 {block.seniorInfo.stayMinutes} 分鐘，
          {block.seniorInfo.taxiRecommended ? "可用計程車補位。" : "步行銜接即可。"}
        </p>
      ) : null}
      {block.notes?.map((note) => (
        <p className="text-[#766c5f]" key={note}>
          {note}
        </p>
      ))}
    </li>
  );
}

const planOrder: DailyPlanKey[] = ["standard", "lowEnergy", "rainy"];

function DailyPlanTabs({ day }: { day: ItineraryDay }) {
  return (
    <Tabs defaultValue="standard" className="rounded-[8px] border border-[#e6d8c3] bg-[#fffaf1] p-4">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-[8px] bg-[#f8f4ec] p-2">
        {planOrder.map((planKey) => (
          <TabsTrigger
            className="min-h-10 flex-none rounded-[8px] px-4 text-[15px] data-active:bg-[#a33a2b] data-active:text-white"
            key={planKey}
            value={planKey}
          >
            {day.plans[planKey].label}
          </TabsTrigger>
        ))}
      </TabsList>
      {planOrder.map((planKey) => {
        const plan = day.plans[planKey];

        return (
          <TabsContent className="mt-4 space-y-3 text-[16px] leading-7 text-[#5f5549]" key={planKey} value={planKey}>
            <p className="text-[17px] font-semibold text-[#2f2a24]">
              {plan.overview}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <PlanFact label="步行負擔" value={plan.walkingLoad} />
              <PlanFact label="計程車建議" value={plan.taxiAdvice} />
              <PlanList label="休息點" values={plan.restStops} />
              <PlanList label="廁所/咖啡備案" values={plan.toiletCoffeeBackups} />
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#fffdf8] p-3 ring-1 ring-[#e6d8c3]">
      <p className="text-[14px] font-semibold text-[#8a5a3b]">{label}</p>
      <p className="mt-1 font-semibold text-[#2f2a24]">{value}</p>
    </div>
  );
}

function PlanList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-[8px] bg-[#fffdf8] p-3 ring-1 ring-[#e6d8c3]">
      <p className="text-[14px] font-semibold text-[#8a5a3b]">{label}</p>
      <ul className="mt-1 space-y-1 font-semibold text-[#2f2a24]">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

type RelaxedItineraryTimelineProps = {
  days: ItineraryDay[];
};

export function RelaxedItineraryTimeline({
  days,
}: RelaxedItineraryTimelineProps) {
  const [selectedDay, setSelectedDay] = useState(String(days[0]?.day ?? 1));
  const day = days.find((item) => String(item.day) === selectedDay) ?? days[0];

  if (!day) {
    return null;
  }

  const movingBlockCount = getMovingBlockCount(day);
  const luggageSummary = getLuggageSummary(day);

  return (
    <div className="space-y-5">
      <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
        <label
          className="mb-3 block text-[17px] font-semibold text-[#2f2a24]"
          htmlFor="itinerary-day-select"
        >
          選擇日期
        </label>
        <select
          id="itinerary-day-select"
          aria-label="選擇日期"
          className="min-h-14 w-full rounded-[8px] border border-[#d8c3a3] bg-white px-4 text-[18px] font-semibold text-[#2f2a24] outline-none focus:ring-3 focus:ring-[#a33a2b]/25"
          value={selectedDay}
          onChange={(event) => setSelectedDay(event.target.value)}
        >
          {days.map((item) => (
            <option key={item.day} value={item.day}>
              Day {item.day}・{item.date}（{item.weekday}）｜{item.title}
            </option>
          ))}
        </select>
      </div>

      <article className="overflow-hidden rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
        <header className="grid gap-5 border-b border-[#e6d8c3] bg-[#f8f4ec] p-4 sm:p-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
              <NotebookTabs className="size-4" />
              當日手帖
            </p>
            <p className="text-[15px] font-semibold text-[#a33a2b]">
              Day {day.day}・{day.date}（{day.weekday}）
            </p>
            <h2 className="font-serif text-[30px] leading-tight text-[#2f2a24] sm:text-[40px]">
              {day.title}
            </h2>
            <p className="flex items-center gap-2 text-[17px] text-[#5f5549]">
              <MapPinned className="size-5 text-[#607348]" />
              {day.city}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#607348]/12 px-3 text-[16px] font-semibold text-[#445433]">
              <Armchair className="size-5" />
              行程強度：{intensityLabels[day.intensity]}
            </span>
            <Button
              asChild
              className="h-12 rounded-[8px] bg-[#a33a2b] px-4 text-[17px] text-white hover:bg-[#8b2f24]"
            >
              <Link href={`/itinerary/${getItineraryDaySlug(day)}`} prefetch={false}>
                查看 Day {day.day} 詳情
              </Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-3">
            <section className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4">
              <div className="mb-2 flex items-center gap-2 text-[18px] font-semibold text-[#2f2a24]">
                <MapPinned className="size-5 text-[#607348]" />
                今日住宿
              </div>
              <p className="text-[16px] leading-7 text-[#5f5549]">
                {day.todayStay}
              </p>
            </section>
            <section className="rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-4">
              <div className="mb-2 flex items-center gap-2 text-[18px] font-semibold text-[#2f2a24]">
                <Train className="size-5 text-[#a33a2b]" />
                今日交通
              </div>
              <p className="text-[16px] leading-7 text-[#5f5549]">
                {day.todayTransport}。共 {movingBlockCount} 個交通、住宿或行李銜接點。
              </p>
            </section>

            <section className="rounded-[8px] border border-[#e6d8c3] bg-[#fffaf1] p-4">
              <div className="mb-2 flex items-center gap-2 text-[18px] font-semibold text-[#2f2a24]">
                <Briefcase className="size-5 text-[#8a5a3b]" />
                今日行李提醒
              </div>
              {luggageSummary.length > 0 ? (
                <ul className="space-y-2 text-[16px] leading-7 text-[#5f5549]">
                  {luggageSummary.map((note) => (
                    <li className="flex gap-2" key={note}>
                      <Clock className="mt-1 size-4 shrink-0 text-[#8a5a3b]" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[16px] leading-7 text-[#5f5549]">
                  今天不搬動大行李，以就近入住與早回飯店為主。
                </p>
              )}
            </section>

            <section className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4">
              <div className="mb-2 flex items-center gap-2 text-[18px] font-semibold text-[#2f2a24]">
                <ListChecks className="size-5 text-[#a33a2b]" />
                今日必做事項
              </div>
              <ul className="space-y-2 text-[16px] leading-7 text-[#5f5549]">
                {day.mustDo.map((item) => (
                  <li className="flex gap-2" key={item}>
                    <Coffee className="mt-1 size-4 shrink-0 text-[#8a5a3b]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          <div className="space-y-4">
            <DailyPlanTabs day={day} />
            <div className="grid gap-4 xl:grid-cols-3">
            {(["morning", "afternoon", "evening"] as const).map((period) => {
              const Icon = periodIcon[period];
              const blocks = day[period];

              return (
                <section
                  className={`rounded-[8px] border p-4 ${periodStyles[period]}`}
                  key={period}
                  aria-label={`${day.title}${periodLabels[period]}`}
                >
                  <div className="mb-3 flex items-center gap-2 text-[18px] font-semibold text-[#2f2a24]">
                    <Icon className="size-5 text-[#a33a2b]" />
                    {periodLabels[period]}
                  </div>
                  {blocks.length > 0 ? (
                    <ul className="space-y-3">
                      {blocks.map((block) => (
                        <TimelineBlock block={block} key={block.title} />
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 text-[17px] text-[#766c5f]">
                      不排固定行程，保留休息。
                    </p>
                  )}
                </section>
              );
            })}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
