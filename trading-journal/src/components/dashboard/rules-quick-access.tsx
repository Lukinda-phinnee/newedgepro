"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, ListChecks, ShieldAlert } from "lucide-react";
import { useActiveAccount } from "@/components/active-account-context";
import { cn } from "@/lib/utils";
import { getTraderReadableRuleCopy } from "@/lib/rules/trader-readable";
import type { Rule, RuleEngineStatus } from "@/types/rules";

export function RulesQuickAccess() {
  const { activeAccount } = useActiveAccount();
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleSetName, setRuleSetName] = useState("Trading rules");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    const scope = activeAccount?.id ?? "global";

    fetch(`/api/rules/status/${encodeURIComponent(scope)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load rules");
        return (await response.json()) as RuleEngineStatus;
      })
      .then((status) => {
        setRules(status.activeRuleSet?.rules ?? []);
        setRuleSetName(status.activeRuleSet?.name ?? "Trading rules");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(true);
        setRules([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, activeAccount?.id]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeRules = rules.filter((rule) => rule.isActive);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="View trading rules"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition",
          open
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border/70 bg-white/[0.02] text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
        )}
        title="View your trading rules"
      >
        <ListChecks size={15} />
        <span className="hidden sm:inline">Rules</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Your trading rules"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/30"
        >
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Your rules</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{ruleSetName}</p>
            </div>
            {!loading && !loadError && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                {activeRules.length} active
              </span>
            )}
          </div>

          <div className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
            {loading ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading your rules…</p>
            ) : loadError ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">Couldn’t load your rules.</p>
                <button type="button" onClick={() => setOpen(false)} className="mt-2 text-xs font-medium text-primary hover:underline">
                  Close and try again
                </button>
              </div>
            ) : rules.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <ShieldAlert size={18} className="mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">No rules are set up for this account yet.</p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {rules.map((rule) => (
                  <li key={rule.id} className={cn("rounded-lg border p-3", rule.isActive ? "border-border/70 bg-background/60" : "border-border/40 bg-muted/20 opacity-70")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-primary/80">{rule.ruleCategory}</span>
                          <span className="text-[9px] text-muted-foreground">·</span>
                          <h3 className="text-xs font-semibold text-foreground">{rule.ruleName}</h3>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                          {getTraderReadableRuleCopy(rule)}
                        </p>
                      </div>
                      <span className={cn("mt-0.5 inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase", rule.isActive ? "text-emerald-500" : "text-muted-foreground")}>
                        {rule.isActive && <Check size={11} />}
                        {rule.isActive ? "On" : "Off"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/rule-engine"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-xs font-medium text-primary transition hover:bg-primary/5"
          >
            Manage rules
            <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
