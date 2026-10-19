import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserTradingAccounts, computePortfolioSummary } from "@/lib/db/accounts";
import { PortfolioHubView } from "@/components/portfolio/portfolio-hub-view";

export const metadata: Metadata = {
  title: "Portfolio Hub — EdgePro",
  description: "Manage your trading accounts, capital allocation, and risk guardrails.",
};

export const instant = false;

export default async function PortfolioHubPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);
  const summary = computePortfolioSummary(accounts);

  return <PortfolioHubView initialAccounts={accounts} initialSummary={summary} />;
}
