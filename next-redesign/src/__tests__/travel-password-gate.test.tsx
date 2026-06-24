import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { TravelPasswordGate } from "@/components/auth/TravelPasswordGate";
import {
  hashTravelPassword,
  TRAVEL_PASSWORD_STORAGE_KEY,
} from "@/lib/travel-password";

describe("TravelPasswordGate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps trip content hidden until the correct password is entered", async () => {
    const expectedPasswordHash = await hashTravelPassword("open-sesame");

    render(
      <TravelPasswordGate expectedPasswordHash={expectedPasswordHash}>
        <main>私人行程內容</main>
      </TravelPasswordGate>,
    );

    expect(screen.queryByText("私人行程內容")).not.toBeInTheDocument();

    fireEvent.change(await screen.findByLabelText("旅行密碼"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "進入旅程" }));

    expect(await screen.findByText("密碼不正確，請再確認。")).toBeInTheDocument();
    expect(screen.queryByText("私人行程內容")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("旅行密碼"), {
      target: { value: "open-sesame" },
    });
    fireEvent.click(screen.getByRole("button", { name: "進入旅程" }));

    expect(await screen.findByText("私人行程內容")).toBeInTheDocument();
    expect(localStorage.getItem(TRAVEL_PASSWORD_STORAGE_KEY)).toBe("unlocked");
  });

  it("keeps the trip unlocked after a successful password session", async () => {
    localStorage.setItem(TRAVEL_PASSWORD_STORAGE_KEY, "unlocked");

    render(
      <TravelPasswordGate>
        <main>已解鎖行程</main>
      </TravelPasswordGate>,
    );

    expect(await screen.findByText("已解鎖行程")).toBeInTheDocument();
    expect(screen.queryByLabelText("旅行密碼")).not.toBeInTheDocument();
  });
});
