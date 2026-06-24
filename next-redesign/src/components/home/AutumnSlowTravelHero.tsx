import {
  ArrowRight,
  BedDouble,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  HeartHandshake,
  ListChecks,
  MapPin,
  Moon,
  Train,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { heroImage } from "@/data/homepage";

const dashboardStats = [
  {
    value: "8 天",
    label: "2026 秋季慢旅",
    icon: CalendarDays,
  },
  {
    value: "7 晚・5 個住宿點",
    label: "解鎖後顯示完整飯店資訊",
    icon: BedDouble,
  },
  {
    value: "最多 2 景點",
    label: "不把爸媽行程排滿",
    icon: HeartHandshake,
  },
  {
    value: "夜楓 optional",
    label: "晚上保留體力",
    icon: Moon,
  },
];

const todayFocusItems = [
  {
    label: "Day",
    value: "Day 1・關西機場會合",
    icon: CalendarDays,
  },
  {
    label: "今日住宿",
    value: "關西機場華盛頓酒店",
    icon: BedDouble,
  },
  {
    label: "今日交通",
    value: "抵達後直接前往關西機場華盛頓酒店",
    icon: Train,
  },
  {
    label: "行李提醒",
    value: "護照、藥品、充電線放隨身包",
    icon: BriefcaseBusiness,
  },
  {
    label: "今日必做事項",
    value: "全員會合、確認網路、早點休息",
    icon: ListChecks,
  },
];

export function AutumnSlowTravelHero() {
  return (
    <section
      className="relative min-h-[92svh] overflow-hidden bg-[#2f2a24] text-white"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(47, 42, 36, 0.9), rgba(47, 42, 36, 0.62), rgba(47, 42, 36, 0.22)), url(${heroImage})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,250,241,0.08)_0,transparent_34%,rgba(200,162,74,0.12)_100%)]" />
      <div className="relative mx-auto grid min-h-[92svh] w-full max-w-7xl items-end gap-5 px-4 pb-10 pt-24 sm:gap-8 sm:px-8 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div className="max-w-4xl space-y-5 sm:space-y-7">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#f2d58d] sm:text-[15px]">
            紅葉慢旅手帖
          </p>
          <div className="flex flex-wrap gap-2 text-[14px] sm:gap-3 sm:text-[15px]">
            <span className="inline-flex max-w-full items-center gap-2 rounded-[8px] border border-[#fffaf1]/25 bg-[#2f2a24]/55 px-3 py-2 leading-tight">
              <CalendarDays className="size-4" />
              <span>2026 秋季</span>
              <span>8 天 7 夜</span>
            </span>
            <span className="inline-flex max-w-full items-center gap-2 rounded-[8px] border border-[#fffaf1]/25 bg-[#2f2a24]/55 px-3 py-2 leading-tight">
              <HeartHandshake className="size-4" />
              孝親友善慢旅行
            </span>
            <span className="inline-flex max-w-full items-center gap-2 rounded-[8px] border border-[#fffaf1]/25 bg-[#2f2a24]/55 px-3 py-2 leading-tight">
              <MapPin className="size-4" />
              京都・金澤・山中溫泉
            </span>
          </div>
          <h1 className="font-serif text-[clamp(2.35rem,12vw,4rem)] leading-tight text-white lg:text-[76px]">
            京都・金澤・山中溫泉｜孝親紅葉慢旅
          </h1>
          <p className="max-w-3xl text-[17px] leading-8 text-[#fff7e8] sm:text-[23px] sm:leading-9">
            寺院紅葉、庭園散策、溪谷溫泉，規劃一趟爸媽也舒服的秋日日本旅行
          </p>
          <Button
            asChild
            className="min-h-12 w-full rounded-[8px] bg-[#a33a2b] px-5 py-3 text-[17px] text-white hover:bg-[#8b2f24] sm:h-14 sm:w-auto sm:px-6 sm:text-[18px]"
          >
            <Link href="/itinerary" prefetch={false}>
              查看每日行程
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>

        <aside className="rounded-[8px] border border-[#f0e3cf]/55 bg-[#fffdf8] p-4 text-[#2f2a24] shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-6 lg:shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[15px] font-semibold uppercase tracking-[0.14em] text-[#a33a2b]">
                旅行摘要儀表板
              </p>
            </div>
            <CheckSquare className="mt-1 size-8 shrink-0 text-[#607348]" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {dashboardStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  className="rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-3 sm:p-4"
                  key={stat.value}
                >
                  <Icon className="mb-3 size-5 text-[#a33a2b]" />
                  <p className="font-serif text-[24px] leading-tight text-[#2f2a24] sm:text-[30px] sm:leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-[#5f5549] sm:text-[15px] sm:leading-6">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-[8px] bg-[#a33a2b] p-3 text-white sm:mt-5 sm:p-4">
            <p className="text-[14px] font-semibold uppercase tracking-[0.12em] text-[#f4dca4]">
              Route
            </p>
            <p className="mt-2 text-[17px] font-semibold leading-7 sm:text-[19px] sm:leading-8">
              關西機場 → 京都 → 金澤 → 山中溫泉 → 新大阪 → 關西機場
            </p>
          </div>

          <div className="mt-3 rounded-[8px] border border-[#e6d8c3] bg-[#fffaf1] p-3 sm:mt-4 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
                今日重點卡
              </p>
              <CheckSquare className="size-5 text-[#607348]" />
            </div>
            <dl className="grid gap-2">
              {todayFocusItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="grid gap-1 rounded-[8px] bg-[#fffdf8] px-3 py-2 text-[14px] ring-1 ring-[#e6d8c3] sm:grid-cols-[118px_1fr] sm:gap-2 sm:text-[15px]"
                    key={item.label}
                  >
                    <dt className="flex items-center gap-2 font-semibold text-[#8a5a3b]">
                      <Icon className="size-4 text-[#a33a2b]" />
                      {item.label}
                    </dt>
                    <dd className="font-semibold leading-6 text-[#2f2a24]">
                      {item.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}
