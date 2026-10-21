import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createRuleSet, getUserRuleSets } from "@/lib/db/rules";
import { sql } from "@/lib/db";

async function resolveUserId(): Promise<string> {
  try {
    const { data: session } = await auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch {
    // Session resolution failed, fallback
  }

  // Fallback to active account's user_id or first user in DB
  const acc = await sql`SELECT user_id FROM trading_accounts LIMIT 1`;
  if (acc.length > 0 && acc[0].user_id) {
    return String(acc[0].user_id);
  }

  return "default_user";
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId();
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || undefined;

    const ruleSets = await getUserRuleSets(userId, accountId);
    return NextResponse.json({ ruleSets });
  } catch (error) {
    console.error("GET /api/rules/sets error:", error);
    return NextResponse.json({ error: "Failed to fetch rule sets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId();
    const body = await request.json();
    const { name, accountId, description, isDraft, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "Rule set name is required" }, { status: 400 });
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
