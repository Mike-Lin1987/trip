import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPinned } from "lucide-react";
import { AutumnSlowTravelHero } from "@/components/home/AutumnSlowTravelHero";
import { TripReminderWidget } from "@/components/reminders/TripReminderWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteNavItems } from "@/data/navigation";

const seniorPrinciples = [
  "每天最多 2 個主景點",
  "飯店與午餐都當成正式休息點",
  "夜楓只做 optional",
  "交通與行李先替長輩降負擔",
];

export default function Home() {
  return (
    <main className="travel-paper min-h-screen bg-[#f8f4ec] pb-20 md:pb-0">
      <AutumnSlowTravelHero />

      <section className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 lg:px-10">
        <TripReminderWidget />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
          <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
            Parent-Friendly Rules
          </p>
          <h2 className="mt-3 font-serif text-[34px] leading-tight text-[#2f2a24] sm:text-[46px]">
            慢旅原則
          </h2>
          <ul className="mt-6 space-y-3">
            {seniorPrinciples.map((principle) => (
              <li
                className="flex gap-3 rounded-[8px] bg-[#f8f4ec] p-3 text-[17px] leading-7 text-[#5f5549]"
                key={principle}
              >
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-[#607348]" />
                {principle}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-[8px] bg-[#2f2a24] p-4 text-white">
            <p className="flex items-center gap-2 text-[16px] font-semibold text-[#f2d58d]">
              <MapPinned className="size-5" />
              路線主軸
            </p>
            <p className="mt-2 text-[18px] leading-8">
              從關西機場會合開始，先京都賞楓，再往金澤庭園與山中溫泉收尾。
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {siteNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link href={item.href} key={item.href} prefetch={false}>
                <Card className="h-full rounded-[8px] border-[#e6d8c3] bg-[#fffdf8] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8a24a] hover:shadow-md">
                  <CardHeader>
                    <Icon className="mb-4 size-8 text-[#a33a2b]" />
                    <CardTitle className="text-[23px] text-[#2f2a24]">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 text-[17px] leading-8 text-[#5f5549]">
                    <p>{item.description}</p>
                    <span className="inline-flex items-center gap-2 font-semibold text-[#a33a2b]">
                      進入頁面
                      <ArrowRight className="size-5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
