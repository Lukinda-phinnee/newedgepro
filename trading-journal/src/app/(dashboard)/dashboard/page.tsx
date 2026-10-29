import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserTradingAccounts } from "@/lib/db/accounts";
import { getUserTrades } from "@/lib/db/trades";
import { getUserStrategies } from "@/lib/db/strategies";
import { getRuleEngineStatus, getComplianceStats } from "@/lib/db/rules";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard — EdgePro" };

export default async function DashboardPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);
  const activeAccount = accounts.find((a) => a.isDefault) || accounts[0] || null;
  const accountId = activeAccount?.id;

  const accountTrades = accountId ? await getUserTrades(session.user.id, accountId) : [];
  const [strategies, ruleStatus, ruleCompliance, refreshedAccounts] = await Promise.all([
    getUserStrategies(session.user.id, accountId),
    getRuleEngineStatus(session.user.id, accountId),
    getComplianceStats(session.user.id, accountId),
    accountId ? getUserTradingAccounts(session.user.id) : Promise.resolve(accounts),
  ]);
  // Loading trades may persist demo fixtures and update the account balance.
  // Account metrics are fetched afterward so this first render reflects those rows.
  const refreshedActiveAccount = refreshedAccounts.find((a) => a.id === accountId) || activeAccount;

  return (
    <DashboardView
      trades={accountTrades}
      strategies={strategies}
      account={refreshedActiveAccount}
      ruleStatus={ruleStatus}
      ruleCompliance={ruleCompliance}
    />
  );
}
