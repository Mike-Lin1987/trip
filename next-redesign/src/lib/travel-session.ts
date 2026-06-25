import { isValidSha256Hex, verifyTravelPassword } from "@/lib/travel-password";

export const TRAVEL_SESSION_COOKIE_NAME = "hokuriku_travel_session";

const sessionVersion = "v1";
const defaultSessionTtlSeconds = 60 * 60 * 24 * 14;
const textEncoder = new TextEncoder();

export type TravelSessionConfig = {
  passwordHash?: string;
  sessionSecret?: string;
  ttlSeconds?: number;
};

export function readTravelSessionConfig(
  env: Record<string, string | undefined> = process.env,
): TravelSessionConfig {
  return {
    passwordHash: env.TRAVEL_PASSWORD_HASH?.trim(),
    sessionSecret: env.TRAVEL_SESSION_SECRET?.trim(),
    ttlSeconds: parsePositiveInteger(
      env.TRAVEL_SESSION_TTL_SECONDS,
      defaultSessionTtlSeconds,
    ),
  };
}

export function isTravelAuthConfigured(config = readTravelSessionConfig()) {
  return (
    isValidSha256Hex(config.passwordHash) &&
    Boolean(config.sessionSecret && config.sessionSecret.length >= 32)
  );
}

export async function verifyConfiguredTravelPassword(
  password: string,
  config = readTravelSessionConfig(),
) {
  if (!isValidSha256Hex(config.passwordHash)) {
    return false;
  }

  return verifyTravelPassword(password, config.passwordHash);
}

export async function createTravelSessionToken(
  config = readTravelSessionConfig(),
  now = Date.now(),
): Promise<string | null> {
  if (!config.sessionSecret || config.sessionSecret.length < 32) {
    return null;
  }

  const expiresAt = now + (config.ttlSeconds ?? defaultSessionTtlSeconds) * 1000;
  const payload = `${sessionVersion}.${expiresAt}`;
  const signature = await signTravelSessionPayload(payload, config.sessionSecret);

  return `${payload}.${signature}`;
}

export async function verifyTravelSessionToken(
  token: string | undefined,
  config = readTravelSessionConfig(),
  now = Date.now(),
): Promise<boolean> {
  if (!token || !config.sessionSecret || config.sessionSecret.length < 32) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== sessionVersion) {
    return false;
  }

  const expiresAt = Number(parts[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) {
    return false;
  }

  const payload = `${parts[0]}.${parts[1]}`;
  const expectedSignature = await signTravelSessionPayload(
    payload,
    config.sessionSecret,
  );

  return constantTimeEqual(parts[2], expectedSignature);
}

async function signTravelSessionPayload(payload: string, secret: string) {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(payload),
  );

  return bytesToHex(new Uint8Array(signature));
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}
