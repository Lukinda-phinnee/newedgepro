import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserTradingAccounts } from "@/lib/db/accounts";
import { getUserTrades } from "@/lib/db/trades";
import { getUserStrategies } from "@/lib/db/strategies";
import { getRuleEngineStatus, getComplianceStats } from "@/lib/db/rules";
import { generateSampleTrades } from "@/lib/demo-trades";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard — EdgePro" };

export default async function DashboardPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);
  const activeAccount = accounts.find((a) => a.isDefault) || accounts[0] || null;
  const accountId = activeAccount?.id;

  const [accountTrades, strategies, ruleStatus, ruleCompliance] = await Promise.all([
    accountId ? getUserTrades(session.user.id, accountId) : Promise.resolve([]),
    getUserStrategies(session.user.id, accountId),
    getRuleEngineStatus(session.user.id, accountId),
    getComplianceStats(session.user.id, accountId),
  ]);

  let trades = accountTrades;

  // Fall back to sample trades if user has none yet
  if (trades.length === 0 && accountId) {
    trades = generateSampleTrades(accountId, session.user.id);
  }

  return (
    <DashboardView
      trades={trades}
      strategies={strategies}
      account={activeAccount}
      ruleStatus={ruleStatus}
      ruleCompliance={ruleCompliance}
    />
  );
}
