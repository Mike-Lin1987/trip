import { describe, expect, it } from "vitest";
import { checklist2026 } from "@/data/checklist-2026";
import {
  DEFAULT_PACE_MODE,
  destinations,
  itinerary2026,
} from "@/data/itinerary-2026";
import {
  getAdjacentItineraryDays,
  getItineraryDayBySlug,
  getItineraryDaySlug,
  getPrimarySpotCount,
  hasCompleteSeniorInfo,
  isNightViewOptional,
} from "@/lib/trip-guards";

describe("2026 family trip data", () => {
  it("uses relaxed pace as the homepage default", () => {
    expect(DEFAULT_PACE_MODE).toBe("relaxed");
  });

  it("keeps each day to at most two main sightseeing spots", () => {
    const primaryCounts = itinerary2026.map((day) => ({
      day: day.day,
      primaryCount: getPrimarySpotCount(day),
    }));

    expect(primaryCounts).toEqual([
      { day: 1, primaryCount: 0 },
      { day: 2, primaryCount: 2 },
      { day: 3, primaryCount: 2 },
      { day: 4, primaryCount: 1 },
      { day: 5, primaryCount: 2 },
      { day: 6, primaryCount: 1 },
      { day: 7, primaryCount: 0 },
      { day: 8, primaryCount: 0 },
    ]);
  });

  it("uses the confirmed 8 day 7 night trip window", () => {
    expect(itinerary2026).toHaveLength(8);
    expect(itinerary2026.at(0)).toMatchObject({
      day: 1,
      date: "2026-11-14",
    });
    expect(itinerary2026.at(-1)).toMatchObject({
      day: 8,
      date: "2026-11-21",
      title: "新大阪到關西機場，回台灣",
      city: "新大阪到關西機場",
    });
  });

  it("defines standard, low-energy, and rainy-day plans for every day", () => {
    itinerary2026.forEach((day) => {
      expect(Object.keys(day.plans)).toEqual(["standard", "lowEnergy", "rainy"]);
      expect(day.plans.standard.label).toBe("標準版");
      expect(day.plans.lowEnergy.label).toBe("低體力版");
      expect(day.plans.rainy.label).toBe("雨天版");

      Object.values(day.plans).forEach((plan) => {
        expect(plan.walkingLoad).toMatch(/步行負擔/);
        expect(plan.taxiAdvice).toMatch(/計程車/);
        expect(plan.restStops.length).toBeGreaterThan(0);
        expect(plan.toiletCoffeeBackups.length).toBeGreaterThan(0);
      });
    });
  });

  it("treats night autumn views as optional instead of mandatory", () => {
    const nightViews = itinerary2026.flatMap((day) => day.optionalNightViews);

    expect(nightViews).toHaveLength(3);
    expect(nightViews.every(isNightViewOptional)).toBe(true);
  });

  it("includes senior-friendly metadata for every destination", () => {
    expect(destinations).toHaveLength(7);
    expect(destinations.every(hasCompleteSeniorInfo)).toBe(true);
  });

  it("uses Google Maps links instead of destination images", () => {
    expect(
      destinations.every((destination) =>
        destination.mapUrl.startsWith("https://www.google.com/maps/search/"),
      ),
    ).toBe(true);
    expect(destinations.every((destination) => "image" in destination)).toBe(false);
    expect(destinations.every((destination) => "imageAlt" in destination)).toBe(false);
  });

  it("imports PDF checklist tasks into planning categories", () => {
    expect(checklist2026.map((task) => task.category)).toEqual([
      "system",
      "system",
      "tickets",
      "tickets",
      "tickets",
      "hotel",
      "hotel",
      "hotel",
      "luggage",
      "luggage",
      "packing",
    ]);
  });

  it("creates stable detail page slugs for each itinerary day", () => {
    expect(itinerary2026.map(getItineraryDaySlug)).toEqual([
      "day-1",
      "day-2",
      "day-3",
      "day-4",
      "day-5",
      "day-6",
      "day-7",
      "day-8",
    ]);
    expect(getItineraryDayBySlug("day-5")?.day).toBe(5);
    expect(getItineraryDayBySlug("unknown")).toBeUndefined();
  });

  it("finds previous and next itinerary detail pages", () => {
    expect(getAdjacentItineraryDays("day-1")).toEqual({
      previous: null,
      next: itinerary2026[1],
    });
    expect(getAdjacentItineraryDays("day-4")).toEqual({
      previous: itinerary2026[2],
      next: itinerary2026[4],
    });
    expect(getAdjacentItineraryDays("day-7")).toEqual({
      previous: itinerary2026[5],
      next: itinerary2026[7],
    });
    expect(getAdjacentItineraryDays("day-8")).toEqual({
      previous: itinerary2026[6],
      next: null,
    });
  });
});
