import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

const protect = auth.middleware({ loginUrl: "/sign-in" });

export default function proxy(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const isLocalHttp =
    process.env.NODE_ENV !== "production" &&
    request.nextUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(request.nextUrl.hostname);

  if (isLocalHttp && cookieHeader.includes("neon-auth.") && !cookieHeader.includes("__Secure-neon-auth.")) {
    const secureCookies = cookieHeader.replace(/(^|;\s*)neon-auth\./g, "$1__Secure-neon-auth.");
    request.headers.set("cookie", `${cookieHeader}; ${secureCookies}`);
  }

  const { pathname } = request.nextUrl;

  // Public unauthenticated routes
  const isPublicPage =
    pathname === "/" ||
    pathname === "/sign-in" ||
    pathname.startsWith("/sign-in/") ||
    pathname === "/sign-up" ||
    pathname.startsWith("/sign-up/") ||
    pathname.startsWith("/api/auth");

  if (isPublicPage) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // API routes return their own JSON auth errors; only normalize localhost
  // cookies here instead of redirecting API callers through page middleware.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  return protect(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static image/font assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ico)$).*)",
  ],
};
