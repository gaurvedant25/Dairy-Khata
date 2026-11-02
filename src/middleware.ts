import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Public marketing / legal pages + auth pages (reachable without login).
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/api/signup",
  "/terms",
  "/privacy",
  "/contact",
  "/demo",
];
// Auth pages we bounce logged-in users away from.
const AUTH_ONLY = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!req.auth && !isPublic) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in users skip the login/signup screens.
  if (req.auth && AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Skip auth for Next internals, API auth, and public static files
  // (icons, manifest, service worker, images) so the PWA/logo can load.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|svg|ico|webmanifest|js)$).*)",
  ],
};
