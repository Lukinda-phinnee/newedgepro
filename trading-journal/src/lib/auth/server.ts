import { createNeonAuth } from "@neondatabase/auth/next/server";


// All env vars are expected at runtime (Lambda environment).
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? (() => {
    if (process.env.NODE_ENV === "production") {
      console.error("[auth] NEON_AUTH_BASE_URL is not set in production!");
    }
    return "https://placeholder.auth.neon.tech";
  })(),
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET ?? "default-secret-key-placeholder-min-32-chars-long",
  },
});
