import type { DailyExchangeRate } from "./types";
import type { ItineraryDay } from "@/types/trip";

export const ACCOUNTING_TRIP_ID = "hokuriku-2026";
export const ACCOUNTING_DB_TRIP_ID = "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311";
export const DEFAULT_JPY_TO_TWD_RATE = 0.215;

export const seedDailyExchangeRates: DailyExchangeRate[] = [
  {
    tripId: ACCOUNTING_TRIP_ID,
    rateDate: "2026-11-15",
    sourceCurrency: "JPY",
    targetCurrency: "TWD",
    referenceRate: DEFAULT_JPY_TO_TWD_RATE,
    cardRate: 0.218,
    sourceName: "manual",
  },
];

export type DailyExchangeRateRow = DailyExchangeRate & {
  dayNumber: number;
  weekday: string;
  city: string;
  title: string;
  displayRate: string;
};

export function formatJpyToTwdRate(rate: number | undefined): string {
  if (rate === undefined) {
    return "尚未設定";
  }

  return `100 JPY = ${(rate * 100).toFixed(2)} TWD`;
}

export function buildDailyExchangeRateRows({
  itineraryDays,
  rates,
  defaultRate,
}: {
  itineraryDays: ItineraryDay[];
  rates: DailyExchangeRate[];
  defaultRate: number;
}): DailyExchangeRateRow[] {
  const ratesByDate = new Map(rates.map((rate) => [rate.rateDate, rate]));

  return itineraryDays.map((day) => {
    const rate = ratesByDate.get(day.date);
    const referenceRate = rate?.referenceRate ?? defaultRate;

    return {
      tripId: rate?.tripId ?? ACCOUNTING_TRIP_ID,
      rateDate: day.date,
      sourceCurrency: "JPY",
      targetCurrency: "TWD",
      referenceRate,
      cashRate: rate?.cashRate,
      cardRate: rate?.cardRate,
      customRate: rate?.customRate,
      sourceName: rate?.sourceName ?? "default",
      dayNumber: day.day,
      weekday: day.weekday,
      city: day.city,
      title: day.title,
      displayRate: formatJpyToTwdRate(referenceRate),
    };
  });
}
