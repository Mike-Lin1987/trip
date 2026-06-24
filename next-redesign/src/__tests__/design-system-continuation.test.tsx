import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ChecklistPage from "@/app/checklist/page";
import DestinationsPage from "@/app/destinations/page";
import HotelsPage from "@/app/hotels/page";
import ItineraryPage from "@/app/itinerary/page";
import Home from "@/app/page";
import TransportPage from "@/app/transport/page";

describe("travel magazine design continuation", () => {
  it("frames destinations as an autumn field guide", () => {
    render(<DestinationsPage />);

    expect(screen.getByText("賞楓導覽手帖")).toBeInTheDocument();
    expect(screen.getByText("7 個孝親友善景點")).toBeInTheDocument();
    expect(screen.getByText("夜楓只做備案")).toBeInTheDocument();
    expect(screen.getByText("紅葉期集中在 11 月中旬到 12 月上旬")).toBeInTheDocument();
  });

  it("frames hotels as the recovery rhythm for the trip", () => {
    render(<HotelsPage />);

    expect(screen.getByText("住宿節奏手帖")).toBeInTheDocument();
    expect(screen.getByText("7 晚、5 個住宿點")).toBeInTheDocument();
    expect(screen.getByText("D5-6 溫泉恢復段")).toBeInTheDocument();
    expect(screen.getByText("行李與休息先排好")).toBeInTheDocument();
  });

  it("frames checklist as a departure control desk", () => {
    render(<ChecklistPage />);

    expect(screen.getByText("出發前控管台")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "出發準備手帖" })).toBeInTheDocument();
    expect(screen.getByText("勾選狀態保存在此裝置")).toBeInTheDocument();
    expect(screen.getByText("票券、飯店、行李分區管理")).toBeInTheDocument();
    expect(screen.queryByText(/2026_Family_Trip_Checklist/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "2026 孝親旅行準備清單" }),
    ).not.toBeInTheDocument();
  });

  it("uses quieter naming on the home, itinerary, and transport pages", () => {
    const home = render(<Home />);

    expect(screen.getByRole("heading", { name: "慢旅原則" })).toBeInTheDocument();
    expect(
      screen.queryByText("孝親行程先照顧體力，再安排風景"),
    ).not.toBeInTheDocument();

    home.unmount();
    const itinerary = render(<ItineraryPage />);
    expect(screen.getByRole("heading", { name: "每日行程手帖" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "每日行程只顯示當天" }),
    ).not.toBeInTheDocument();

    itinerary.unmount();
    render(<TransportPage />);
    expect(screen.getByRole("heading", { name: "交通手帖" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "完整交通與航班" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Thunderbird 京都\/大阪方向 → 敦賀/)).toBeInTheDocument();
    expect(screen.getByText(/敦賀 → 金澤/)).toBeInTheDocument();
    expect(screen.getByText(/加賀溫泉 → 敦賀：北陸新幹線/)).toBeInTheDocument();
    expect(screen.getByText("敦賀轉乘提醒")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "高雄組" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "台北組" })).toBeInTheDocument();
    expect(screen.getByText("CI176")).toBeInTheDocument();
    expect(screen.getByText("CI177")).toBeInTheDocument();
    expect(screen.getByText("CI172")).toBeInTheDocument();
    expect(screen.getByText("CI173")).toBeInTheDocument();
    expect(screen.getByText("出發 15:25")).toBeInTheDocument();
    expect(screen.getByText("抵達 17:50")).toBeInTheDocument();
    expect(screen.getAllByText(/航廈 1/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/宅配優先，若帶上車請依 JR-WEST 官方最新規則確認/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("heading", { name: "舒適交通與路線" }),
    ).not.toBeInTheDocument();
  });
});
