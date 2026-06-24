import type { ItineraryDay } from "@/types/trip";

export type TripReminder = {
  date: string;
  day: number;
  title: string;
  city: string;
  stay: string;
  transport: string;
  packing: string[];
  mustDo: string[];
  nextDay?: {
    day: number;
    title: string;
    transport: string;
    stay: string;
  };
};

const defaultPacking = [
  "交通票券與護照放隨身包",
  "行動電源與長輩常用藥",
  "雨具、水壺與薄外套",
];

export function buildTripReminders(days: ItineraryDay[]): TripReminder[] {
  return days.map((day, index) => toTripReminder(day, days[index + 1]));
}

export function getTripReminderForDate(
  date: string,
  days: ItineraryDay[],
): TripReminder | null {
  const day = days.find((item) => item.date === date);

  if (!day) {
    return null;
  }

  return toTripReminder(day, days[days.indexOf(day) + 1]);
}

export function getDefaultReminderDate(
  days: ItineraryDay[],
  now = new Date(),
): string {
  const today = toDateKey(now);

  if (days.some((day) => day.date === today)) {
    return today;
  }

  const nextDay = days.find((day) => day.date > today);

  return nextDay?.date ?? days.at(-1)?.date ?? today;
}

function toTripReminder(
  day: ItineraryDay,
  nextDay?: ItineraryDay,
): TripReminder {
  return {
    date: day.date,
    day: day.day,
    title: day.title,
    city: day.city,
    stay: day.todayStay,
    transport: day.todayTransport,
    packing: day.luggageNotes?.length ? day.luggageNotes : defaultPacking,
    mustDo: day.mustDo,
    nextDay: nextDay
      ? {
          day: nextDay.day,
          title: nextDay.title,
          transport: nextDay.todayTransport,
          stay: nextDay.todayStay,
        }
      : undefined,
  };
}

function toDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}
