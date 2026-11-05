"use client";

import { useState, useEffect } from "react";
import { PlanSidebar, type TradingPlanItem } from "@/components/plan/plan-sidebar";
import { PlanWordEditor } from "@/components/plan/word-editor/plan-word-editor";
import { PlanAiSidebar } from "@/components/plan/plan-ai-sidebar";

const starterPlans: TradingPlanItem[] = [
  {
    id: "plan-1",
    title: "NY AM Session Plan",
    sessionTag: "NY AM",
    summary: "NQ liquidity sweep and ES opening range breakout parameters.",
    content: `<h1>Daily Trading Plan - NY AM Session</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} | <strong>Session:</strong> New York AM Killzone (09:30 - 11:30 EST)</p>
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
<p><br></p>`,
    updatedAt: "Today 09:30",
    createdAt: "Today",
  },
  {
    id: "plan-2",
    title: "London Breakout Strategy",
    sessionTag: "London",
    summary: "EUR/USD & GBP/USD early session liquidity targets and risk caps.",
    content: `<h1>London Session Breakout Plan</h1>
<p><strong>Session:</strong> London Open (03:00 - 07:00 EST)</p>
<hr/>
<h2>1. Asian Range Context</h2>
<p>Asian session range defined between 1.0840 and 1.0865. Anticipating a false breakout or Judas swing into 1.0830 before reversal.</p>
<h2>2. Execution Rules</h2>
<ul>
  <li>Wait for 03:00 EST official open before placing limits.</li>
  <li>Risk strictly capped at 0.5% per position.</li>
  <li>Target: 1:2.5 minimum R:R into London High.</li>
</ul>`,
    updatedAt: "Yesterday",
    createdAt: "Nov 4",
  },
  {
    id: "plan-3",
    title: "Weekly Playbook Directives",
    sessionTag: "Weekly",
    summary: "Higher timeframe macro themes, earnings releases, and risk allocation.",
    content: `<h1>Weekly Trading Strategy & Playbook</h1>
<p><strong>Focus:</strong> Capital preservation during high-volatility macro week.</p>
<hr/>
<h2>1. Key Macro Releases</h2>
<ul>
  <li>Wednesday: FOMC Rate Decision (14:00 EST) - Flat during announcement</li>
  <li>Friday: Non-Farm Payrolls (08:30 EST) - No pre-market executions</li>
</ul>
<h2>2. Weekly Risk Allocation</h2>
<p>Maximum cumulative drawdown allowance for the week: 3.0%.</p>`,
    updatedAt: "Nov 3",
    createdAt: "Nov 3",
  },
];

const STORAGE_KEY = "edgepro_trading_plans_list";
const ACTIVE_PLAN_KEY = "edgepro_active_plan_id";

export function PlanView() {
  const [plans, setPlans] = useState<TradingPlanItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // storage fallback
      }
    }
    return starterPlans;
  });

  const [activePlanId, setActivePlanId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedId = localStorage.getItem(ACTIVE_PLAN_KEY);
        if (savedId) return savedId;
      } catch {
        // fallback
      }
    }
    return starterPlans[0].id;
  });

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);

  // Persist plans and active plan ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch {
      // storage unavailable
    }
  }, [plans]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PLAN_KEY, activePlanId);
    } catch {
      // storage unavailable
    }
  }, [activePlanId]);

  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

  const handleCreatePlan = () => {
    const newId = `plan-${Date.now()}`;
    const newPlan: TradingPlanItem = {
      id: newId,
      title: `Trading Plan ${plans.length + 1}`,
      sessionTag: "Custom",
      summary: "New blank trading plan document.",
      content: `<h1>New Trading Plan</h1><p>Document today's market context, planned setups, and risk boundaries...</p><p><br/></p>`,
      updatedAt: "Just now",
      createdAt: "Today",
    };

    setPlans((prev) => [newPlan, ...prev]);
    setActivePlanId(newId);
  };

  const handleDeletePlan = (id: string) => {
    if (plans.length <= 1) return;
    const remaining = plans.filter((p) => p.id !== id);
    setPlans(remaining);
    if (activePlanId === id) {
      setActivePlanId(remaining[0].id);
    }
  };

  const handleUpdateContent = (content: string, snippet?: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === activePlanId
          ? {
              ...p,
              content,
              summary: snippet || p.summary,
              updatedAt: "Just now",
            }
          : p
      )
    );
  };

  const handleUpdateTitle = (title: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? { ...p, title } : p))
    );
  };

  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col lg:flex-row gap-4 bg-transparent overflow-hidden">
      {/* ─── Left Sidebar (Different Trading Plans) ─── */}
      <PlanSidebar
        plans={plans}
        activePlanId={activePlanId}
        onSelectPlan={setActivePlanId}
        onCreatePlan={handleCreatePlan}
        onDeletePlan={handleDeletePlan}
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
      />

      {/* ─── Center Section (Microsoft Word Style Editor) ─── */}
      <section className="flex-1 min-w-0 h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs flex flex-col">
        <PlanWordEditor
          plan={activePlan}
          onUpdateContent={handleUpdateContent}
          onUpdateTitle={handleUpdateTitle}
          leftSidebarOpen={leftSidebarOpen}
          onToggleLeftSidebar={() => setLeftSidebarOpen(true)}
        />
      </section>

      {/* ─── AI Sidebar (Right End Side) ─── */}
      <PlanAiSidebar />
    </div>
  );
}
