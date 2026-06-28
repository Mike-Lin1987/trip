import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AutumnSlowTravelHero } from "@/components/home/AutumnSlowTravelHero";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { heroImage } from "@/data/homepage";
import { RelaxedItineraryTimeline } from "@/components/trip/RelaxedItineraryTimeline";
import { itinerary2026 } from "@/data/itinerary-2026";
import { mobileNavItems, siteNavItems } from "@/data/navigation";

describe("homepage components", () => {
  it("renders the slow-travel hero copy and primary CTA", () => {
    render(<AutumnSlowTravelHero />);

    expect(
      screen.getByRole("heading", {
        name: "京都・金澤・山中溫泉｜孝親紅葉慢旅",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "寺院紅葉、庭園散策、溪谷溫泉，規劃一趟爸媽也舒服的秋日日本旅行",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "查看每日行程" }),
    ).toHaveAttribute("href", "/itinerary");
    expect(screen.getByText("8 天 7 夜")).toBeInTheDocument();
  });

  it("uses the local Kagari Kisshotei image as the homepage background", () => {
    expect(heroImage).toBe("/images/yamanaka-onsen.webp");
  });

  it("keeps the page navigation links comfortable for mobile tapping", () => {
    render(
      <>
        <SiteHeader />
        <MobileBottomNav />
      </>,
    );

    expect(
      screen.getByRole("link", { name: "孝親紅葉慢旅" }),
    ).toHaveClass("rounded-full");
    expect(
      screen.getByRole("button", { name: "開啟導覽選單" }),
    ).toHaveClass("rounded-full");

    siteNavItems.forEach((item) => {
      expect(screen.getAllByRole("link", { name: item.label })[0]).toHaveClass(
        "rounded-full",
      );
    });
    mobileNavItems.forEach((item) => {
      const mobileLink = screen.getAllByRole("link", { name: item.label }).at(-1);
      expect(mobileLink).toHaveClass("rounded-[8px]");
      expect(mobileLink).toHaveClass("min-h-[3.55rem]");
    });
  });

  it("uses standalone pages instead of one-page anchor navigation", () => {
    expect(siteNavItems.map((item) => item.href)).toEqual([
      "/itinerary",
      "/destinations",
      "/transport",
      "/hotels",
      "/checklist",
      "/trip/hokuriku-2026/expenses",
    ]);
  });

  it("adds a today focus card for practical travel use", () => {
    render(<AutumnSlowTravelHero />);

    expect(screen.getByText("今日重點卡")).toBeInTheDocument();
    expect(screen.getByText("今日住宿")).toBeInTheDocument();
    expect(screen.getByText("今日交通")).toBeInTheDocument();
    expect(screen.getByText("行李提醒")).toBeInTheDocument();
    expect(screen.getByText("今日必做事項")).toBeInTheDocument();
  });

  it("shows only the selected day in the itinerary dropdown", () => {
    render(<RelaxedItineraryTimeline days={itinerary2026} />);

    expect(screen.getByLabelText("選擇日期")).toHaveValue("1");
    expect(screen.getByRole("link", { name: "查看 Day 1 詳情" })).toHaveAttribute(
      "href",
      "/itinerary/day-1",
    );
    expect(screen.getByText("關西機場會合，關西機場華盛頓酒店休息")).toBeInTheDocument();
    expect(screen.queryByText("京都慢啟動，東寺與伏見稻荷")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("選擇日期"), {
      target: { value: "2" },
    });

    expect(screen.getByLabelText("選擇日期")).toHaveValue("2");
    expect(screen.getByRole("link", { name: "查看 Day 2 詳情" })).toHaveAttribute(
      "href",
      "/itinerary/day-2",
    );
    expect(screen.getByText("京都慢啟動，東寺與伏見稻荷")).toBeInTheDocument();
    expect(screen.queryByText("關西機場會合，關西機場華盛頓酒店休息")).not.toBeInTheDocument();
  });
});
