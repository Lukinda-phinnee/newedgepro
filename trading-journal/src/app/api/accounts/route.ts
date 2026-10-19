import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "NZD"] as const;

const createAccountSchema = z.object({
  accountType: z.literal("demo"),
  name: z.string().trim().max(100).optional(),
  startingBalance: z.number().finite().positive().max(1_000_000_000),
  currency: z.enum(currencies),
  maxDailyLossPercent: z.number().finite().min(0.01).max(100),
  maxDrawdownPercent: z.number().finite().min(0.01).max(100),
  profitTargetPercent: z.number().finite().min(0.01).max(1000),
  maxTradesPerDay: z.number().int().positive().max(1000),
  riskPerTradePercent: z.number().finite().min(0.01).max(100),
});

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
    return NextResponse.json({ error: "Check the account and guardrail values and try again." }, { status: 400 });
  }

  const values = parsed.data;
  const alreadyHasAccount = await sql`
    SELECT id FROM trading_accounts WHERE user_id = ${session.user.id} LIMIT 1
  `;
  if (alreadyHasAccount.length > 0) {
    return NextResponse.json({ error: "You already have an account." }, { status: 409 });
  }

  const generatedNameRows = values.name
    ? []
    : await sql`SELECT COUNT(*)::int AS count FROM trading_accounts WHERE user_id = ${session.user.id}`;
  const name = values.name || `Demo account ${(generatedNameRows[0]?.count ?? 0) + 1}`;

  const rows = await sql`
    INSERT INTO trading_accounts (
      user_id, name, account_type, starting_balance, currency,
      max_daily_loss_percent, max_drawdown_percent, profit_target_percent,
      max_trades_per_day, risk_per_trade_percent
    )
    VALUES (
      ${session.user.id}, ${name}, ${values.accountType}, ${values.startingBalance}, ${values.currency},
      ${values.maxDailyLossPercent}, ${values.maxDrawdownPercent}, ${values.profitTargetPercent},
      ${values.maxTradesPerDay}, ${values.riskPerTradePercent}
    )
    RETURNING id, name, account_type, starting_balance, currency,
      max_daily_loss_percent, max_drawdown_percent, profit_target_percent, max_trades_per_day,
      risk_per_trade_percent, created_at
  `;

  return NextResponse.json({ account: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[accounts] Failed to create trading account", error);
    return NextResponse.json(
      { error: "We couldn’t create your account right now. Please try again." },
      { status: 500 },
    );
  }
}
