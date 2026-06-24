import { Armchair, CarTaxiFront, Footprints, Moon } from "lucide-react";

const features = [
  {
    title: "每天最多 2 個主景點",
    description: "景點少一點，留下喝茶、坐車、回飯店的餘裕。",
    icon: Footprints,
  },
  {
    title: "夜楓只做 Optional",
    description: "清水寺與永觀堂都很美，但不拿長輩體力冒險。",
    icon: Moon,
  },
  {
    title: "計程車補位",
    description: "遇到坡道、人潮、天冷，直接改用車接駁。",
    icon: CarTaxiFront,
  },
  {
    title: "休息點先規劃",
    description: "午餐、飯店、溫泉都被當成正式行程，不是空檔。",
    icon: Armchair,
  },
];

export function ParentFriendlyFeatureSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-5 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <div
            className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm"
            key={feature.title}
          >
            <Icon className="mb-5 size-8 text-[#a33a2b]" />
            <h2 className="mb-3 text-[22px] font-semibold leading-snug text-[#2f2a24]">
              {feature.title}
            </h2>
            <p className="text-[17px] leading-8 text-[#5f5549]">
              {feature.description}
            </p>
          </div>
        );
      })}
    </section>
  );
}
