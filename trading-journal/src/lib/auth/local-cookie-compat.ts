import { cookies, headers } from "next/headers";

/** Keep plain-HTTP localhost sessions working without changing production cookies. */
export async function mirrorAuthCookiesForLocalHttp() {
  if (process.env.NODE_ENV === "production") return;

  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const hostHeader = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  let hostname = "";
  try {
    hostname = new URL(`http://${hostHeader}`).hostname;
  } catch {
    return;
  }

  if (protocol === "https" || !["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname)) {
    return;
  }

  const cookieStore = await cookies();
  const secureCookies = cookieStore.getAll().filter((cookie) =>
    cookie.name.startsWith("__Secure-neon-auth."),
  );

  for (const cookie of secureCookies) {
    cookieStore.set(cookie.name.replace(/^__Secure-/, ""), cookie.value, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  }
}
