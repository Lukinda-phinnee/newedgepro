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

  // API routes return their own JSON auth errors; only normalize localhost
  // cookies here instead of redirecting API callers through page middleware.
  if (request.nextUrl.pathname === "/api/accounts" || request.nextUrl.pathname.startsWith("/api/accounts/")) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  return protect(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/journal/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/api/accounts/:path*",
  ],
};
