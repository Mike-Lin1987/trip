export const TRAVEL_PASSWORD_STORAGE_KEY = "hokuriku-2026-travel-unlocked";

export const TRAVEL_PASSWORD_HASH =
  "9c6a838c61fa7f44918fe11f0173070a5be0ec94a56458f0a8d331908ae8c6f2";

export async function hashTravelPassword(password: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error("Secure password verification is unavailable.");
  }

  const encodedPassword = new TextEncoder().encode(password.trim());
  const digest = await subtle.digest("SHA-256", encodedPassword);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyTravelPassword(
  password: string,
  expectedPasswordHash = TRAVEL_PASSWORD_HASH,
): Promise<boolean> {
  return (await hashTravelPassword(password)) === expectedPasswordHash;
}
