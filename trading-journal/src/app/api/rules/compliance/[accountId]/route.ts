import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getComplianceStats } from "@/lib/db/rules";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const userId = await resolveUserId();
    const { accountId } = await params;
    const targetAccountId = accountId === "global" ? null : accountId;

    const compliance = await getComplianceStats(userId, targetAccountId);
    return NextResponse.json(compliance);
  } catch (error) {
    console.error("GET /api/rules/compliance/:accountId error:", error);
    return NextResponse.json({ error: "Failed to get compliance stats" }, { status: 500 });
  }
}
