import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { copyRulesToAccount } from "@/lib/db/rules";
import { sql } from "@/lib/db";

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
    const { sourceRuleSetId, targetAccountId, targetAccountName } = body;

    if (!sourceRuleSetId || !targetAccountId) {
      return NextResponse.json(
        { error: "sourceRuleSetId and targetAccountId are required" },
        { status: 400 },
      );
    }

    const updatedSet = await copyRulesToAccount(
      userId,
      sourceRuleSetId,
      targetAccountId,
      targetAccountName,
    );

    return NextResponse.json({ ruleSet: updatedSet });
  } catch (error) {
    console.error("POST /api/rules/copy-to-account error:", error);
    return NextResponse.json({ error: "Failed to copy rules to account" }, { status: 500 });
  }
}
