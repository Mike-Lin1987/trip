import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

function sourceAssetExists(src: string): boolean {
  if (src === "/favicon.ico") {
    return existsSync(path.join(process.cwd(), "src", "app", "favicon.ico"));
  }

  return existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

describe("PWA metadata", () => {
  it("advertises installable manifest basics", () => {
    const data = manifest();

    expect(data.id).toBe("/");
    expect(data.lang).toBe("zh-Hant");
    expect(data.start_url).toBe("/");
    expect(data.scope).toBe("/");
    expect(data.display).toBe("standalone");
    expect(data.theme_color).toBe("#f8f4ec");
    expect(data.background_color).toBe("#f8f4ec");
  });

  it("references real icon assets for browser install surfaces", () => {
    const data = manifest();
    const icons = data.icons ?? [];

    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/pwa-icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/pwa-icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/pwa-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        }),
      ]),
    );

    for (const icon of icons) {
      expect(sourceAssetExists(icon.src)).toBe(true);
    }
  });

  it("keeps the PWA lightweight without next-pwa or Workbox dependencies", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const publicFiles = readdirSync(path.join(process.cwd(), "public"));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    expect(dependencies).not.toHaveProperty("next-pwa");
    expect(dependencies).not.toHaveProperty("workbox-build");
    expect(dependencies).not.toHaveProperty("workbox-window");
    expect(publicFiles).not.toContain("service-worker.js");
  });
});
