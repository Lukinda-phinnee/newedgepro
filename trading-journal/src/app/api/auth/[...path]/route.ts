import { auth } from "@/lib/auth/server";

function getHandlers() {
  return auth.handler();
}

async function handle(request: Request, context: unknown) {
  let requestToPass = request;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const requestUrl = new URL(request.url);
  const isLocalHttp =
    process.env.NODE_ENV !== "production" &&
    requestUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(requestUrl.hostname);

  if (isLocalHttp && cookieHeader.includes("neon-auth.") && !cookieHeader.includes("__Secure-neon-auth.")) {
    const headers = new Headers(request.headers);
    const secureCookies = cookieHeader.replace(/(^|;\s*)neon-auth\./g, "$1__Secure-neon-auth.");
    headers.set("cookie", `${cookieHeader}; ${secureCookies}`);
    requestToPass = new Request(request.url, {
      method: request.method,
      headers,
      body: request.body,
      // @ts-expect-error Node requires duplex when forwarding a streaming body.
      duplex: "half",
    });
  }

  const handlers = getHandlers();
  const handler = handlers[request.method as keyof typeof handlers];
  if (!handler) return new Response("Method not allowed", { status: 405 });

  const response = await handler(requestToPass, context as never);
  if (!isLocalHttp || typeof response.headers.getSetCookie !== "function") {
    return response;
  }

  const setCookies = response.headers.getSetCookie();
  if (!setCookies.some((cookie) => cookie.startsWith("__Secure-neon-auth."))) return response;

  const headers = new Headers(response.headers);
  for (const cookie of setCookies) {
    if (!cookie.startsWith("__Secure-neon-auth.")) continue;
    const localCookie = cookie
      .replace(/^__Secure-neon-auth\./, "neon-auth.")
      .replace(/;\s*Secure(?=;|$)/i, "");
    headers.append("Set-Cookie", localCookie);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const GET = (request: Request, context: unknown) => handle(request, context);
export const POST = (request: Request, context: unknown) => handle(request, context);
export const PUT = (request: Request, context: unknown) => handle(request, context);
export const DELETE = (request: Request, context: unknown) => handle(request, context);
export const PATCH = (request: Request, context: unknown) => handle(request, context);
