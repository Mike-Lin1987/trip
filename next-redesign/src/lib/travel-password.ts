const sha256HexPattern = /^[a-f0-9]{64}$/i;

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
  expectedPasswordHash: string,
): Promise<boolean> {
  if (!isValidSha256Hex(expectedPasswordHash)) {
    return false;
  }

  return (
    (await hashTravelPassword(password)) === expectedPasswordHash.trim().toLowerCase()
  );
}

export function isValidSha256Hex(value: string | undefined): value is string {
  return Boolean(value && sha256HexPattern.test(value.trim()));
}
