import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Use pooled DATABASE_URL for serverless/edge (web app queries)
// Use DATABASE_URL_UNPOOLED for migrations only

let cachedClient: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  if (!cachedClient) {
    cachedClient = neon(url);
  }
  return cachedClient;
}

export const sql = new Proxy((() => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, argArray) {
    const client = getClient();
    return Reflect.apply(client as unknown as Function, client, argArray);
  },
  get(_target, prop) {
    const client = getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
