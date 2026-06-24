export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

type EnvLike = Record<string, string | undefined>;

export function readSupabasePublicConfig(env: EnvLike = process.env): SupabasePublicConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function requireSupabasePublicConfig(env: EnvLike = process.env): SupabasePublicConfig {
  const config = readSupabasePublicConfig(env);

  if (!config) {
    throw new Error("Supabase public settings are not configured.");
  }

  return config;
}
