"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PlanSidebar, type TradingPlanItem } from "@/components/plan/plan-sidebar";
import { PlanWordEditor } from "@/components/plan/word-editor/plan-word-editor";
import { PlanAiSidebar } from "@/components/plan/plan-ai-sidebar";

interface PlanViewProps {
  initialPlans?: TradingPlanItem[];
}

export type SaveStatus = "saved" | "saving" | "error";

export function PlanView({ initialPlans }: PlanViewProps) {
  const [plans, setPlans] = useState<TradingPlanItem[]>(() => {
    if (initialPlans && initialPlans.length > 0) return initialPlans;
    return [];
  });

  const [activePlanId, setActivePlanId] = useState<string>(() => {
    return initialPlans?.[0]?.id || "";
  });

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if initialPlans changes
  useEffect(() => {
    if (initialPlans && initialPlans.length > 0) {
      setPlans(initialPlans);
      if (!activePlanId || !initialPlans.some((p) => p.id === activePlanId)) {
        setActivePlanId(initialPlans[0].id);
      }
    }
  }, [initialPlans]);

  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

  // Cloud Autosave Function (Debounced)
  const persistPlanToDb = useCallback(
    async (planToSave: TradingPlanItem) => {
      setSaveStatus("saving");
      try {
        const response = await fetch("/api/plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: planToSave.id,
            title: planToSave.title,
            sessionTag: planToSave.sessionTag,
            summary: planToSave.summary,
            content: planToSave.content,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save plan to database");
        }

        setSaveStatus("saved");
      } catch (err) {
        console.error("Autosave error:", err);
        setSaveStatus("error");
      }
    },
    []
  );

  const triggerDebouncedAutosave = useCallback(
    (updatedPlan: TradingPlanItem) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSaveStatus("saving");
      saveTimeoutRef.current = setTimeout(() => {
        void persistPlanToDb(updatedPlan);
      }, 600);
    },
    [persistPlanToDb]
  );

  const handleCreatePlan = async () => {
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Trading Plan ${plans.length + 1}`,
          sessionTag: "NY AM",
          summary: "New trading plan document.",
          content: `<h1>New Trading Plan</h1><p>Document today's market context, planned setups, and risk boundaries...</p><p><br/></p>`,
        }),
      });

      if (!response.ok) throw new Error("Failed to create plan in database");
      const { plan } = await response.json();

      setPlans((prev) => [plan, ...prev]);
      setActivePlanId(plan.id);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Create plan error:", err);
      // Fallback local create if network fails
      const fallbackId = `plan-${Date.now()}`;
      const newPlan: TradingPlanItem = {
        id: fallbackId,
        title: `Trading Plan ${plans.length + 1}`,
        sessionTag: "Custom",
        summary: "New blank trading plan document.",
        content: `<h1>New Trading Plan</h1><p>Document today's market context, planned setups, and risk boundaries...</p><p><br/></p>`,
        updatedAt: "Just now",
        createdAt: "Today",
      };
      setPlans((prev) => [newPlan, ...prev]);
      setActivePlanId(fallbackId);
      setSaveStatus("saved");
    }
  };

  const handleDuplicatePlan = async (id: string) => {
    const target = plans.find((p) => p.id === id);
    if (!target) return;

    setSaveStatus("saving");
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${target.title} (Copy)`,
          sessionTag: target.sessionTag,
          summary: target.summary,
          content: target.content,
        }),
      });

      if (!response.ok) throw new Error("Failed to duplicate plan");
      const { plan } = await response.json();

      setPlans((prev) => [plan, ...prev]);
      setActivePlanId(plan.id);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Duplicate plan error:", err);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (plans.length <= 1) return;
    const remaining = plans.filter((p) => p.id !== id);
    setPlans(remaining);
    if (activePlanId === id) {
      setActivePlanId(remaining[0].id);
    }

    try {
      await fetch(`/api/plans?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Delete plan error:", err);
    }
  };

  const handleUpdateContent = (content: string, snippet?: string) => {
    if (!activePlan) return;
    const updatedPlan: TradingPlanItem = {
      ...activePlan,
      content,
      summary: snippet || activePlan.summary,
      updatedAt: "Just now",
    };

    setPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? updatedPlan : p))
    );

    triggerDebouncedAutosave(updatedPlan);
  };

  const handleUpdateTitle = (title: string) => {
    if (!activePlan) return;
    const updatedPlan: TradingPlanItem = {
      ...activePlan,
      title,
      updatedAt: "Just now",
    };

    setPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? updatedPlan : p))
    );

    triggerDebouncedAutosave(updatedPlan);
  };

  // Instant Manual Save (e.g. on Ctrl+S)
  const handleManualSave = () => {
    if (!activePlan) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    void persistPlanToDb(activePlan);
  };

  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col lg:flex-row gap-4 bg-transparent overflow-hidden">
      {/* ─── Left Sidebar (Different Trading Plans) ─── */}
      <PlanSidebar
        plans={plans}
        activePlanId={activePlanId}
        onSelectPlan={setActivePlanId}
        onCreatePlan={handleCreatePlan}
        onDuplicatePlan={handleDuplicatePlan}
        onDeletePlan={handleDeletePlan}
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
      />

      {/* ─── Center Section (Microsoft Word Style Editor) ─── */}
      <section className="flex-1 min-w-0 h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs flex flex-col">
        {activePlan ? (
          <PlanWordEditor
            plan={activePlan}
            saveStatus={saveStatus}
            onUpdateContent={handleUpdateContent}
            onUpdateTitle={handleUpdateTitle}
            onManualSave={handleManualSave}
            leftSidebarOpen={leftSidebarOpen}
            onToggleLeftSidebar={() => setLeftSidebarOpen(true)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            No plan selected
          </div>
        )}
      </section>

      {/* ─── AI Sidebar (Right End Side) ─── */}
      <PlanAiSidebar
        activePlan={activePlan}
        onPlanCreated={(newPlan) => {
          setPlans((prev) => [newPlan, ...prev.filter((p) => p.id !== newPlan.id)]);
          setActivePlanId(newPlan.id);
        }}
      />
    </div>
  );
}
