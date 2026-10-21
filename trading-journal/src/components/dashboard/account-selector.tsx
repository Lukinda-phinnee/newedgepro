"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useActiveAccount } from "@/components/active-account-context";
import { cn } from "@/lib/utils";

export function AccountSelector() {
  const { accounts, activeAccount, setActiveAccount, isSwitching } =
    useActiveAccount();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!activeAccount) return null;

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select trading account"
        className={cn(
          "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-150",
          "border-border/70 bg-white/[0.03] text-foreground/80",
          "hover:border-violet-500/40 hover:bg-white/[0.06]",
          open && "border-violet-500/50 bg-white/[0.06] ring-1 ring-violet-500/20",
          isSwitching && "opacity-70 pointer-events-none",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full shrink-0",
            activeAccount.accountType === "live"
              ? "bg-emerald-400"
              : "bg-violet-400",
          )}
        />
        <span className="font-medium truncate max-w-[110px]">
          {activeAccount.name}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
          {activeAccount.currency}{" "}
          {activeAccount.currentBalance.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}
        </span>
        <ChevronsUpDown
          size={12}
          className="shrink-0 text-muted-foreground/60"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Trading accounts"
          className={cn(
            "absolute right-0 top-[calc(100%+6px)] z-50 w-[280px]",
            "rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/30",
            "animate-in fade-in slide-in-from-top-1 duration-150",
          )}
        >
          {/* Header */}
          <div className="px-2.5 py-2">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/60 uppercase">
              Switch account
            </p>
          </div>

          {/* Account list */}
          <div className="max-h-[280px] overflow-y-auto space-y-0.5">
            {accounts.map((account) => {
              const isSelected = account.id === activeAccount.id;
              const pnl = account.currentBalance - account.startingBalance;
              const pnlPos = pnl >= 0;

              return (
                <button
                  key={account.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (!isSelected) {
                      setActiveAccount(account.id);
                    }
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors outline-none",
                    isSelected
                      ? "bg-violet-500/10 text-foreground"
                      : "text-foreground/80 hover:bg-white/[0.05]",
                  )}
                >
                  {/* Status dot */}
                  <span
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      account.accountType === "live"
                        ? "bg-emerald-400"
                        : "bg-violet-400",
                    )}
                  />

                  {/* Info */}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-medium">
                        {account.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                          account.accountType === "live"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-violet-500/10 text-violet-400",
                        )}
                      >
                        {account.accountType}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="tabular-nums">
                        {account.currency}{" "}
                        {account.currentBalance.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span
                        className={cn(
                          "tabular-nums font-medium",
                          pnlPos
                            ? "text-emerald-400"
                            : "text-rose-400",
                        )}
                      >
                        {pnlPos ? "+" : ""}
                        {pnl.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </span>
                  </span>

                  {/* Check mark */}
                  {isSelected && (
                    <Check
                      size={14}
                      className="shrink-0 text-violet-400"
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Separator + Manage link */}
          <div className="mt-1 border-t border-border/70 pt-1">
            <a
              href="/portfolio-hub"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted-foreground/80 transition-colors hover:bg-white/[0.05] hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Manage accounts in Portfolio Hub
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
