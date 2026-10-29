import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createRuleSet, getUserRuleSets } from "@/lib/db/rules";
import { getTradingAccountById } from "@/lib/db/accounts";

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || undefined;

    if (accountId && !(await getTradingAccountById(userId, accountId))) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    const ruleSets = await getUserRuleSets(userId, accountId);
    return NextResponse.json({ ruleSets });
  } catch (error) {
    console.error("GET /api/rules/sets error:", error);
    return NextResponse.json({ error: "Failed to fetch rule sets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;
    const body = await request.json();
    const { name, accountId, description, isDraft, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "Rule set name is required" }, { status: 400 });
    }
    if (accountId && !(await getTradingAccountById(userId, String(accountId)))) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const ruleSet = await createRuleSet(userId, {
      name,
      accountId: accountId || null,
      description: description || null,
      isDraft: Boolean(isDraft),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json({ ruleSet }, { status: 201 });
  } catch (error) {
    console.error("POST /api/rules/sets error:", error);
    return NextResponse.json({ error: "Failed to create rule set" }, { status: 500 });
  }
}
