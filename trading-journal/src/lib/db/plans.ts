import "server-only";
import { sql } from "@/lib/db";
import type { TradingPlanItem } from "@/components/plan/plan-sidebar";

function mapPlanRow(row: Record<string, unknown>): TradingPlanItem {
  return {
    id: String(row.id),
    title: String(row.title || "Untitled Plan"),
    sessionTag: String(row.session_tag || "NY AM"),
    summary: String(row.summary || ""),
    content: String(row.content || ""),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : String(row.updated_at || "Just now"),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : String(row.created_at || "Today"),
  };
}

export async function getUserTradingPlans(
  userId: string,
  _accountId?: string | null
): Promise<TradingPlanItem[]> {
  const rows = (await sql`
    SELECT id, title, session_tag, summary, content, created_at, updated_at
    FROM trading_plans
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `) as Record<string, unknown>[];

  return rows.map(mapPlanRow);
}

export async function createTradingPlan(
  userId: string,
  input: {
    title?: string;
    sessionTag?: string;
    summary?: string;
    content?: string;
    accountId?: string | null;
  }
): Promise<TradingPlanItem> {
  const title = (input.title || "New Trading Plan").slice(0, 200);
  const sessionTag = (input.sessionTag || "NY AM").slice(0, 50);
  const summary = (input.summary || "").slice(0, 300);
  const content = input.content ?? "";
  const accountId = input.accountId || null;

  const rows = (await sql`
    INSERT INTO trading_plans (user_id, account_id, title, session_tag, summary, content)
    VALUES (${userId}, ${accountId}, ${title}, ${sessionTag}, ${summary}, ${content})
    RETURNING id, title, session_tag, summary, content, created_at, updated_at
  `) as Record<string, unknown>[];

  return mapPlanRow(rows[0]);
}

export async function updateTradingPlan(
  userId: string,
  planId: string,
  input: {
    title?: string;
    sessionTag?: string;
    summary?: string;
    content?: string;
  }
): Promise<TradingPlanItem | null> {
  const title = input.title !== undefined ? input.title.slice(0, 200) : undefined;
  const sessionTag = input.sessionTag !== undefined ? input.sessionTag.slice(0, 50) : undefined;
  const summary = input.summary !== undefined ? input.summary.slice(0, 300) : undefined;
  const content = input.content !== undefined ? input.content : undefined;

  const rows = (await sql`
    UPDATE trading_plans SET
      title = COALESCE(${title ?? null}, title),
      session_tag = COALESCE(${sessionTag ?? null}, session_tag),
      summary = COALESCE(${summary ?? null}, summary),
      content = COALESCE(${content ?? null}, content),
      updated_at = NOW()
    WHERE id = ${planId} AND user_id = ${userId}
    RETURNING id, title, session_tag, summary, content, created_at, updated_at
  `) as Record<string, unknown>[];

  if (!rows.length) return null;
  return mapPlanRow(rows[0]);
}

export async function deleteTradingPlan(
  userId: string,
  planId: string
): Promise<boolean> {
  const result = await sql`
    DELETE FROM trading_plans
    WHERE id = ${planId} AND user_id = ${userId}
    RETURNING id
  `;
  return Array.isArray(result) && result.length > 0;
}

