import type { Metadata, Viewport } from "next";
import { TravelPasswordGate } from "@/components/auth/TravelPasswordGate";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "孝親紅葉慢旅",
  title: "京都・金澤・山中溫泉｜孝親紅葉慢旅",
  description:
    "寺院紅葉、庭園散策、溪谷溫泉，規劃一趟爸媽也舒服的秋日日本旅行。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "紅葉慢旅",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f4ec",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className="h-full scroll-smooth antialiased"
    >
      <body className="flex min-h-full flex-col">
        <ServiceWorkerRegistration />
        <TravelPasswordGate>
          <SiteHeader />
          {children}
          <MobileBottomNav />
        </TravelPasswordGate>
      </body>
    </html>
  );
}
