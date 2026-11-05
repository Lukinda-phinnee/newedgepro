import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserTradingPlans, createTradingPlan } from "@/lib/db/plans";
import { PlanView } from "@/components/plan/plan-view";

export const metadata: Metadata = {
  title: "Trading Plan — EdgePro",
  description: "Trading plan workspace.",
};

const defaultStarterPlanContent = `<h1>Daily Trading Plan - NY AM Session</h1>
<p><strong>Session:</strong> New York AM Killzone (09:30 - 11:30 EST)</p>
<hr/>
<h2>1. Market Narrative & Bias</h2>
<p>Document higher-timeframe order flow, key inflection zones, and resting liquidity pools:</p>
<ul>
  <li>Higher Timeframe Trend: Bullish expansion from daily demand</li>
  <li>Key Liquidity Targets: Previous Day High (PDH), London Session High</li>
  <li>Invalidation Level: Clean 15m structural swing low</li>
</ul>

<h2>2. Planned Setups Matrix</h2>
<p>Execution matrix for today's active tickers:</p>
<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: rgba(255, 255, 255, 0.05);">
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Asset</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Model</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Entry Zone</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Invalidation</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Target</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">R:R</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>NQ</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Liquidity Sweep + FVG</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">21,420 - 21,435</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">21,390</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">21,580</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">1:2.6R</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>ES</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Opening Range Break</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">5,845 - 5,848</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">5,836</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">5,870</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">1:2.3R</td>
    </tr>
  </tbody>
</table>

<h2>3. Risk Guardrails & Execution Directives</h2>
<p>Discipline parameters enforced for this session:</p>
<ul data-type="taskList" style="list-style: none; padding-left: 0;">
  <li style="margin: 6px 0;"><input type="checkbox" checked/> Max Daily Loss: 1.0% ($500 hard circuit breaker)</li>
  <li style="margin: 6px 0;"><input type="checkbox" checked/> Maximum executions allowed: 3 trades</li>
  <li style="margin: 6px 0;"><input type="checkbox"/> Pause trading 5 minutes before and after high-impact news releases</li>
  <li style="margin: 6px 0;"><input type="checkbox"/> Minimum 30-minute cooling off period after any consecutive loss</li>
</ul>
<p><br></p>`;

export default async function PlanPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  let plans = await getUserTradingPlans(session.user.id);

  // If user has no plans in database, create the initial default plan
  if (plans.length === 0) {
    const defaultPlan = await createTradingPlan(session.user.id, {
      title: "NY AM Session Plan",
      sessionTag: "NY AM",
      summary: "NQ liquidity sweep and ES opening range breakout parameters.",
      content: defaultStarterPlanContent,
    });
    plans = [defaultPlan];
  }

  return <PlanView initialPlans={plans} />;
}
