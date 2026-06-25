import { NextResponse, type NextRequest } from "next/server";
import {
  TRAVEL_SESSION_COOKIE_NAME,
  verifyTravelSessionToken,
} from "@/lib/travel-session";

const loginPath = "/login";
const publicPathPrefixes = ["/api/travel-session"];
const publicPathnames = new Set([
  "/favicon.ico",
  "/manifest.webmanifest",
  "/sw.js",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/apple-touch-icon.png",
]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = await verifyTravelSessionToken(
    request.cookies.get(TRAVEL_SESSION_COOKIE_NAME)?.value,
  );

  if (pathname === loginPath) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|api/travel-session|favicon.ico|manifest.webmanifest|sw.js|pwa-icon-192.png|pwa-icon-512.png|apple-touch-icon.png|.*\\..*).*)",
  ],
};

function isPublicPath(pathname: string) {
  return (
    publicPathnames.has(pathname) ||
    publicPathPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}
