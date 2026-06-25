import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TravelPasswordLogin } from "@/components/auth/TravelPasswordLogin";
import { getSafeNextPath } from "@/lib/safe-next-path";

const navigationMock = vi.hoisted(() => ({
  routerReplace: vi.fn(),
  routerRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: navigationMock.routerReplace,
    refresh: navigationMock.routerRefresh,
  }),
}));

describe("TravelPasswordLogin", () => {
  beforeEach(() => {
    localStorage.clear();
    navigationMock.routerReplace.mockReset();
    navigationMock.routerRefresh.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("submits the password to the server and stores no client unlock flag", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    render(<TravelPasswordLogin nextPath="/hotels" />);

    fireEvent.change(await screen.findByLabelText("旅行密碼"), {
      target: { value: "open-sesame" },
    });
    fireEvent.click(screen.getByRole("button", { name: "進入旅程" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/travel-session",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ password: "open-sesame" }),
        }),
      );
    });
    expect(navigationMock.routerReplace).toHaveBeenCalledWith("/hotels");
    expect(navigationMock.routerRefresh).toHaveBeenCalled();
    expect(localStorage.getItem("hokuriku-2026-travel-unlocked")).toBeNull();
  });

  it("shows an error when the server rejects the password", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid_password" }), {
        status: 401,
      }),
    );

    render(<TravelPasswordLogin />);

    fireEvent.change(await screen.findByLabelText("旅行密碼"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "進入旅程" }));

    expect(await screen.findByText("密碼不正確，請再確認。")).toBeInTheDocument();
    expect(navigationMock.routerReplace).not.toHaveBeenCalled();
  });

  it("keeps post-login redirects on same-origin paths", () => {
    expect(getSafeNextPath("/trip/hokuriku-2026/expenses?day=1")).toBe(
      "/trip/hokuriku-2026/expenses?day=1",
    );
    expect(getSafeNextPath("https://evil.example")).toBe("/");
    expect(getSafeNextPath("//evil.example/path")).toBe("/");
    expect(getSafeNextPath("/login?next=/hotels")).toBe("/");
  });
});
