import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { RuleService } from "@/lib/services/rule-service";
import { sql } from "@/lib/db";
import { getTradingAccountById } from "@/lib/db/accounts";
import type { TradeIntent } from "@/types/rules";

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;
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
    if (accountId && !(await getTradingAccountById(userId, String(accountId)))) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const result = await RuleService.evaluateTradeIntent(
      userId,
      accountId || null,
      tradeIntent,
    );

    await sql`
      INSERT INTO rule_simulations (user_id, account_id, verdict, violation_count)
      VALUES (
        ${userId}, ${accountId || null}, ${result.verdict},
        ${Array.isArray(result.triggeredRules) ? result.triggeredRules.length : 0}
      )
    `;

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/rules/simulate error:", error);
    return NextResponse.json({ error: "Failed to simulate trade intent" }, { status: 500 });
  }
}
