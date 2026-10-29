import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getRuleEngineStatus } from "@/lib/db/rules";
import { getTradingAccountById } from "@/lib/db/accounts";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;
    const { accountId } = await params;
    const targetAccountId = accountId === "global" ? null : accountId;
    if (targetAccountId && !(await getTradingAccountById(userId, targetAccountId))) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const status = await getRuleEngineStatus(userId, targetAccountId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("GET /api/rules/status/:accountId error:", error);
    return NextResponse.json({ error: "Failed to get rule engine status" }, { status: 500 });
  }
}
