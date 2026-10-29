"use client";

import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  DollarSign,
  Filter,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TradingAccount, PortfolioSummary } from "@/types/account";
import { useActiveAccount } from "@/components/active-account-context";
import { PortfolioSummaryBanner } from "./portfolio-summary-banner";
import { AccountCard } from "./account-card";
import { CreateAccountDialog } from "./create-account-dialog";
import { EditAccountDialog } from "./edit-account-dialog";
import { ResetAccountDialog } from "./reset-account-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { AccountPerformanceRow } from "./account-performance-row";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

interface PortfolioHubViewProps {
  initialAccounts: TradingAccount[];
  initialSummary: PortfolioSummary;
}

export function PortfolioHubView({
  initialAccounts,
  initialSummary,
}: PortfolioHubViewProps) {
  const { accounts: contextAccounts, refreshAccounts, setActiveAccount } = useActiveAccount();
  const { showFeedback } = useOperationFeedback();
  const accounts = contextAccounts && contextAccounts.length > 0 ? contextAccounts : initialAccounts;
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || "",
  );
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "live" | "demo" | "active">("all");
  const [sortBy, setSortBy] = useState<"balance-desc" | "pnl-desc" | "newest">("balance-desc");

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<TradingAccount | null>(null);
  const [resetAccount, setResetAccount] = useState<TradingAccount | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<TradingAccount | null>(null);

  const announceSuccess = (description: string) => showFeedback({ kind: "success", title: "Changes saved", description });

  // Recompute summary
  const summary = useMemo(() => {
    const totalEquity = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const totalStartingBalance = accounts.reduce((sum, a) => sum + a.startingBalance, 0);
    const totalPnl = totalEquity - totalStartingBalance;
    const totalPnlPercent =
      totalStartingBalance > 0 ? (totalPnl / totalStartingBalance) * 100 : 0;
    const activeAccounts = accounts.filter((a) => a.status === "active").length;
    const liveAccounts = accounts.filter((a) => a.accountType === "live").length;
    const demoAccounts = accounts.filter((a) => a.accountType === "demo").length;
    const currencies = Array.from(new Set(accounts.map((a) => a.currency)));

    return {
      totalEquity,
      totalStartingBalance,
      totalPnl,
      totalPnlPercent,
      totalAccounts: accounts.length,
      activeAccounts,
      liveAccounts,
      demoAccounts,
      currencies,
      primaryCurrency: currencies[0] || "USD",
    };
  }, [accounts]);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  // Handlers — all mutations sync back to the global ActiveAccountContext
  const handleAccountCreated = (newAcc: TradingAccount) => {
    refreshAccounts([newAcc, ...accounts]);
    announceSuccess(`“${newAcc.name}” is ready in your portfolio.`);
  };

  const handleAccountUpdated = (updated: TradingAccount) => {
    refreshAccounts(accounts.map((a) => (a.id === updated.id ? updated : a)));
    announceSuccess(`Settings for “${updated.name}” were updated.`);
  };

  const handleAccountReset = (updated: TradingAccount) => {
    refreshAccounts(accounts.map((a) => (a.id === updated.id ? updated : a)));
    announceSuccess(`The balance for “${updated.name}” was reset.`);
  };

  const handleAccountDeleted = (id: string) => {
    const remaining = accounts.filter((a) => a.id !== id);
    // If deleted account was default and remaining exist, make first default
    const hadDefault = accounts.some((a) => a.id === id && a.isDefault);
    if (hadDefault && remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    refreshAccounts(remaining);
    announceSuccess("The account was removed from your portfolio.");
  };

  const handleSetDefault = async (accountId: string) => {
    setActiveAccount(accountId);
  };

  // Filter & Sort
  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.brokerName && a.brokerName.toLowerCase().includes(q)) ||
          a.currency.toLowerCase().includes(q),
      );
    }

    // Tabs
    if (filterTab === "live") {
      result = result.filter((a) => a.accountType === "live");
    } else if (filterTab === "demo") {
      result = result.filter((a) => a.accountType === "demo");
    } else if (filterTab === "active") {
      result = result.filter((a) => a.status === "active");
    }

    // Sorting
    result.sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;

      if (sortBy === "balance-desc") {
        return b.currentBalance - a.currentBalance;
      }
      if (sortBy === "pnl-desc") {
        const pnlA = a.currentBalance - a.startingBalance;
        const pnlB = b.currentBalance - b.startingBalance;
        return pnlB - pnlA;
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return result;
  }, [accounts, search, filterTab, sortBy]);

  return (
    <div className="space-y-3">
      {/* Aggregated Portfolio Banner */}
      <PortfolioSummaryBanner
        accounts={accounts}
        summary={summary}
      />

      {/* Selected Account Trading Performance & Guardrails */}
      {selectedAccount && (
        <AccountPerformanceRow
          accounts={accounts}
          selectedAccount={selectedAccount}
          onSelectAccount={(id) => setSelectedAccountId(id)}
        />
      )}

      {/* Filter and Control Bar */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 border-y border-border/70 py-3.5 sm:flex-row sm:items-center">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "all"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-950/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              All Accounts ({accounts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("demo")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "demo"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-950/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              Demo / Paper ({accounts.filter((a) => a.accountType === "demo").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("live")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "live"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-950/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              Live Brokers ({accounts.filter((a) => a.accountType === "live").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("active")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "active"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-950/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              Active Only ({accounts.filter((a) => a.status === "active").length})
            </button>
          </div>

          {/* Search, Sort, and Add Account Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                placeholder="Search accounts or brokers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8.5 pl-8 text-xs"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "balance-desc" | "pnl-desc" | "newest")
              }
              className="h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="balance-desc">Sort: Highest Balance</option>
              <option value="pnl-desc">Sort: Highest Return</option>
              <option value="newest">Sort: Recently Added</option>
            </select>

            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="h-8.5 gap-1.5 bg-violet-600 px-3.5 text-xs font-medium text-white shadow-sm hover:bg-violet-500 shrink-0"
            >
              <Plus size={14} />
              <span>Add Account</span>
            </Button>
          </div>
        </div>

        {/* Account Cards Grid */}
        {filteredAccounts.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onSetDefault={handleSetDefault}
                onEdit={(acc) => setEditAccount(acc)}
                onReset={(acc) => setResetAccount(acc)}
                onDelete={(acc) => setDeleteAccount(acc)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 py-16 px-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <BriefcaseBusiness size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              No accounts match your criteria
            </h3>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {search
                ? `No accounts found for "${search}". Try clearing your search term.`
                : "No accounts found in this category. Add a new demo or live trading account to get started."}
            </p>
            <div className="mt-5 flex gap-2">
              {search && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSearch("")}
                  className="h-8.5 text-xs"
                >
                  Clear search
                </Button>
              )}
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="h-8.5 gap-1.5 bg-violet-600 px-4 text-xs font-medium text-white shadow-sm hover:bg-violet-500"
              >
                <Plus size={14} />
                Create New Account
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Dialogs */}
      <CreateAccountDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onAccountCreated={handleAccountCreated}
      />

      <EditAccountDialog
        account={editAccount}
        open={Boolean(editAccount)}
        onOpenChange={(open) => !open && setEditAccount(null)}
        onAccountUpdated={handleAccountUpdated}
      />

      <ResetAccountDialog
        account={resetAccount}
        open={Boolean(resetAccount)}
        onOpenChange={(open) => !open && setResetAccount(null)}
        onAccountReset={handleAccountReset}
      />

      <DeleteAccountDialog
        account={deleteAccount}
        open={Boolean(deleteAccount)}
        onOpenChange={(open) => !open && setDeleteAccount(null)}
        onAccountDeleted={handleAccountDeleted}
      />
    </div>
  );
}

