"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreVertical,
  PanelLeftClose,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

export interface TradingPlanItem {
  id: string;
  title: string;
  sessionTag: string;
  summary: string;
  content: string;
  updatedAt: string;
  createdAt: string;
}

interface PlanSidebarProps {
  plans: TradingPlanItem[];
  activePlanId: string;
  onSelectPlan: (id: string) => void;
  onCreatePlan: () => void;
  onDuplicatePlan?: (id: string) => void;
  onDeletePlan: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function PlanSidebar({
  plans,
  activePlanId,
  onSelectPlan,
  onCreatePlan,
  onDuplicatePlan,
  onDeletePlan,
  isOpen,
  onToggle,
  className,
}: PlanSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { confirmAction, showFeedback } = useOperationFeedback();

  const filteredPlans = plans.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sessionTag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 h-full w-9 rounded-2xl border border-border/70 bg-card hover:bg-muted/50 p-1 flex flex-col items-center justify-between text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
        title="Open Plans Sidebar"
      >
        <div className="size-7 rounded-lg flex items-center justify-center hover:bg-muted/60 mt-1">
          <ChevronRight size={15} />
        </div>
        <span
          className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground/70"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Plans ({plans.length})
        </span>
        <div className="size-7 rounded-lg flex items-center justify-center hover:bg-muted/60 mb-1">
          <FileText size={14} className="text-violet-400" />
        </div>
      </button>
    );
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full w-64 xl:w-72 shrink-0 rounded-2xl border border-border/70 bg-card p-3 shadow-xs overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-border/70 shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <FileText size={13} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-tight text-foreground">
              Trading Plans
            </span>
            <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
              {plans.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCreatePlan}
            className="size-7 rounded-lg flex items-center justify-center bg-violet-600 text-white hover:bg-violet-500 transition-colors cursor-pointer shadow-2xs"
            title="Create New Trading Plan"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="py-2.5 shrink-0">
        <div className="relative flex items-center">
          <Search
            size={12}
            className="absolute left-2.5 text-muted-foreground/60 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plans..."
            className="w-full h-7 pl-7 pr-2.5 text-xs rounded-lg border border-border/60 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden focus:border-violet-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Plan List Area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 overscroll-contain">
        {filteredPlans.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground/60">
            <FileText size={20} className="mb-2 opacity-40 text-violet-400" />
            <p className="text-xs font-medium">No plans found</p>
            <button
              type="button"
              onClick={onCreatePlan}
              className="mt-2 text-[11px] text-violet-400 hover:underline cursor-pointer"
            >
              + Create a new plan
            </button>
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const isActive = plan.id === activePlanId;
            return (
              <div
                key={plan.id}
                onClick={() => onSelectPlan(plan.id)}
                className={cn(
                  "group relative p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                  isActive
                    ? "border-violet-500/70 bg-violet-500/15 dark:bg-violet-500/25 shadow-xs ring-1 ring-violet-500/30"
                    : "border-transparent hover:border-border/60 hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {isActive && (
                      <span className="size-1.5 rounded-full bg-violet-600 dark:bg-violet-400 shrink-0" />
                    )}
                    <h4
                      className={cn(
                        "text-xs font-semibold tracking-tight truncate flex-1",
                        isActive ? "text-violet-950 dark:text-white" : "text-foreground"
                      )}
                    >
                      {plan.title || "Untitled Plan"}
                    </h4>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {onDuplicatePlan && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicatePlan(plan.id);
                          showFeedback({
                            kind: "success",
                            title: "Plan duplicated",
                            description: `Created a copy of “${plan.title}”.`,
                          });
                        }}
                        className={cn(
                          "p-0.5 rounded transition-colors cursor-pointer",
                          isActive
                            ? "text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Duplicate plan"
                      >
                        <Copy size={12} />
                      </button>
                    )}

                    {plans.length > 1 && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmed = await confirmAction({
                            title: "Delete trading plan?",
                            description: `“${plan.title}” will be permanently deleted.`,
                            confirmLabel: "Delete plan",
                          });
                          if (confirmed) {
                            onDeletePlan(plan.id);
                            showFeedback({
                              kind: "success",
                              title: "Plan deleted",
                              description: `“${plan.title}” was deleted.`,
                            });
                          }
                        }}
                        className={cn(
                          "p-0.5 rounded transition-colors cursor-pointer",
                          isActive
                            ? "text-muted-foreground hover:text-rose-600 dark:text-white/70 dark:hover:text-rose-300"
                            : "text-muted-foreground hover:text-rose-400"
                        )}
                        title="Delete plan"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <p
                  className={cn(
                    "text-[11px] line-clamp-1 leading-snug",
                    isActive
                      ? "text-foreground/80 dark:text-white/80"
                      : "text-muted-foreground/75"
                  )}
                >
                  {plan.summary || "No preview content"}
                </p>

                <div className="flex items-center justify-between gap-1.5 mt-2 text-[10px] font-mono min-h-[18px]">
                  {(() => {
                    const tags = (plan.sessionTag || "")
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    if (tags.length === 0) {
                      return <span />;
                    }
                    return (
                      <div className="flex items-center gap-1 flex-wrap max-w-[65%]">
                        {tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className={cn(
                              "px-1.5 py-0.2 rounded font-sans text-[10px] truncate max-w-[80px]",
                              isActive
                                ? "bg-violet-500/20 text-violet-800 dark:bg-violet-500/30 dark:text-violet-200 border border-violet-500/30 dark:border-violet-500/40 font-medium"
                                : "bg-muted/60 text-muted-foreground border border-border/50"
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                        {tags.length > 2 && (
                          <span
                            className={cn(
                              "px-1 py-0.2 rounded font-sans text-[9px]",
                              isActive
                                ? "text-violet-700 dark:text-violet-300 font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            +{tags.length - 2}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <span
                    className={cn(
                      "shrink-0",
                      isActive ? "text-muted-foreground dark:text-white/70" : "text-muted-foreground/60"
                    )}
                  >
                    {plan.updatedAt}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-border/70 shrink-0 flex items-center justify-between text-[10px] text-muted-foreground/60">
        <span>Click to switch plan</span>
        <span className="font-mono">{plans.length} total</span>
      </div>
    </aside>
  );
}

