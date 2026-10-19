"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  MoreVertical,
  RotateCcw,
  Sliders,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TradingAccount } from "@/types/account";
import { useState } from "react";

interface AccountCardProps {
  account: TradingAccount;
  onSetDefault: (accountId: string) => void;
  onEdit: (account: TradingAccount) => void;
  onReset: (account: TradingAccount) => void;
  onDelete: (account: TradingAccount) => void;
}

export function AccountCard({
  account,
  onSetDefault,
  onEdit,
  onReset,
  onDelete,
}: AccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isDemo = account.accountType === "demo";
  const netPnl = account.currentBalance - account.startingBalance;
  const netPnlPercent =
    account.startingBalance > 0 ? (netPnl / account.startingBalance) * 100 : 0;
  const isProfitable = netPnl >= 0;

  // Status badge style
  const getStatusBadge = () => {
    switch (account.status) {
      case "passed":
        return {
          label: "Target Met",
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "breached":
        return {
          label: "Breached",
          className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
      case "paused":
        return {
          label: "Paused",
          className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "archived":
        return {
          label: "Archived",
          className: "bg-white/5 text-muted-foreground border-border",
        };
      default:
        return {
          label: "Active",
          className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-card p-5 sm:p-6 shadow-sm ${
        account.isDefault
          ? "border-violet-500/50 shadow-md shadow-violet-950/10 ring-1 ring-violet-500/20"
          : "border-border/80 hover:border-violet-500/40 hover:shadow-md"
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                isDemo
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                  : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
              }`}
            >
              {isDemo ? <BriefcaseBusiness size={11} /> : <DollarSign size={11} />}
              {isDemo ? "Demo / Practice" : "Live Account"}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusBadge.className}`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {statusBadge.label}
            </span>

            {account.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                <Star size={10} className="fill-amber-300" />
                Active Primary
              </span>
            )}
          </div>

          {/* More menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              aria-label="Account actions menu"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-border/80 bg-popover/95 p-1.5 text-xs shadow-xl backdrop-blur-xl">
                  {!account.isDefault && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onSetDefault(account.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-foreground hover:bg-violet-600/15 hover:text-violet-300"
                    >
                      <Star size={13} />
                      <span>Set as active primary</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(account);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-foreground hover:bg-white/5"
                  >
                    <Sliders size={13} />
                    <span>Edit guardrails & info</span>
                  </button>
                  {isDemo && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onReset(account);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-amber-300 hover:bg-amber-500/10"
                    >
                      <RotateCcw size={13} />
                      <span>Reset demo balance</span>
                    </button>
                  )}
                  <Link
                    href={`/trade-log?account=${account.id}`}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-foreground hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    <TrendingUp size={13} />
                    <span>View account trades</span>
                  </Link>
                  <div className="my-1 border-t border-border/60" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(account);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 size={13} />
                    <span>Delete account</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Account Title & Broker */}
        <div className="mt-3.5">
          <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {account.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {account.brokerName || (isDemo ? "Simulated Practice" : "Personal Broker")}{" "}
            {account.accountNumber ? `· ${account.accountNumber}` : ""}
          </p>
        </div>

        {/* Balance & P&L Block */}
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/40 p-3.5 sm:p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground/80">
                Current Equity
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
                {account.currency} {account.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-medium text-muted-foreground/80">
                Net Return
              </span>
              <div
                className={`flex items-center justify-end text-sm font-semibold sm:text-base ${
                  isProfitable ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                }`}
              >
                {isProfitable ? (
                  <ArrowUpRight size={16} className="inline" />
                ) : (
                  <ArrowDownRight size={16} className="inline" />
                )}
                <span>
                  {isProfitable ? "+" : ""}
                  {netPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="ml-1 text-xs opacity-90">
                  ({isProfitable ? "+" : ""}
                  {netPnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
            <span>Starting Capital</span>
            <span className="font-medium text-foreground/80">
              {account.currency} {account.startingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/50 pt-4">
        {!account.isDefault ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetDefault(account.id)}
            className="h-8 gap-1 rounded-lg text-xs hover:border-violet-500/40 hover:text-violet-300"
          >
            <Star size={12} />
            Set as Primary
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-400">
            <CheckCircle2 size={13} />
            Primary Account
          </span>
        )}

        <div className="flex items-center gap-1.5">
          {isDemo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onReset(account)}
              title="Reset simulated balance"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-300"
            >
              <RotateCcw size={14} />
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(account)}
            className="h-8 gap-1 rounded-lg text-xs"
          >
            <Sliders size={12} />
            Guardrails
          </Button>
        </div>
      </div>
    </div>
  );
}
