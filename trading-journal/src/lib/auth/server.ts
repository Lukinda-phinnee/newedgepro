import { createNeonAuth } from "@neondatabase/auth/next/server";

type NeonAuthInstance = ReturnType<typeof createNeonAuth>;

let cachedAuth: NeonAuthInstance | null = null;

function getAuthInstance(): NeonAuthInstance {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;

  // If in build phase or env var not loaded yet, use placeholder to allow static analysis
  if (!baseUrl) {
    return createNeonAuth({
      baseUrl: "https://placeholder.auth.neon.tech",
      cookies: {
        secret: secret || "default-secret-key-placeholder-min-32-chars-long",
      },
    });
  }

  if (!cachedAuth) {
    cachedAuth = createNeonAuth({
      baseUrl,
      cookies: {
        secret: secret || "default-secret-key-placeholder-min-32-chars-long",
      },
    });
  }
  return cachedAuth;
}

export const auth = new Proxy({} as NeonAuthInstance, {
  get(_target, prop) {
    const instance = getAuthInstance();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
