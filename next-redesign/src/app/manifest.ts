import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "孝親紅葉慢旅",
    short_name: "紅葉慢旅",
    description: "2026 京都、金澤、山中溫泉孝親賞楓慢旅行程工具。",
    lang: "zh-Hant",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f4ec",
    theme_color: "#f8f4ec",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    categories: ["travel", "utilities"],
    shortcuts: [
      {
        name: "每日行程",
        short_name: "行程",
        url: "/itinerary",
        description: "查看每日交通、住宿與行程節奏。",
      },
    ],
  };
}
