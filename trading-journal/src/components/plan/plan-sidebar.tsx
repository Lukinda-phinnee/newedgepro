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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  onDeletePlan,
  isOpen,
  onToggle,
  className,
}: PlanSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

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
                    ? "border-violet-500/50 bg-violet-500/10 shadow-2xs"
                    : "border-transparent hover:border-border/60 hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <h4
                    className={cn(
                      "text-xs font-medium tracking-tight truncate flex-1",
                      isActive ? "text-violet-300 font-semibold" : "text-foreground"
                    )}
                  >
                    {plan.title || "Untitled Plan"}
                  </h4>

                  {plans.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${plan.title}"?`)) {
                          onDeletePlan(plan.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-rose-400 transition-opacity cursor-pointer shrink-0"
                      title="Delete plan"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground/75 line-clamp-1 leading-snug">
                  {plan.summary || "No preview content"}
                </p>

                <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-muted-foreground/60 font-mono">
                  <span className="px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground font-sans">
                    {plan.sessionTag || "Session"}
                  </span>
                  <span>{plan.updatedAt}</span>
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

