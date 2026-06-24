"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PACE_MODE } from "@/data/itinerary-2026";
import type { PaceMode } from "@/types/trip";

const paceCopy: Record<
  PaceMode,
  {
    label: string;
    description: string;
    detail: string;
  }
> = {
  relaxed: {
    label: "輕鬆版",
    description: "每天 1-2 個主要景點，夜楓全部 optional。",
    detail: "適合爸媽同行，以飯店休息、計程車補位、溫泉恢復體力為優先。",
  },
  standard: {
    label: "標準版",
    description: "每天最多 2 個主景點，保留午後休息。",
    detail: "保留京都、金澤、山中溫泉主軸，但不把購物與夜景塞滿。",
  },
  deep: {
    label: "深度版",
    description: "增加茶屋街、寺院與夜楓備案。",
    detail: "只在全員體力好、天氣穩定時啟用，仍不取代休息時間。",
  },
};

export function DailyPaceSelector() {
  const [mode, setMode] = useState<PaceMode>(DEFAULT_PACE_MODE);
  const selected = useMemo(() => paceCopy[mode], [mode]);

  return (
    <section
      className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm sm:p-6"
      aria-labelledby="pace-heading"
    >
      <div className="mb-4 space-y-2">
        <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
          Daily Pace
        </p>
        <h2
          id="pace-heading"
          className="font-serif text-[28px] leading-tight text-[#2f2a24] sm:text-[34px]"
        >
          輕鬆版 / 標準版 / 深度版
        </h2>
      </div>
      <div
        className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
        role="group"
        aria-label="選擇行程節奏"
      >
        {(Object.keys(paceCopy) as PaceMode[]).map((pace) => (
          <Button
            key={pace}
            type="button"
            variant="outline"
            aria-pressed={mode === pace}
            onClick={() => setMode(pace)}
            className="h-auto min-h-14 justify-start rounded-[8px] border-[#e6d8c3] px-4 py-3 text-left text-[17px] aria-pressed:border-[#a33a2b] aria-pressed:bg-[#a33a2b] aria-pressed:text-white"
          >
            <span className="font-semibold">{paceCopy[pace].label}</span>
          </Button>
        ))}
      </div>
      <div className="mt-4 rounded-[8px] bg-[#f8f4ec] p-4 text-[17px] leading-8 text-[#5f5549]">
        <p className="font-semibold text-[#2f2a24]">{selected.description}</p>
        <p>{selected.detail}</p>
      </div>
    </section>
  );
}
