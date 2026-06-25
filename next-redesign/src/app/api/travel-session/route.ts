import { NextResponse } from "next/server";
import {
  createTravelSessionToken,
  isTravelAuthConfigured,
  readTravelSessionConfig,
  TRAVEL_SESSION_COOKIE_NAME,
  verifyConfiguredTravelPassword,
} from "@/lib/travel-session";

export async function POST(request: Request) {
  const config = readTravelSessionConfig();

  if (!isTravelAuthConfigured(config)) {
    return NextResponse.json({ error: "travel_auth_not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const password =
    body && typeof body === "object" && "password" in body
      ? (body as { password?: unknown }).password
      : undefined;

  if (typeof password !== "string") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const isValidPassword = await verifyConfiguredTravelPassword(password, config);
  if (!isValidPassword) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const token = await createTravelSessionToken(config);
  if (!token) {
    return NextResponse.json({ error: "travel_auth_not_configured" }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(TRAVEL_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: config.ttlSeconds,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TRAVEL_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
