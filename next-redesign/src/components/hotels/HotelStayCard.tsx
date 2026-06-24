import { Bath, BedDouble, Check, ExternalLink, MapPin, Train } from "lucide-react";
import type { HotelStay } from "@/types/trip";

type HotelStayCardProps = {
  hotel: HotelStay;
  index: number;
};

export function HotelStayCard({ hotel, index }: HotelStayCardProps) {
  return (
    <article className="overflow-hidden rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-9 items-center rounded-[8px] bg-[#a33a2b] px-3 font-serif text-[20px] text-white">
            {index + 1}
          </span>
          <span className="inline-flex min-h-9 items-center rounded-[8px] bg-[#607348]/12 px-3 text-[15px] font-semibold text-[#445433]">
            {hotel.dayRange}
          </span>
          <span className="inline-flex min-h-9 items-center rounded-[8px] bg-[#f8f4ec] px-3 text-[15px] font-semibold text-[#8a5a3b]">
            {hotel.stayDates}
          </span>
        </div>

        <p className="mb-2 flex items-center gap-2 text-[16px] font-semibold text-[#8a5a3b]">
          <MapPin className="size-4" />
          {hotel.city}
        </p>
        <h2 className="font-serif text-[30px] leading-tight text-[#2f2a24] sm:text-[36px]">
          {hotel.name}
        </h2>
        <p className="mt-1 text-[16px] leading-7 text-[#7a6d5f]">
          {hotel.englishName}
        </p>
        {hotel.mapUrl ? (
          <a
            className="mt-4 inline-flex min-h-9 w-fit items-center gap-2 rounded-[8px] border border-[#d9c6a8] bg-white px-3 text-[15px] font-semibold text-[#6b4a2f] transition hover:border-[#a33a2b] hover:text-[#a33a2b]"
            href={hotel.mapUrl}
            rel="noreferrer"
            target="_blank"
          >
            <MapPin className="size-4" />
            Google Maps 定位
            <ExternalLink className="size-4" />
          </a>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={hotel.imageAlt}
            className="aspect-[3/4] w-full object-cover object-top"
            loading="lazy"
            decoding="async"
            width={900}
            height={1200}
            src={hotel.image}
          />
        </div>

        <div className="mt-5 grid gap-3 text-[17px] leading-8 text-[#5f5549]">
          <p className="flex gap-3">
            <Train className="mt-1 size-5 shrink-0 text-[#a33a2b]" />
            {hotel.accessNote}
          </p>
          <p className="flex gap-3">
            <BedDouble className="mt-1 size-5 shrink-0 text-[#607348]" />
            {hotel.familyFriendlyNote}
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-[17px] font-semibold text-[#2f2a24]">
              飯店亮點
            </h3>
            <ul className="space-y-2 text-[16px] leading-7 text-[#5f5549]">
              {hotel.features.map((feature) => (
                <li className="flex gap-2" key={feature}>
                  <Check className="mt-1 size-4 shrink-0 text-[#607348]" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-[17px] font-semibold text-[#2f2a24]">
              孝親安排
            </h3>
            <ul className="space-y-2 text-[16px] leading-7 text-[#5f5549]">
              {hotel.seniorNotes.map((note) => (
                <li className="flex gap-2" key={note}>
                  <Check className="mt-1 size-4 shrink-0 text-[#a33a2b]" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {hotel.onsenHighlights ? (
          <div className="mt-5 rounded-[8px] bg-[#f8f4ec] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[17px] font-semibold text-[#2f2a24]">
              <Bath className="size-5 text-[#a33a2b]" />
              溫泉與大浴場
            </h3>
            <ul className="space-y-2 text-[16px] leading-7 text-[#5f5549]">
              {hotel.onsenHighlights.map((highlight) => (
                <li className="flex gap-2" key={highlight}>
                  <Check className="mt-1 size-4 shrink-0 text-[#607348]" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}
