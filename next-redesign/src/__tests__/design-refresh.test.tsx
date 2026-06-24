import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { RelaxedItineraryTimeline } from "@/components/trip/RelaxedItineraryTimeline";
import { itinerary2026 } from "@/data/itinerary-2026";

describe("travel handbook design refresh", () => {
  it("turns the homepage into a travel summary dashboard", () => {
    render(<Home />);

    expect(screen.getByText("旅行摘要儀表板")).toBeInTheDocument();
    expect(screen.getByText("8 天")).toBeInTheDocument();
    expect(screen.getByText("7 晚・5 個住宿點")).toBeInTheDocument();
    expect(screen.getByText("夜楓 optional")).toBeInTheDocument();
    expect(
      screen.getByText("關西機場 → 京都 → 金澤 → 山中溫泉 → 新大阪 → 關西機場"),
    ).toBeInTheDocument();
    expect(screen.queryByText("每個項目拆成單獨頁面")).not.toBeInTheDocument();
  });

  it("shows each selected itinerary day as a daily travel note", () => {
    render(<RelaxedItineraryTimeline days={itinerary2026} />);

    expect(screen.getByText("當日手帖")).toBeInTheDocument();
    expect(screen.getByText("今日交通")).toBeInTheDocument();
    expect(screen.getByText("今日行李提醒")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "標準版" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "低體力版" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "雨天版" })).toBeInTheDocument();
    expect(screen.getByText("台灣出發，南北家人在關西機場會合")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("選擇日期"), {
      target: { value: "5" },
    });

    expect(screen.getByText("金澤到山中溫泉")).toBeInTheDocument();
    expect(screen.getByText("提早前往山中溫泉 Kagari 吉祥亭 Check-in")).toBeInTheDocument();
    expect(screen.queryByText("台灣出發，南北家人在關西機場會合")).not.toBeInTheDocument();
  });
});
