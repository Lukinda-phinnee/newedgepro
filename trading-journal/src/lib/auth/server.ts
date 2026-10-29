import { createNeonAuth } from "@neondatabase/auth/next/server";

type NeonAuthInstance = ReturnType<typeof createNeonAuth>;

let cachedInstance: NeonAuthInstance | null = null;
let cachedBaseUrl: string | null = null;

export function getAuth(): NeonAuthInstance {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret =
    process.env.NEON_AUTH_COOKIE_SECRET ||
    "default-secret-key-placeholder-min-32-chars-long";

  // If already initialized with a real baseUrl that hasn't changed, reuse it.
  if (cachedInstance && cachedBaseUrl && cachedBaseUrl === baseUrl) {
    return cachedInstance;
  }

  // If real baseUrl is available at runtime, create and cache the real instance.
  if (baseUrl) {
    cachedBaseUrl = baseUrl;
    cachedInstance = createNeonAuth({
      baseUrl,
      cookies: {
        secret: cookieSecret,
      },
    });
    return cachedInstance;
  }

  // Fallback for Next.js build-time / pre-render only.
  // DO NOT cache the placeholder so that when a request arrives at runtime,
  // the real baseUrl will be picked up from the Lambda environment.
  return createNeonAuth({
    baseUrl: "https://placeholder.auth.neon.tech",
    cookies: {
      secret: cookieSecret,
    },
  });
}

// Lazy proxy forwarding every property/method access to getAuth() at call-time.
export const auth: NeonAuthInstance = new Proxy({} as NeonAuthInstance, {
  get(_target, prop) {
    const instance = getAuth();
    const value = (instance as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
