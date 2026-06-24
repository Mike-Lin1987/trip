import { itinerary2026 } from "@/data/itinerary-2026";
import type { Destination, ItineraryDay, OptionalNightView } from "@/types/trip";

export function getPrimarySpotCount(day: ItineraryDay): number {
  return [...day.morning, ...day.afternoon, ...day.evening].filter(
    (block) => block.type === "sightseeing" && block.isMainSpot,
  ).length;
}

export function isNightViewOptional(nightView: OptionalNightView): boolean {
  return nightView.optional === true;
}

export function hasCompleteSeniorInfo(destination: Destination): boolean {
  const info = destination.seniorInfo;

  return Boolean(
    info &&
      info.walkingLoad &&
      info.stairs &&
      typeof info.stayMinutes === "number" &&
      typeof info.hasRestSpots === "boolean" &&
      typeof info.seniorFriendly === "boolean" &&
      typeof info.taxiRecommended === "boolean",
  );
}

export function getItineraryDaySlug(day: ItineraryDay): string {
  return `day-${day.day}`;
}

export function getItineraryDayBySlug(slug: string): ItineraryDay | undefined {
  const dayNumber = Number(slug.replace(/^day-/, ""));

  if (!Number.isInteger(dayNumber)) {
    return undefined;
  }

  return itinerary2026.find((day) => day.day === dayNumber);
}

export function getAdjacentItineraryDays(slug: string): {
  previous: ItineraryDay | null;
  next: ItineraryDay | null;
} {
  const current = getItineraryDayBySlug(slug);
  const index = current
    ? itinerary2026.findIndex((day) => day.day === current.day)
    : -1;

  if (index < 0) {
    return { previous: null, next: null };
  }

  return {
    previous: itinerary2026[index - 1] ?? null,
    next: itinerary2026[index + 1] ?? null,
  };
}
