import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { copyRulesToAccount, getRuleSetById } from "@/lib/db/rules";
import { getTradingAccountById } from "@/lib/db/accounts";

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;
    const body = await request.json();
    const { sourceRuleSetId, targetAccountId, targetAccountName } = body;

    if (!sourceRuleSetId || !targetAccountId) {
      return NextResponse.json(
        { error: "sourceRuleSetId and targetAccountId are required" },
        { status: 400 },
      );
    }
    if (!(await getRuleSetById(String(sourceRuleSetId), userId))) {
      return NextResponse.json({ error: "Source rule set not found" }, { status: 404 });
    }
    const targetAccount = await getTradingAccountById(userId, String(targetAccountId));
    if (!targetAccount) return NextResponse.json({ error: "Target account not found" }, { status: 404 });

    const updatedSet = await copyRulesToAccount(
      userId,
      sourceRuleSetId,
      targetAccountId,
      targetAccountName || targetAccount.name,
    );

    return NextResponse.json({ ruleSet: updatedSet });
  } catch (error) {
    console.error("POST /api/rules/copy-to-account error:", error);
    return NextResponse.json({ error: "Failed to copy rules to account" }, { status: 500 });
  }
}
