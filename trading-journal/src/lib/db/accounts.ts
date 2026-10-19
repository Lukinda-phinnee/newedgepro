import "server-only";
import { sql } from "@/lib/db";

export async function userHasTradingAccount(userId: string) {
  const rows = await sql`
    SELECT id
    FROM trading_accounts
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  return rows.length > 0;
}
