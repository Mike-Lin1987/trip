// @vitest-environment node

import { webcrypto } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/travel-session/route";
import { hashTravelPassword } from "@/lib/travel-password";
import { TRAVEL_SESSION_COOKIE_NAME } from "@/lib/travel-session";

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}

describe("/api/travel-session", () => {
  beforeEach(async () => {
    process.env.TRAVEL_PASSWORD_HASH = await hashTravelPassword("private-trip");
    process.env.TRAVEL_SESSION_SECRET =
      "test-travel-session-secret-32-characters";
    process.env.TRAVEL_SESSION_TTL_SECONDS = "1209600";
  });

  it("sets an HttpOnly session cookie for the correct password", async () => {
    const response = await POST(
      new Request("https://trip.example/api/travel-session", {
        method: "POST",
        body: JSON.stringify({ password: "private-trip" }),
      }),
    );

    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${TRAVEL_SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=lax/i);
    expect(setCookie).toContain("Path=/");
  });

  it("rejects the wrong password without issuing a cookie", async () => {
    const response = await POST(
      new Request("https://trip.example/api/travel-session", {
        method: "POST",
        body: JSON.stringify({ password: "wrong-password" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("fails closed when the server auth settings are missing", async () => {
    delete process.env.TRAVEL_SESSION_SECRET;

    const response = await POST(
      new Request("https://trip.example/api/travel-session", {
        method: "POST",
        body: JSON.stringify({ password: "private-trip" }),
      }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
