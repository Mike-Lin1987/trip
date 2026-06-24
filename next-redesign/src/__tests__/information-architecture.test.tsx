import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DestinationsPage from "@/app/destinations/page";
import ItineraryPage from "@/app/itinerary/page";
import { PageIntro } from "@/components/layout/SectionHeading";
import { mobileNavItems, siteNavItems } from "@/data/navigation";
import { destinations } from "@/data/itinerary-2026";

describe("information architecture consolidation", () => {
  it("removes the top description from page intro blocks", () => {
    render(
      <PageIntro
        eyebrow="Test"
        title="測試頁面"
        description="這段備註不應顯示"
      />,
    );

    expect(screen.getByRole("heading", { name: "測試頁面" })).toBeInTheDocument();
    expect(screen.queryByText("這段備註不應顯示")).not.toBeInTheDocument();
  });

  it("removes standalone highlight, autumn, and map entries from navigation", () => {
    const desktopHrefs = siteNavItems.map((item) => item.href);
    const mobileHrefs = mobileNavItems.map((item) => item.href);

    expect(desktopHrefs).not.toContain("/highlights");
    expect(desktopHrefs).not.toContain("/autumn-timeline");
    expect(desktopHrefs).not.toContain("/map");
    expect(mobileHrefs).not.toContain("/map");
    expect(mobileHrefs).not.toContain("/");
    expect(mobileHrefs).toContain("/destinations");
    expect(mobileHrefs).toContain("/transport");
    expect(desktopHrefs).toContain("/photos");
    expect(mobileHrefs).toContain("/photos");
  });

  it("removes the daily pace module and embeds route map content in itinerary", () => {
    render(<ItineraryPage />);

    expect(screen.queryByText("Daily Pace")).not.toBeInTheDocument();
    expect(screen.queryByText("輕鬆版 / 標準版 / 深度版")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "關西機場 → 京都 → 金澤 → 山中溫泉 → 新大阪 → 關西機場",
      }),
    ).toBeInTheDocument();
  });

  it("embeds highlights and autumn timing inside destinations", () => {
    render(<DestinationsPage />);

    expect(screen.getByText("京都夜楓")).toBeInTheDocument();
    expect(screen.getByText("紅葉最佳時期 Timeline")).toBeInTheDocument();
    expect(screen.getByText("11 月中旬到 12 月上旬")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Google Maps 定位/ })).toHaveLength(
      destinations.length,
    );
  });
});
