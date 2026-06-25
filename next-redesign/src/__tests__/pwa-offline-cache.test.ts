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

  it("pre-caches static PWA assets but not protected HTML routes", () => {
    const source = readServiceWorkerSource();
    const precacheBlock = source.match(/const PRECACHE_URLS = \[([\s\S]*?)\];/)?.[1];

    expect(precacheBlock).toBeDefined();
    for (const route of [
      "/manifest.webmanifest",
      "/pwa-icon-192.png",
      "/pwa-icon-512.png",
      "/pwa-maskable-512.png",
      "/apple-touch-icon.png",
    ]) {
      expect(precacheBlock).toContain(`"${route}"`);
    }

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
    ]) {
      expect(precacheBlock).not.toContain(`"${route}"`);
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

  it("serves static assets with cache-first and avoids protected HTML caching", () => {
    const source = readServiceWorkerSource();

    expect(source).not.toContain("networkFirst");
    expect(source).not.toContain("HTML_CACHE_PATHS");
    expect(source).toContain("cacheFirst");
    expect(source).toContain("_next/static");
  });

  it("configures Vercel headers so sw.js is never cached by the browser", () => {
    const vercelConfig = JSON.parse(
      readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"),
    ) as {
      headers?: Array<{
        source: string;
        headers: Array<{ key: string; value: string }>;
      }>;
    };
    const swHeaders = vercelConfig.headers?.find(
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
