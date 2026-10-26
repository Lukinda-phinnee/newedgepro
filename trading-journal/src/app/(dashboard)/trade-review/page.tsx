import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserTradingAccounts } from "@/lib/db/accounts";
import { getUserTrades } from "@/lib/db/trades";
import { getUserStrategies } from "@/lib/db/strategies";
import { generateSampleTrades } from "@/lib/demo-trades";
import { TradeReviewView } from "@/components/trade-review/trade-review-view";

export const metadata: Metadata = {
  title: "Trade Review Management — EdgePro",
  description:
    "Review every trade taken as a professional, audit execution quality, track rule adherence, and eliminate trading leaks.",
};


export default async function TradeReviewPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);
  if (accounts.length === 0) redirect("/onboarding");

  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
  let trades = await getUserTrades(session.user.id, defaultAccount.id);
  const strategies = await getUserStrategies(session.user.id, defaultAccount.id);

  // If no trades are in database yet, provide sample trades with rich review states
  if (trades.length === 0) {
    trades = generateSampleTrades(defaultAccount.id, session.user.id);
  }

  return <TradeReviewView initialTrades={trades} initialStrategies={strategies} />;
}
