import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import {
  getTradingAccountById,
  updateTradingAccount,
  deleteTradingAccount,
} from "@/lib/db/accounts";

const updateAccountSchema = z.object({
  name: z.string().trim().max(100).optional(),
  brokerName: z.string().trim().max(100).nullable().optional(),
  accountNumber: z.string().trim().max(50).nullable().optional(),
  currentBalance: z.number().finite().nonnegative().optional(),
  status: z.enum(["active", "paused", "passed", "breached", "archived"]).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  maxDailyLossPercent: z.number().finite().min(0.01).max(100).optional(),
  maxDrawdownPercent: z.number().finite().min(0.01).max(100).optional(),
  profitTargetPercent: z.number().finite().min(0.01).max(1000).optional(),
  maxTradesPerDay: z.number().int().positive().max(1000).optional(),
  riskPerTradePercent: z.number().finite().min(0.01).max(100).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const { id } = await params;
    const account = await getTradingAccountById(session.user.id, id);
    if (!account) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("[accounts] Failed to get account", error);
    return NextResponse.json({ error: "Failed to get account details." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid account parameters." },
        { status: 400 },
      );
    }

    const updated = await updateTradingAccount(session.user.id, id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Account not found or update failed." }, { status: 404 });
    }

    return NextResponse.json({ account: updated });
  } catch (error) {
    console.error("[accounts] Failed to update account", error);
    return NextResponse.json({ error: "Failed to update account." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteTradingAccount(session.user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Account not found or already deleted." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[accounts] Failed to delete account", error);
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }
}
