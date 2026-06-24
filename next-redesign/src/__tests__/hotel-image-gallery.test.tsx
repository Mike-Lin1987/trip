import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HotelsPage from "@/app/hotels/page";
import { hotelStays } from "@/data/hotels";

describe("hotel image gallery", () => {
  it("shows the selected hotel's portrait image and swaps it with the selector", () => {
    render(<HotelsPage />);

    const firstHotelImage = screen.getByRole("img", {
      name: hotelStays[0].imageAlt,
    });

    expect(firstHotelImage).toHaveAttribute("src", hotelStays[0].image);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "kagari-kisshotei" },
    });

    const onsenHotel = hotelStays.find((hotel) => hotel.id === "kagari-kisshotei");
    expect(onsenHotel).toBeDefined();

    const onsenImage = screen.getByRole("img", {
      name: onsenHotel?.imageAlt ?? "",
    });

    expect(onsenImage).toHaveAttribute("src", onsenHotel?.image);
  });
});
