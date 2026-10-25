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
export const instant = false;

export default async function DashboardPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);
  const activeAccount = accounts.find((a) => a.isDefault) || accounts[0] || null;
  const accountId = activeAccount?.id;

  // Fetch trades for the active account
  let trades = accountId
    ? await getUserTrades(session.user.id, accountId)
    : [];

  // Fall back to sample trades if user has none yet
  if (trades.length === 0 && accountId) {
    trades = generateSampleTrades(accountId, session.user.id);
  }

  // Fetch strategies (edge data)
  const strategies = await getUserStrategies(session.user.id, accountId);

  // Fetch rule engine status and compliance
  const ruleStatus = await getRuleEngineStatus(session.user.id, accountId);
  const ruleCompliance = await getComplianceStats(session.user.id, accountId);

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
