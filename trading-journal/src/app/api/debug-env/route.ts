import { NextResponse } from "next/server";

// Temporary diagnostic route — remove after confirming env vars work in production.
// Visit /api/debug-env from your deployed app to check variable availability.
export async function GET() {
  const checks: Record<string, unknown> = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: !!process.env.DATABASE_URL_UNPOOLED,
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL
      ? `SET (${process.env.NEON_AUTH_BASE_URL.slice(0, 50)}...)`
      : "MISSING ❌",
    NEON_AUTH_BASE_HOSTNAME: (() => {
      try {
        return process.env.NEON_AUTH_BASE_URL ? new URL(process.env.NEON_AUTH_BASE_URL).hostname : "N/A";
      } catch {
        return "INVALID_URL";
      }
    })(),
    NEON_AUTH_JWKS_URL: process.env.NEON_AUTH_JWKS_URL
      ? `SET (${process.env.NEON_AUTH_JWKS_URL.slice(0, 50)}...)`
      : "MISSING ❌",
    NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET
      ? `SET (length: ${process.env.NEON_AUTH_COOKIE_SECRET.length})`
      : "MISSING ❌",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "MISSING ❌",
    STORAGE_ACCESS_KEY_ID: !!process.env.STORAGE_ACCESS_KEY_ID,
    STORAGE_SECRET_ACCESS_KEY: !!process.env.STORAGE_SECRET_ACCESS_KEY,
    STORAGE_REGION: process.env.STORAGE_REGION || "MISSING ❌",
    STORAGE_BUCKET: process.env.STORAGE_BUCKET || "MISSING ❌",
    NODE_ENV: process.env.NODE_ENV,
  };

  // --- Connectivity tests ---
  // Test 1: Can Lambda reach Neon Auth JWKS endpoint (publicly accessible)?
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (jwksUrl) {
    try {
      const resp = await fetch(jwksUrl, {
        signal: AbortSignal.timeout(8000),
      });
      checks["connectivity_neon_auth_jwks"] = `${resp.status} ${resp.statusText}`;
    } catch (e) {
      checks["connectivity_neon_auth_jwks"] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    checks["connectivity_neon_auth_jwks"] = "SKIPPED (NEON_AUTH_JWKS_URL not set)";
  }

  // Test 2: Can Lambda reach Neon Auth base URL?
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (baseUrl) {
    // Try hitting the root — just check if the host resolves and responds (any status is fine)
    const pingUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    try {
      const resp = await fetch(pingUrl, {
        method: "GET",
        signal: AbortSignal.timeout(8000),
      });
      checks["connectivity_neon_auth_base"] = `${resp.status} ${resp.statusText}`;
    } catch (e) {
      checks["connectivity_neon_auth_base"] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    checks["connectivity_neon_auth_base"] = "SKIPPED (NEON_AUTH_BASE_URL not set)";
  }

  // Test 3: General outbound internet (fetch a known public endpoint)
  try {
    const resp = await fetch("https://httpbin.org/get", {
      signal: AbortSignal.timeout(8000),
    });
    checks["connectivity_internet"] = `${resp.status} ${resp.statusText}`;
  } catch (e) {
    checks["connectivity_internet"] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(checks, { status: 200 });
}
