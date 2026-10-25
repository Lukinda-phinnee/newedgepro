import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserTradingAccounts } from "@/lib/db/accounts";
import { getUserTrades } from "@/lib/db/trades";
import { generateSampleTrades } from "@/lib/demo-trades";
import { TradeLogView } from "@/components/trade-log/trade-log-view";

export const metadata: Metadata = {
  title: "Trade Log — EdgePro",
  description:
    "Review daily performance, track your executions on a visual calendar with weekly metrics, and manage your trades.",
};


export default async function TradeLogPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);
  if (accounts.length === 0) redirect("/onboarding");

  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
  let trades = await getUserTrades(session.user.id, defaultAccount.id);

  // If no trades are in database yet, provide sample trades for an immediate rich visual experience
  if (trades.length === 0) {
    trades = generateSampleTrades(defaultAccount.id, session.user.id);
  }

  return <TradeLogView initialTrades={trades} />;
}
