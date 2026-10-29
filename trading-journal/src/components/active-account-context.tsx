"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import type { TradingAccount } from "@/types/account";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

export interface ActiveAccountContextValue {
  /** All trading accounts for the user */
  accounts: TradingAccount[];
  /** The currently-selected active account */
  activeAccount: TradingAccount | null;
  /** Switch the global active account (persists to server) */
  setActiveAccount: (accountId: string) => void;
  /** Whether a switch is in-flight */
  isSwitching: boolean;
  /** Re-sync local state after account mutations (create / edit / delete) */
  refreshAccounts: (updated: TradingAccount[]) => void;
}

const ActiveAccountContext = createContext<ActiveAccountContextValue | null>(
  null,
);

export function ActiveAccountProvider({
  children,
  initialAccounts,
}: {
  children: React.ReactNode;
  initialAccounts: TradingAccount[];
}) {
  const [accounts, setAccounts] = useState<TradingAccount[]>(initialAccounts);
  const [isSwitching, startTransition] = useTransition();
  const router = useRouter();
  const { showFeedback } = useOperationFeedback();

  useEffect(() => setAccounts(initialAccounts), [initialAccounts]);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.isDefault) || accounts[0] || null,
    [accounts],
  );

  const setActiveAccount = useCallback(
    (accountId: string) => {
      // Optimistic: mark new default immediately
      setAccounts((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === accountId })),
      );

      // Persist to server in a non-blocking transition
      startTransition(async () => {
        try {
          const res = await fetch(`/api/accounts/${accountId}/default`, {
            method: "POST",
          });
          if (!res.ok) {
            // Roll back optimistic update on failure
            setAccounts((prev) =>
              prev.map((a) => ({ ...a, isDefault: a.id === activeAccount?.id })),
            );
            showFeedback({ kind: "failure", title: "Active account wasn’t changed", description: "The server couldn’t update your active account. Please try again." });
          } else {
            router.refresh();
            showFeedback({ kind: "success", title: "Active account changed", description: "Your selected account is now active." });
          }
        } catch (error) {
          // Roll back on network error
          setAccounts((prev) =>
            prev.map((a) => ({ ...a, isDefault: a.id === activeAccount?.id })),
          );
          showFeedback({ kind: "failure", title: "Active account wasn’t changed", description: error instanceof Error ? error.message : "Please check your connection and try again." });
        }
      });
    },
    [activeAccount?.id, router, showFeedback],
  );

  const refreshAccounts = useCallback((updated: TradingAccount[]) => {
    setAccounts(updated);
  }, []);

  const value = useMemo<ActiveAccountContextValue>(
    () => ({
      accounts,
      activeAccount,
      setActiveAccount,
      isSwitching,
      refreshAccounts,
    }),
    [accounts, activeAccount, setActiveAccount, isSwitching, refreshAccounts],
  );

  return (
    <ActiveAccountContext value={value}>
      {children}
    </ActiveAccountContext>
  );
}

const fallbackContextValue: ActiveAccountContextValue = {
  accounts: [],
  activeAccount: null,
  setActiveAccount: () => {},
  isSwitching: false,
  refreshAccounts: () => {},
};

export function useActiveAccount() {
  const ctx = useContext(ActiveAccountContext);
  if (!ctx) {
    return fallbackContextValue;
  }
  return ctx;
}
