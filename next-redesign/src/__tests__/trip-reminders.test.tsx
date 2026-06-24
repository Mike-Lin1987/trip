import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TripReminderPanel } from "@/components/reminders/TripReminderPanel";
import { TripReminderWidget } from "@/components/reminders/TripReminderWidget";
import {
  buildTripReminders,
  getTripReminderForDate,
} from "@/data/trip-reminders";
import { itinerary2026 } from "@/data/itinerary-2026";

describe("trip reminders", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds stay, transport, packing, must-do, and next-day reminders from itinerary data", () => {
    const reminder = getTripReminderForDate("2026-11-15", itinerary2026);

    expect(reminder).toMatchObject({
      date: "2026-11-15",
      day: 2,
      stay: "京都三條索拉利亞西鐵尊貴酒店",
      transport:
        "Haruka 到京都後，計程車銜接京都三條索拉利亞西鐵尊貴酒店寄放行李",
      nextDay: expect.objectContaining({
        day: 3,
      }),
    });
    expect(reminder?.mustDo).toEqual(
      expect.arrayContaining(["寄放大行李", "東寺御守", "伏見稻荷只走前段"]),
    );
    expect(reminder?.packing).toEqual(
      expect.arrayContaining(["交通票券與護照放隨身包", "行動電源與長輩常用藥"]),
    );
  });

  it("returns null for dates outside the trip", () => {
    expect(getTripReminderForDate("2026-12-01", itinerary2026)).toBeNull();
  });

  it("renders today's reminder and an empty state", () => {
    const reminders = buildTripReminders(itinerary2026);

    render(<TripReminderPanel today="2026-11-15" reminders={reminders} />);

    expect(screen.getByRole("heading", { name: "今日提醒" })).toBeInTheDocument();
    expect(screen.getByText("京都三條索拉利亞西鐵尊貴酒店")).toBeInTheDocument();
    expect(screen.getByText("隔日提醒")).toBeInTheDocument();

    render(<TripReminderPanel today="2026-12-01" reminders={reminders} />);

    expect(screen.getByText("今天沒有旅行提醒。")).toBeInTheDocument();
  });

  it("chooses the reminder date at browser runtime instead of build time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-18T08:00:00+09:00"));

    render(<TripReminderWidget />);

    expect(screen.getByText(/Day 5/)).toBeInTheDocument();
    expect(screen.getByText("山中溫泉 Kagari 吉祥亭")).toBeInTheDocument();
  });
});
