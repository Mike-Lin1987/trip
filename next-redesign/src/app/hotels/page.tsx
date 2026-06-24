import { Bath, BedDouble, Coffee, Luggage, Moon } from "lucide-react";
import { HotelStaySelector } from "@/components/hotels/HotelStaySelector";
import { TravelPageHero } from "@/components/layout/TravelPageHero";
import { hotelStays } from "@/data/hotels";
import { onsenStay, restSpots } from "@/data/homepage";

const hotelHeroStats = [
  {
    value: "7 晚、5 個住宿點",
    label: "依照 2026 行程順序切換",
    icon: BedDouble,
  },
  {
    value: "D5-6 溫泉恢復段",
    label: "山中溫泉與鶴仙溪整合在住宿頁",
    icon: Bath,
  },
  {
    value: "行李與休息先排好",
    label: "讓長輩移動壓力降到最低",
    icon: Luggage,
  },
];

export default function HotelsPage() {
  return (
    <main className="travel-paper min-h-screen bg-[#f8f4ec] pb-20 md:pb-0">
      <TravelPageHero
        eyebrow="住宿節奏手帖"
        title="飯店介紹與溫泉住宿"
        summary="住宿不是附錄，而是這趟孝親慢旅的體力管理：先降壓、再賞楓，最後用溫泉恢復。"
        stats={hotelHeroStats}
      />

      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="mb-5 rounded-[8px] border border-[#d8c3a3] bg-[#fffaf1] p-5 text-[17px] leading-8 text-[#5f5549] shadow-sm">
          <h2 className="mb-2 font-serif text-[28px] text-[#2f2a24]">
            完整住宿資訊
          </h2>
          <p>
            密碼解鎖後顯示實際飯店名稱、Google Maps 定位、交通銜接與孝親住宿重點。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm">
            <Luggage className="mb-3 size-7 text-[#a33a2b]" />
            <h2 className="text-[21px] font-semibold text-[#2f2a24]">
              抵達日不硬撐
            </h2>
            <p className="mt-2 text-[16px] leading-7 text-[#5f5549]">
              第一晚住機場旁，讓晚班機與行李壓力先降下來。
            </p>
          </div>
          <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm">
            <Coffee className="mb-3 size-7 text-[#607348]" />
            <h2 className="text-[21px] font-semibold text-[#2f2a24]">
              飯店就是休息點
            </h2>
            <p className="mt-2 text-[16px] leading-7 text-[#5f5549]">
              京都、金澤都選回飯店方便的位置，不把行程排到滿。
            </p>
          </div>
          <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm">
            <Bath className="mb-3 size-7 text-[#a33a2b]" />
            <h2 className="text-[21px] font-semibold text-[#2f2a24]">
              溫泉段集中恢復
            </h2>
            <p className="mt-2 text-[16px] leading-7 text-[#5f5549]">
              山中溫泉連泊兩晚，溪谷散策與泡湯都放慢。
            </p>
          </div>
          <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm">
            <Moon className="mb-3 size-7 text-[#607348]" />
            <h2 className="text-[21px] font-semibold text-[#2f2a24]">
              回程前整理行李
            </h2>
            <p className="mt-2 text-[16px] leading-7 text-[#5f5549]">
              最後一晚住新大阪，保留打包與隔天移動緩衝。
            </p>
          </div>
        </div>
      </section>

      <HotelStaySelector
        hotels={hotelStays}
        onsenStay={onsenStay}
        restSpots={restSpots}
      />
    </main>
  );
}
