"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, anonKey } = requireSupabasePublicConfig();
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}
