import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserTradingAccounts } from "@/lib/db/accounts";
import {
  getComplianceStats,
  getOrCreateGlobalRuleSet,
  getRuleEngineStatus,
  getUserRuleSets,
} from "@/lib/db/rules";
import { RuleEngineView } from "@/components/rule-engine/rule-engine-view";

export const metadata: Metadata = {
  title: "Rule Engine — EdgePro",
  description:
    "Define machine-readable trading constraints, evaluate trade intents, and enforce discipline guardrails.",
};


export default async function RuleEnginePage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);

  // By default, the Rule Engine loads the Global System Rule Set which applies across the entire system
  const globalRuleSet = await getOrCreateGlobalRuleSet(session.user.id);
  const allRuleSets = await getUserRuleSets(session.user.id);
  const status = await getRuleEngineStatus(session.user.id, null);
  const compliance = await getComplianceStats(session.user.id, null);

  return (
    <RuleEngineView
      initialRuleSet={globalRuleSet}
      initialRuleSets={allRuleSets}
      initialStatus={status}
      initialCompliance={compliance}
      accounts={accounts}
    />
  );
}
