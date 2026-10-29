"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Copy,
  Globe,
  Layers,
  LayoutDashboard,
  Play,
  Plus,
  Shield,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverviewTab } from "@/components/rule-engine/overview-tab";
import { RuleSetsTab } from "@/components/rule-engine/rule-sets-tab";
import { SimulationTab } from "@/components/rule-engine/simulation-tab";
import { RuleEditorModal } from "@/components/rule-engine/rule-editor-modal";
import { InspectRuleModal } from "@/components/rule-engine/inspect-rule-modal";
import { CopyRulesModal } from "@/components/rule-engine/copy-rules-modal";
import type { TradingAccount } from "@/types/account";
import type {
  Rule,
  RuleCategory,
  RuleEngineCompliance,
  RuleEngineStatus,
  RuleSet,
} from "@/types/rules";
import { cn } from "@/lib/utils";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

// Apple §7: Tab order for directional transitions
const TAB_ORDER: TabKey[] = ["overview", "rulesets", "simulation"];

// Apple §4: Spring configs — critically damped for UI, slight bounce for gesture-driven
const springTab = { type: "spring" as const, damping: 28, stiffness: 320 };
const springContent = { type: "spring" as const, damping: 26, stiffness: 260 };

interface RuleEngineViewProps {
  initialRuleSet: RuleSet;
  initialRuleSets: RuleSet[];
  initialStatus: RuleEngineStatus;
  initialCompliance: RuleEngineCompliance;
  accounts: TradingAccount[];
}

type TabKey = "overview" | "rulesets" | "simulation";

export function RuleEngineView({
  initialRuleSet,
  initialRuleSets,
  initialStatus,
  initialCompliance,
  accounts,
}: RuleEngineViewProps) {
  const { showFeedback } = useOperationFeedback();
  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const prevTabRef = useRef<TabKey>("overview");

  // Apple §7: Track direction for spatial-consistent transitions
  const getDirection = (next: TabKey) => {
    const prevIdx = TAB_ORDER.indexOf(prevTabRef.current);
    const nextIdx = TAB_ORDER.indexOf(next);
    return nextIdx >= prevIdx ? 1 : -1;
  };
  const [direction, setDirection] = useState(0);

  const switchTab = (next: TabKey) => {
    if (next === activeTab) return;
    setDirection(getDirection(next));
    prevTabRef.current = activeTab;
    setActiveTab(next);
  };

  // Selected Scope: "global" by default (not connected to a particular account unless user switches!)
  const [selectedScope, setSelectedScope] = useState<string>("global");

  // Rule Sets state
  const [ruleSets, setRuleSets] = useState<RuleSet[]>(initialRuleSets);
  const [activeRuleSet, setActiveRuleSet] = useState<RuleSet>(initialRuleSet);
  const [status, setStatus] = useState<RuleEngineStatus | null>(initialStatus);
  const [compliance, setCompliance] = useState<RuleEngineCompliance | null>(initialCompliance);

  // Category filter state when switching from Overview to RuleSets
  const [filterCategory, setFilterCategory] = useState<RuleCategory | "All">("All");

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [inspectingRule, setInspectingRule] = useState<Rule | null>(null);

  // Fetch status and compliance when scope changes
  useEffect(() => {
    let isCancelled = false;
    const fetchScopeData = async () => {
      try {
        const endpointStatus = `/api/rules/status/${selectedScope}`;
        const endpointCompliance = `/api/rules/compliance/${selectedScope}`;

        const [resStatus, resCompliance] = await Promise.all([
          fetch(endpointStatus),
          fetch(endpointCompliance),
        ]);

        if (!isCancelled && resStatus.ok && resCompliance.ok) {
          const s = await resStatus.json();
          const c = await resCompliance.json();
          setStatus(s);
          setCompliance(c);
          if (s.activeRuleSet) {
            setActiveRuleSet(s.activeRuleSet);
          }
        }
      } catch (err) {
        console.error("Failed to fetch scope status:", err);
        showFeedback({ kind: "failure", title: "Couldn’t load rule status", description: "Please check your connection and try changing the scope again." });
      }
    };

    fetchScopeData();
    return () => {
      isCancelled = true;
    };
  }, [selectedScope, showFeedback]);

  // Handle rule created or updated
  const handleSaveRuleSuccess = (savedRule: Rule) => {
    setActiveRuleSet((prev) => {
      const currentRules = prev.rules || [];
      const index = currentRules.findIndex((r) => r.id === savedRule.id);
      let updatedRules: Rule[];
      if (index >= 0) {
        updatedRules = [...currentRules];
        updatedRules[index] = savedRule;
      } else {
        updatedRules = [savedRule, ...currentRules];
      }
      return { ...prev, rules: updatedRules, ruleCount: updatedRules.length };
    });

    // Refresh status stats
    if (status) {
      const isNew = !(activeRuleSet.rules || []).some((r) => r.id === savedRule.id);
      if (isNew && savedRule.isActive) {
        setStatus({
          ...status,
          totalActiveRules: status.totalActiveRules + 1,
          activeRulesByCategory: {
            ...status.activeRulesByCategory,
            [savedRule.ruleCategory]:
              (status.activeRulesByCategory[savedRule.ruleCategory] || 0) + 1,
          },
        });
      }
    }
  };

  // Handle rule active toggle
  const handleRuleToggled = (ruleId: string, isActive: boolean) => {
    const targetRule = (activeRuleSet.rules || []).find((r) => r.id === ruleId);

    setActiveRuleSet((prev) => {
      const updatedRules = (prev.rules || []).map((r) =>
        r.id === ruleId ? { ...r, isActive } : r,
      );
      return { ...prev, rules: updatedRules };
    });

    setRuleSets((prev) =>
      prev.map((rs) => {
        if (rs.id === activeRuleSet.id) {
          const updatedRules = (rs.rules || []).map((r) =>
            r.id === ruleId ? { ...r, isActive } : r,
          );
          return { ...rs, rules: updatedRules };
        }
        return rs;
      }),
    );

    setInspectingRule((prev) => (prev && prev.id === ruleId ? { ...prev, isActive } : prev));

    if (status && targetRule && targetRule.isActive !== isActive) {
      const cat = targetRule.ruleCategory;
      const diff = isActive ? 1 : -1;
      setStatus({
        ...status,
        totalActiveRules: Math.max(0, status.totalActiveRules + diff),
        activeRulesByCategory: {
          ...status.activeRulesByCategory,
          [cat]: Math.max(0, (status.activeRulesByCategory[cat] || 0) + diff),
        },
      });
    }
  };

  // Handle toggle directly from inspect modal with API call
  const handleToggleRuleFromModal = async (ruleId: string, nextActive: boolean) => {
    handleRuleToggled(ruleId, nextActive);
    try {
      const res = await fetch(`/api/rules/sets/${activeRuleSet.id}/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) {
        throw new Error("Failed to toggle rule active state");
      }
      showFeedback({ kind: "success", title: "Rule status updated", description: `Rule is now ${nextActive ? "active" : "inactive"}.` });
    } catch (err) {
      console.error("Failed to toggle rule:", err);
      handleRuleToggled(ruleId, !nextActive);
      showFeedback({ kind: "failure", title: "Rule status wasn’t changed", description: err instanceof Error ? err.message : "Please try again." });
    }
  };

  // Handle rule deleted
  const handleRuleDeleted = (ruleId: string) => {
    setActiveRuleSet((prev) => {
      const updatedRules = (prev.rules || []).filter((r) => r.id !== ruleId);
      return { ...prev, rules: updatedRules, ruleCount: updatedRules.length };
    });
  };

  // Handle rule set copied to account
  const handleCopySuccess = (newSet: RuleSet) => {
    setRuleSets((prev) => [newSet, ...prev]);
    setActiveRuleSet(newSet);
    if (newSet.accountId) {
      setSelectedScope(newSet.accountId);
    }
  };

  const handleSelectCategoryFromOverview = (cat: RuleCategory) => {
    setFilterCategory(cat);
    switchTab("rulesets");
  };

  return (
    <div className="w-full space-y-5">
      {/* 
        TITLE SECTION:
        100% width, no max-width, 1rem padding in main wrapper.
        NO upper badge, NO subtitle, as explicitly requested!
      */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Rule Engine
        </h1>

        {/* Top Controls: Scope Selector & New Rule */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Scope Selector: Global vs Specific Account */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-card/70 px-2.5 py-1 text-xs shadow-sm">
            <Globe size={13} className="text-violet-400 shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium">Scope:</span>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="bg-transparent font-semibold text-foreground text-xs focus:outline-none cursor-pointer"
            >
              <option value="global" className="bg-neutral-900 text-white">
                Global System (All Accounts)
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-neutral-900 text-white">
                  Account: {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingRule(null);
              setEditorOpen(true);
            }}
            className="h-8 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-950/30 press-scale"
          >
            <Plus size={13} className="mr-1.5" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Navigation Tabs Bar — Apple §12: translucent material on tab chrome */}
      <div className="flex items-center justify-between border-b border-border/70 pb-px relative">
        <div className="flex items-center gap-1 relative">
          {(["overview", "rulesets", "simulation"] as TabKey[]).map((tab) => {
            const isActive = activeTab === tab;
            const icons = { overview: LayoutDashboard, rulesets: Layers, simulation: Zap };
            const labels = { overview: "Overview", rulesets: "Rule Sets", simulation: "Simulation" };
            const Icon = icons[tab];

            return (
              <button
                key={tab}
                type="button"
                onClick={() => switchTab(tab)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold -mb-px press-scale-sm",
                  isActive
                    ? "text-violet-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* Apple §4: Spring-animated underline indicator */}
                {isActive && (
                  <motion.span
                    layoutId="rule-engine-tab-indicator"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-violet-500 rounded-full"
                    transition={springTab}
                  />
                )}
                <Icon size={14} />
                {labels[tab]}
                {tab === "rulesets" && (
                  <span className="ml-0.5 rounded-full bg-white/[0.08] px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                    {activeRuleSet.rules?.length || 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scope Pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-400" />
          <span>
            {selectedScope === "global"
              ? "System Default Guardrails (Active on all accounts)"
              : "Account-Specific Guardrails Active"}
          </span>
        </div>
      </div>

      {/* Apple §7: Tab content with directional spring transitions */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeTab}
          custom={direction}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -20 }}
          transition={springContent}
        >
          {activeTab === "overview" && (
            <OverviewTab
              status={status}
              compliance={compliance}
              activeRuleSet={activeRuleSet}
              onSelectCategory={handleSelectCategoryFromOverview}
              onOpenSimulator={() => switchTab("simulation")}
            />
          )}

          {activeTab === "rulesets" && (
            <RuleSetsTab
              ruleSet={activeRuleSet}
              ruleSets={ruleSets}
              accounts={accounts}
              selectedCategoryFilter={filterCategory}
              onSelectRuleSet={(id) => {
                const found = ruleSets.find((rs) => rs.id === id);
                if (found) setActiveRuleSet(found);
              }}
              onOpenCreateRule={() => {
                setEditingRule(null);
                setEditorOpen(true);
              }}
              onOpenEditRule={(rule) => {
                setEditingRule(rule);
                setEditorOpen(true);
              }}
              onOpenInspectRule={(rule) => {
                setInspectingRule(rule);
                setInspectOpen(true);
              }}
              onOpenCopyModal={() => setCopyModalOpen(true)}
              onRuleToggled={handleRuleToggled}
              onRuleDeleted={handleRuleDeleted}
            />
          )}

          {activeTab === "simulation" && (
            <SimulationTab
              accounts={accounts}
              selectedAccountId={selectedScope === "global" ? null : selectedScope}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <RuleEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        ruleSetId={activeRuleSet.id}
        initialRule={editingRule}
        onSaveSuccess={handleSaveRuleSuccess}
      />

      <InspectRuleModal
        open={inspectOpen}
        onOpenChange={setInspectOpen}
        rule={inspectingRule}
        onEdit={(rule) => {
          setEditingRule(rule);
          setEditorOpen(true);
        }}
        onToggleActive={handleToggleRuleFromModal}
      />

      <CopyRulesModal
        open={copyModalOpen}
        onOpenChange={setCopyModalOpen}
        sourceRuleSet={activeRuleSet}
        accounts={accounts}
        onCopySuccess={handleCopySuccess}
      />
    </div>
  );
}
