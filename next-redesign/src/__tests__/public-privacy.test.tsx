// @vitest-environment node

import { webcrypto } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { hashTravelPassword } from "@/lib/travel-password";
import {
  createTravelSessionToken,
  TRAVEL_SESSION_COOKIE_NAME,
} from "@/lib/travel-session";

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}

describe("travel password privacy boundary", () => {
  beforeEach(async () => {
    process.env.TRAVEL_PASSWORD_HASH = await hashTravelPassword("private-trip");
    process.env.TRAVEL_SESSION_SECRET =
      "test-travel-session-secret-32-characters";
    process.env.TRAVEL_SESSION_TTL_SECONDS = "1209600";
  });

  it("redirects private routes before page rendering when no session cookie exists", async () => {
    const response = await proxy(
      new NextRequest("https://trip.example/hotels?night=1"),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/hotels?night=1");
  });

  it("does not trust the old client-side unlock flag", async () => {
    const response = await proxy(
      new NextRequest("https://trip.example/hotels", {
        headers: {
          cookie: "hokuriku-2026-travel-unlocked=unlocked",
        },
      }),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/hotels");
  });

  it("allows a request with a signed server session cookie", async () => {
    const token = await createTravelSessionToken();
    const response = await proxy(
      new NextRequest("https://trip.example/hotels", {
        headers: {
          cookie: `${TRAVEL_SESSION_COOKIE_NAME}=${token}`,
        },
      }),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects authenticated visitors away from the login page", async () => {
    const token = await createTravelSessionToken();
    const response = await proxy(
      new NextRequest("https://trip.example/login", {
        headers: {
          cookie: `${TRAVEL_SESSION_COOKIE_NAME}=${token}`,
        },
      }),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.pathname).toBe("/");
  });
});
