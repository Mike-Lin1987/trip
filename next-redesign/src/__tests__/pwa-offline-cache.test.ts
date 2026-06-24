import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const publicDir = path.join(process.cwd(), "public");
const swPath = path.join(publicDir, "sw.js");

function readServiceWorkerSource() {
  return readFileSync(swPath, "utf8");
}

describe("offline itinerary cache policy", () => {
  it("ships a public service worker with a versioned cache", () => {
    expect(existsSync(swPath)).toBe(true);

    const source = readServiceWorkerSource();

    expect(source).toMatch(/CACHE_VERSION\s*=/);
    expect(source).toContain("hokuriku-itinerary");
  });

  it("pre-caches only installable trip reading routes and static PWA assets", () => {
    const source = readServiceWorkerSource();

    for (const route of [
      "/",
      "/itinerary",
      "/itinerary/day-1",
      "/itinerary/day-2",
      "/itinerary/day-3",
      "/itinerary/day-4",
      "/itinerary/day-5",
      "/itinerary/day-6",
      "/itinerary/day-7",
      "/itinerary/day-8",
      "/hotels",
      "/transport",
      "/manifest.webmanifest",
      "/pwa-icon-192.png",
      "/pwa-icon-512.png",
      "/pwa-maskable-512.png",
      "/apple-touch-icon.png",
    ]) {
      expect(source).toContain(`"${route}"`);
    }
  });

  it("excludes photos, accounting, Google OAuth, Drive API, and upload traffic", () => {
    const source = readServiceWorkerSource();

    for (const excluded of [
      "/photos",
      "/trip/hokuriku-2026/expenses",
      "/trip/hokuriku-2026/settlement",
      "accounts.google.com",
      "oauth2.googleapis.com",
      "www.googleapis.com/drive",
      "upload",
    ]) {
      expect(source).toContain(excluded);
    }
  });

  it("serves HTML with network-first fallback and static assets with cache-first", () => {
    const source = readServiceWorkerSource();

    expect(source).toContain("networkFirst");
    expect(source).toContain("cacheFirst");
    expect(source).toContain("_next/static");
  });

  it("configures Firebase headers so sw.js is never cached by the browser", () => {
    const firebaseConfig = JSON.parse(
      readFileSync(path.join(process.cwd(), "firebase.json"), "utf8"),
    ) as {
      hosting: {
        headers?: Array<{
          source: string;
          headers: Array<{ key: string; value: string }>;
        }>;
      };
    };
    const swHeaders = firebaseConfig.hosting.headers?.find(
      (entry) => entry.source === "/sw.js",
    );

    expect(swHeaders?.headers).toEqual(
      expect.arrayContaining([
        {
          key: "Content-Type",
          value: "application/javascript; charset=utf-8",
        },
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
      ]),
    );
  });
});
