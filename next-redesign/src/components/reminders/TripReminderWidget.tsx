"use client";

import { TripReminderPanel } from "@/components/reminders/TripReminderPanel";
import { itinerary2026 } from "@/data/itinerary-2026";
import {
  buildTripReminders,
  getDefaultReminderDate,
} from "@/data/trip-reminders";

export function TripReminderWidget() {
  const reminders = buildTripReminders(itinerary2026);
  const reminderDate = getDefaultReminderDate(itinerary2026);

  return <TripReminderPanel today={reminderDate} reminders={reminders} />;
}
