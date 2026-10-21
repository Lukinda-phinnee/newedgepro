import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { RuleService } from "@/lib/services/rule-service";
import { sql } from "@/lib/db";
import type { TradeIntent } from "@/types/rules";

async function resolveUserId(): Promise<string> {
  try {
    const { data: session } = await auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch {
    // ignore
  }

  const acc = await sql`SELECT user_id FROM trading_accounts LIMIT 1`;
  if (acc.length > 0 && acc[0].user_id) {
    return String(acc[0].user_id);
  }

  return "default_user";
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId();
    const body = await request.json();
    const { accountId, tradeIntent } = body as {
      accountId?: string | null;
      tradeIntent: TradeIntent;
    };

    if (!tradeIntent || !tradeIntent.symbol || tradeIntent.entryPrice === undefined) {
      return NextResponse.json(
        { error: "Invalid trade intent payload (symbol and entryPrice are required)" },
        { status: 400 },
      );
    }

    const result = await RuleService.evaluateTradeIntent(
      userId,
      accountId || null,
      tradeIntent,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/rules/simulate error:", error);
    return NextResponse.json({ error: "Failed to simulate trade intent" }, { status: 500 });
  }
}
