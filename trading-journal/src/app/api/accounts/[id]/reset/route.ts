import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { resetTradingAccountBalance } from "@/lib/db/accounts";

const resetSchema = z.object({
  newBalance: z.number().finite().positive().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const { id } = await params;
    let newBalance: number | undefined;

    try {
      const text = await request.text();
      if (text) {
        const body = JSON.parse(text);
        const parsed = resetSchema.safeParse(body);
        if (parsed.success) {
          newBalance = parsed.data.newBalance;
        }
      }
    } catch {
      // If no body provided, defaults to starting balance
    }

    const updated = await resetTradingAccountBalance(session.user.id, id, newBalance);
    if (!updated) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    return NextResponse.json({ account: updated });
  } catch (error) {
    console.error("[accounts] Failed to reset account balance", error);
    return NextResponse.json({ error: "Failed to reset balance." }, { status: 500 });
  }
}
