import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { getUserTradingAccounts, computePortfolioSummary, getTradingAccountById } from "@/lib/db/accounts";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "NZD"] as const;

const createAccountSchema = z.object({
  accountType: z.enum(["demo", "live"]),
  name: z.string().trim().max(100).optional(),
  brokerName: z.string().trim().max(100).optional(),
  accountNumber: z.string().trim().max(50).optional(),
  startingBalance: z.number().finite().positive().max(1_000_000_000),
  currency: z.enum(currencies),
  maxDailyLossPercent: z.number().finite().min(0.01).max(100),
  maxDrawdownPercent: z.number().finite().min(0.01).max(100),
  profitTargetPercent: z.number().finite().min(0.01).max(1000),
  maxTradesPerDay: z.number().int().positive().max(1000),
  riskPerTradePercent: z.number().finite().min(0.01).max(100),
  notes: z.string().trim().max(500).optional(),
});

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in to view accounts." }, { status: 401 });
    }

    const accounts = await getUserTradingAccounts(session.user.id);
    const summary = computePortfolioSummary(accounts);

    return NextResponse.json({ accounts, summary });
  } catch (error) {
    console.error("[accounts] Failed to get trading accounts", error);
    return NextResponse.json(
      { error: "We couldn’t retrieve your accounts right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in to create an account." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "The account details are invalid." }, { status: 400 });
    }

    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the account and guardrail values and try again." },
        { status: 400 },
      );
    }

    const values = parsed.data;

    const existingAccounts = await sql`
      SELECT id, is_default FROM trading_accounts WHERE user_id = ${session.user.id}
    `;

    // If it's the user's first account, set it as default
    const isFirstAccount = existingAccounts.length === 0;

    const countRows = await sql`
      SELECT COUNT(*)::int AS count FROM trading_accounts WHERE user_id = ${session.user.id}
    `;
    const defaultName =
      values.accountType === "live"
        ? `Live account ${(countRows[0]?.count ?? 0) + 1}`
        : `Demo account ${(countRows[0]?.count ?? 0) + 1}`;

    const name = values.name || defaultName;

    const rows = await sql`
      INSERT INTO trading_accounts (
        user_id, name, account_type, broker_name, account_number,
        starting_balance, current_balance, currency,
        max_daily_loss_percent, max_drawdown_percent, profit_target_percent,
        max_trades_per_day, risk_per_trade_percent, is_default, status, notes
      )
      VALUES (
        ${session.user.id}, ${name}, ${values.accountType}, ${values.brokerName ?? null}, ${values.accountNumber ?? null},
        ${values.startingBalance}, ${values.startingBalance}, ${values.currency},
        ${values.maxDailyLossPercent}, ${values.maxDrawdownPercent}, ${values.profitTargetPercent},
        ${values.maxTradesPerDay}, ${values.riskPerTradePercent}, ${isFirstAccount}, 'active', ${values.notes ?? null}
      )
      RETURNING *
    `;

    const account = await getTradingAccountById(session.user.id, String(rows[0].id));
    if (!account) throw new Error("Created account could not be read back.");
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("[accounts] Failed to create trading account", error);
    return NextResponse.json(
      { error: "We couldn’t create your account right now. Please try again." },
      { status: 500 },
    );
  }
}
