import type { LucideIcon } from "lucide-react";

type TravelPageHeroStat = {
  value: string;
  label: string;
  icon: LucideIcon;
};

type TravelPageHeroProps = {
  eyebrow: string;
  title: string;
  summary?: string;
  stats: TravelPageHeroStat[];
};

export function TravelPageHero({
  eyebrow,
  title,
  summary,
  stats,
}: TravelPageHeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-10 pt-28 sm:px-8 lg:px-10">
      <div className="grid gap-7 border-b border-[#d8c3a3] pb-8 lg:grid-cols-[1fr_0.95fr] lg:items-end">
        <div className="max-w-3xl space-y-4">
          <p className="text-[15px] font-semibold uppercase tracking-[0.16em] text-[#a33a2b]">
            {eyebrow}
          </p>
          <h1 className="font-serif text-[38px] leading-tight text-[#2f2a24] sm:text-[56px]">
            {title}
          </h1>
          {summary ? (
            <p className="max-w-2xl text-[18px] leading-9 text-[#5f5549]">
              {summary}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm"
                key={stat.value}
              >
                <Icon className="mb-4 size-6 text-[#a33a2b]" />
                <p className="font-serif text-[24px] leading-tight text-[#2f2a24]">
                  {stat.value}
                </p>
                <p className="mt-2 text-[15px] leading-6 text-[#6b4a2f]">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
