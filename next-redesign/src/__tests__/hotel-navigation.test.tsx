import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HotelsPage from "@/app/hotels/page";
import { hotelStays } from "@/data/hotels";
import { siteNavItems } from "@/data/navigation";

describe("hotel introduction page", () => {
  it("replaces the trip-length and onsen pages with one hotel page in navigation", () => {
    const hrefs = siteNavItems.map((item) => item.href);

    expect(hrefs).toContain("/hotels");
    expect(hrefs).not.toContain("/plans");
    expect(hrefs).not.toContain("/onsen");
  });

  it("loads five complete private hotel stays", () => {
    expect(hotelStays).toHaveLength(5);
    expect(hotelStays.map((hotel) => hotel.name)).toEqual([
      "關西機場華盛頓酒店",
      "京都三條索拉利亞西鐵尊貴酒店",
      "金澤日航酒店",
      "山中溫泉 Kagari 吉祥亭",
      "karaksa hotel grande 新大阪 Tower",
    ]);
    expect(hotelStays.every((hotel) => hotel.englishName !== "Private stay")).toBe(
      true,
    );
    expect(hotelStays.every((hotel) => hotel.mapUrl.startsWith("https://"))).toBe(
      true,
    );
    expect(hotelStays.every((hotel) => typeof hotel.image === "string")).toBe(true);
    expect(hotelStays.every((hotel) => typeof hotel.imageAlt === "string")).toBe(
      true,
    );
  });

  it("uses a hotel dropdown and only shows the selected stay", () => {
    render(<HotelsPage />);

    expect(
      screen.getByRole("heading", { name: "飯店介紹與溫泉住宿" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("選擇住宿")).toHaveValue(
      "kansai-airport-washington",
    );
    expect(
      screen.getByRole("heading", { name: "關西機場華盛頓酒店" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Google Maps 定位/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "京都三條索拉利亞西鐵尊貴酒店",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "山中溫泉是這趟旅行的恢復段" }),
    ).not.toBeInTheDocument();
  });

  it("shows the onsen introduction only when Day 5-6 is selected", () => {
    render(<HotelsPage />);

    fireEvent.change(screen.getByLabelText("選擇住宿"), {
      target: { value: "kagari-kisshotei" },
    });

    expect(
      screen.getByRole("heading", { name: "山中溫泉 Kagari 吉祥亭" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "山中溫泉是這趟旅行的恢復段" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "溫泉介紹已合併在 D5-6 住宿段，讓山中溫泉 Kagari 吉祥亭、鶴仙溪、泡湯與休息安排一起看。",
      ),
    ).toBeInTheDocument();
  });
});
