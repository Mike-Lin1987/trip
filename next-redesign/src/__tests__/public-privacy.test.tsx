import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TravelPasswordGate } from "@/components/auth/TravelPasswordGate";
import { hashTravelPassword } from "@/lib/travel-password";

describe("travel password privacy gate", () => {
  it("hides private hotel and flight details until the travel password is entered", async () => {
    const expectedPasswordHash = await hashTravelPassword("private-trip");

    render(
      <TravelPasswordGate expectedPasswordHash={expectedPasswordHash}>
        <main>
          <h1>關西機場華盛頓酒店</h1>
          <p>高雄組 CI176 出發 15:25</p>
        </main>
      </TravelPasswordGate>,
    );

    expect(screen.getByText("孝親紅葉慢旅")).toBeInTheDocument();
    expect(screen.queryByText("關西機場華盛頓酒店")).not.toBeInTheDocument();
    expect(screen.queryByText(/CI176/)).not.toBeInTheDocument();

    fireEvent.change(await screen.findByLabelText("旅行密碼"), {
      target: { value: "private-trip" },
    });
    fireEvent.click(screen.getByRole("button", { name: "進入旅程" }));

    expect(await screen.findByText("關西機場華盛頓酒店")).toBeInTheDocument();
    expect(screen.getByText(/CI176/)).toBeInTheDocument();
  });
});
