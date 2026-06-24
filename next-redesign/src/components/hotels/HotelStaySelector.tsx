"use client";

import { useState } from "react";
import { Bath } from "lucide-react";
import { HotelStayCard } from "@/components/hotels/HotelStayCard";
import { OnsenStayCard } from "@/components/trip/OnsenStayCard";
import { RestSpotCard } from "@/components/trip/RestSpotCard";
import type { HotelStay, OnsenStay, RestSpot } from "@/types/trip";

type HotelStaySelectorProps = {
  hotels: HotelStay[];
  onsenStay: OnsenStay;
  restSpots: RestSpot[];
};

const onsenHotelId = "kagari-kisshotei";

export function HotelStaySelector({
  hotels,
  onsenStay,
  restSpots,
}: HotelStaySelectorProps) {
  const [selectedHotelId, setSelectedHotelId] = useState(hotels[0]?.id ?? "");
  const selectedIndex = Math.max(
    0,
    hotels.findIndex((hotel) => hotel.id === selectedHotelId),
  );
  const selectedHotel = hotels[selectedIndex];
  const isOnsenStay = selectedHotel?.id === onsenHotelId;

  if (!selectedHotel) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-5 pb-12 sm:px-8 lg:px-10">
      <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
        <label
          className="mb-3 block text-[17px] font-semibold text-[#2f2a24]"
          htmlFor="hotel-stay-select"
        >
          選擇住宿
        </label>
        <select
          id="hotel-stay-select"
          aria-label="選擇住宿"
          className="min-h-14 w-full rounded-[8px] border border-[#d8c3a3] bg-white px-4 text-[18px] font-semibold text-[#2f2a24] outline-none focus:ring-3 focus:ring-[#a33a2b]/25"
          value={selectedHotelId}
          onChange={(event) => setSelectedHotelId(event.target.value)}
        >
          {hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.dayRange}・{hotel.stayDates}｜{hotel.name}
            </option>
          ))}
        </select>
      </div>

      <HotelStayCard hotel={selectedHotel} index={selectedIndex} />

      {isOnsenStay ? (
        <div className="space-y-8 rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-4 sm:p-6">
          <div className="max-w-3xl space-y-3">
            <p className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
              <Bath className="size-4" />
              D5-6 Onsen Recovery
            </p>
            <h2 className="font-serif text-[34px] leading-tight text-[#2f2a24] sm:text-[46px]">
              山中溫泉是這趟旅行的恢復段
            </h2>
            <p className="text-[18px] leading-9 text-[#5f5549]">
              溫泉介紹已合併在 D5-6 住宿段，讓山中溫泉 Kagari 吉祥亭、鶴仙溪、泡湯與休息安排一起看。
            </p>
          </div>
          <OnsenStayCard stay={onsenStay} />
          <div className="grid gap-5 lg:grid-cols-3">
            {restSpots
              .filter((spot) => spot.area === "yamanaka-onsen")
              .map((spot) => (
                <RestSpotCard spot={spot} key={spot.name} />
              ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
