import { describe, expect, it } from "vitest";
import {
  ACCOUNTING_TRIP_ID,
  buildDailyExchangeRateRows,
  formatJpyToTwdRate,
} from "@/features/accounting/exchangeRates";
import { itinerary2026 } from "@/data/itinerary-2026";

describe("exchange rate helpers", () => {
  it("formats stored per-1-JPY rates as the spec's per-100-JPY label", () => {
    expect(formatJpyToTwdRate(0.215)).toBe("100 JPY = 21.50 TWD");
    expect(formatJpyToTwdRate(undefined)).toBe("尚未設定");
  });

  it("builds one reference-rate row for each itinerary day", () => {
    const rows = buildDailyExchangeRateRows({
      itineraryDays: itinerary2026.slice(0, 2),
      rates: [
        {
          tripId: ACCOUNTING_TRIP_ID,
          rateDate: "2026-11-15",
          sourceCurrency: "JPY",
          targetCurrency: "TWD",
          referenceRate: 0.215,
          cardRate: 0.218,
          sourceName: "manual",
        },
      ],
      defaultRate: 0.215,
    });

    expect(rows).toEqual([
      expect.objectContaining({
        dayNumber: 1,
        rateDate: "2026-11-14",
        city: "關西機場",
        referenceRate: 0.215,
        displayRate: "100 JPY = 21.50 TWD",
      }),
      expect.objectContaining({
        dayNumber: 2,
        rateDate: "2026-11-15",
        city: "京都",
        referenceRate: 0.215,
        cardRate: 0.218,
        displayRate: "100 JPY = 21.50 TWD",
      }),
    ]);
  });

});
