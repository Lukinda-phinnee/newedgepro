"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Check,
  Clock,
  Copy,
  Edit3,
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Strategy, StrategyStatus } from "@/types/strategy";
import { cn } from "@/lib/utils";

interface StrategyListPanelProps {
  strategies: Strategy[];
  selectedStrategyId: string | null;
  loadingStrategyId?: string | null;
  onSelectStrategy: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (strategy: Strategy) => void;
  onDuplicateStrategy: (strategy: Strategy) => void;
  onStatusChange: (id: string, status: StrategyStatus) => void;
  onDeleteStrategy: (id: string) => void;
  onCopyPlaybook: (strategy: Strategy) => void;
}

const statusDot: Record<StrategyStatus, string> = {
  ACTIVE: "bg-emerald-500",
  CALIBRATING: "bg-amber-400",
  PROBATION: "bg-rose-400",
  ARCHIVED: "bg-neutral-500",
};

interface MenuPosition {
  id: string;
  top: number;
  left: number;
}

export function StrategyListPanel({
  strategies,
  selectedStrategyId,
  loadingStrategyId,
  onSelectStrategy,
  onOpenAddModal,
  onOpenEditModal,
  onDuplicateStrategy,
  onStatusChange,
  onDeleteStrategy,
  onCopyPlaybook,
}: StrategyListPanelProps) {
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState<MenuPosition | null>(null);
  const [strategyToDelete, setStrategyToDelete] = useState<Strategy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close active dropdown on scroll or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
      }
    };
    const handleScroll = () => {
      if (activeMenu) {
        setActiveMenu(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [activeMenu]);

  const activeStrategies = useMemo(
    () =>
      strategies
        .filter((s) => s.status !== "ARCHIVED")
        .filter(
          (s) =>
            !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.category.toLowerCase().includes(search.toLowerCase())
        ),
    [strategies, search]
  );

  const archivedStrategies = useMemo(
    () =>
      strategies
        .filter((s) => s.status === "ARCHIVED")
        .filter(
          (s) =>
            !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.category.toLowerCase().includes(search.toLowerCase())
        ),
    [strategies, search]
  );

  const handleOpenMenu = (e: React.MouseEvent, strategy: Strategy) => {
    e.stopPropagation();
    if (activeMenu?.id === strategy.id) {
      setActiveMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 280;

    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight - 10) {
      top = Math.max(10, rect.top - menuHeight - 4);
    }

    setActiveMenu({ id: strategy.id, top, left });
  };

  const activeMenuStrategy = useMemo(
    () => strategies.find((s) => s.id === activeMenu?.id) || null,
    [strategies, activeMenu]
  );

  const confirmDelete = async () => {
    if (!strategyToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteStrategy(strategyToDelete.id);
      setStrategyToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <aside className="flex flex-col h-full w-full border-r border-border/70 bg-card text-card-foreground overflow-hidden select-none">
        {/* Header & Primary Add Strategy Button */}
        <div className="p-3 pb-2.5 space-y-2.5 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Strategies
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/50">
                {strategies.length}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <Button
            type="button"
            onClick={onOpenAddModal}
            size="sm"
            className="w-full h-8 text-xs font-semibold gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-900/30 cursor-pointer transition-all press-scale"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Add Strategy</span>
          </Button>
        </div>

        {/* Search Filter */}
        {strategies.length > 2 && (
          <div className="px-3 pt-2.5 pb-2 shrink-0">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search strategies or category…"
                className="w-full h-7 pl-8 pr-2.5 text-xs bg-muted/40 dark:bg-white/[0.04] border border-border/70 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-violet-500/60 focus:border-violet-500/60 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Strategy Items List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {activeStrategies.map((item) => {
            const isSelected = item.id === selectedStrategyId;
            const isMenuOpen = activeMenu?.id === item.id;
            const isLoading = loadingStrategyId === item.id;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectStrategy(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectStrategy(item.id);
                  }
                }}
                className={cn(
                  "group w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all relative cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-violet-500",
                  isSelected
                    ? "bg-violet-500/[0.12] text-foreground shadow-xs border border-violet-500/25"
                    : "hover:bg-muted/60 dark:hover:bg-white/[0.05] text-foreground/90 border border-transparent"
                )}
              >
                {/* Status dot or loading spinner */}
                {isLoading ? (
                  <Loader2 size={12} className="size-3 mt-1 shrink-0 animate-spin text-violet-500" />
                ) : (
                  <span
                    className={cn(
                      "size-2 rounded-full mt-1.5 shrink-0 ring-2 ring-background transition-transform",
                      statusDot[item.status],
                      isSelected && "scale-110"
                    )}
                    title={`Status: ${item.status}`}
                  />
                )}

                <div className="flex-1 min-w-0 pr-1">
                  <span
                    className={cn(
                      "text-[13px] font-medium truncate leading-tight block",
                      isSelected ? "text-foreground font-semibold" : "text-foreground/90"
                    )}
                  >
                    {item.name}
                  </span>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground truncate leading-snug">
                      {item.category}
                    </span>
                    {item.expectancyR > 0 && (
                      <span className="text-[10px] text-emerald-400 font-mono font-medium shrink-0">
                        +{item.expectancyR}R
                      </span>
                    )}
                  </div>
                </div>

                {/* 3-dot dropdown menu trigger */}
                <button
                  type="button"
                  onClick={(e) => handleOpenMenu(e, item)}
                  aria-label={`Options for ${item.name}`}
                  className={cn(
                    "p-1 rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all shrink-0 mt-0.5 cursor-pointer",
                    isMenuOpen || isSelected
                      ? "opacity-100 bg-white/[0.06] text-foreground"
                      : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <MoreVertical size={14} />
                </button>
              </div>
            );
          })}

          {activeStrategies.length === 0 && search && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No strategies matching &ldquo;{search}&rdquo;
            </div>
          )}

          {/* Archived Section */}
          {archivedStrategies.length > 0 && (
            <>
              <div className="px-3 pt-4 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                  Archived ({archivedStrategies.length})
                </span>
              </div>

              {archivedStrategies.map((item) => {
                const isSelected = item.id === selectedStrategyId;
                const isMenuOpen = activeMenu?.id === item.id;
                const isLoading = loadingStrategyId === item.id;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectStrategy(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectStrategy(item.id);
                      }
                    }}
                    className={cn(
                      "group w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-violet-500",
                      isSelected
                        ? "bg-violet-500/[0.10] text-foreground"
                        : "hover:bg-muted/60 dark:hover:bg-white/[0.04] text-muted-foreground"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 size={12} className="size-3 mt-1 shrink-0 animate-spin text-violet-500" />
                    ) : (
                      <span
                        className={cn(
                          "size-2 rounded-full mt-1.5 shrink-0",
                          statusDot[item.status]
                        )}
                      />
                    )}
                    <div className="min-w-0 flex-1 pr-1">
                      <span className="text-[12px] font-medium truncate block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 truncate block mt-0.5">
                        {item.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleOpenMenu(e, item)}
                      aria-label={`Options for ${item.name}`}
                      className={cn(
                        "p-1 rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all shrink-0 rounded cursor-pointer",
                        isMenuOpen ? "opacity-100 bg-white/[0.06]" : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </aside>

      {/* ─── Floating Dropdown Menu ─── */}
      {activeMenu && activeMenuStrategy && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActiveMenu(null)}
          />

          <div
            style={{ top: activeMenu.top, left: activeMenu.left }}
            className="fixed z-50 w-56 rounded-xl border border-border/80 bg-popover/95 p-1.5 text-xs shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info inside dropdown */}
            <div className="px-2.5 py-1.5 border-b border-border/60 mb-1">
              <p className="font-semibold text-foreground truncate text-[12px]">
                {activeMenuStrategy.name}
              </p>
            </div>

            {/* Edit Strategy */}
            <button
              type="button"
              onClick={() => {
                setActiveMenu(null);
                onOpenEditModal(activeMenuStrategy);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-violet-600/15 hover:text-violet-300 transition-colors cursor-pointer"
            >
              <Edit3 size={13} className="text-violet-400" />
              <span>Edit Strategy</span>
            </button>

            {/* Duplicate Strategy */}
            <button
              type="button"
              onClick={() => {
                setActiveMenu(null);
                onDuplicateStrategy(activeMenuStrategy);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-white/[0.07] transition-colors cursor-pointer"
            >
              <Copy size={13} className="text-sky-400" />
              <span>Duplicate Strategy</span>
            </button>

            {/* Copy Playbook Markdown */}
            <button
              type="button"
              onClick={() => {
                setActiveMenu(null);
                onCopyPlaybook(activeMenuStrategy);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-white/[0.07] transition-colors cursor-pointer"
            >
              <FileText size={13} className="text-amber-400" />
              <span>Copy Playbook Summary</span>
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-border/60" />

            {/* Status Change Section */}
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Change Status
            </div>

            {activeMenuStrategy.status !== "ACTIVE" && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  onStatusChange(activeMenuStrategy.id, "ACTIVE");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Mark as Active</span>
              </button>
            )}

            {activeMenuStrategy.status !== "CALIBRATING" && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  onStatusChange(activeMenuStrategy.id, "CALIBRATING");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-amber-500/15 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <span className="size-2 rounded-full bg-amber-400 shrink-0" />
                <span>Mark as Calibrating</span>
              </button>
            )}

            {activeMenuStrategy.status !== "PROBATION" && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  onStatusChange(activeMenuStrategy.id, "PROBATION");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <span className="size-2 rounded-full bg-rose-400 shrink-0" />
                <span>Mark as Probation</span>
              </button>
            )}

            {activeMenuStrategy.status !== "ARCHIVED" ? (
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  onStatusChange(activeMenuStrategy.id, "ARCHIVED");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-white/[0.07] transition-colors cursor-pointer"
              >
                <Archive size={13} className="text-neutral-400" />
                <span>Archive Strategy</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  onStatusChange(activeMenuStrategy.id, "ACTIVE");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <ArchiveRestore size={13} className="text-emerald-400" />
                <span>Restore to Active</span>
              </button>
            )}

            {/* Divider */}
            <div className="my-1 border-t border-border/60" />

            {/* Delete Strategy */}
            <button
              type="button"
              onClick={() => {
                const strat = activeMenuStrategy;
                setActiveMenu(null);
                setStrategyToDelete(strat);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete Strategy</span>
            </button>
          </div>
        </>
      )}

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog
        open={!!strategyToDelete}
        onOpenChange={(o) => {
          if (!o && !isDeleting) setStrategyToDelete(null);
        }}
      >
        <DialogContent className="max-w-md p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-rose-400 mb-1">
              <span className="flex size-8 items-center justify-center rounded-lg bg-rose-500/15">
                <AlertTriangle size={18} />
              </span>
              <DialogTitle className="text-base font-semibold">Delete Strategy</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{strategyToDelete?.name}</strong>?
              This will remove all associated checklists, guardrails, and refinement records. This
              action cannot be undone.
            </DialogDescription>
          </div>

          <div className="flex items-center justify-end gap-2 mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setStrategyToDelete(null)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Deleting…</span>
                </>
              ) : (
                <>
                  <Trash2 size={13} />
                  <span>Delete Strategy</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
