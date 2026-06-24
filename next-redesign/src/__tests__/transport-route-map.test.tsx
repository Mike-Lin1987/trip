import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TransportPage from "@/app/transport/page";

describe("transport route map", () => {
  it("shows the Kansai Hokuriku route map image in the transport page", () => {
    render(<TransportPage />);

    const routeMap = screen.getByRole("img", {
      name: "關西北陸行程地圖",
    });

    expect(routeMap).toHaveAttribute(
      "src",
      "/images/trip-assets/kansai-hokuriku-route-map.webp",
    );
  });
});
