import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getComplianceStats } from "@/lib/db/rules";
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

    const compliance = await getComplianceStats(userId, targetAccountId);
    return NextResponse.json(compliance);
  } catch (error) {
    console.error("GET /api/rules/compliance/:accountId error:", error);
    return NextResponse.json({ error: "Failed to get compliance stats" }, { status: 500 });
  }
}
