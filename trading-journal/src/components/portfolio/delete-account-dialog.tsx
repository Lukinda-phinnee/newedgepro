"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Trash2, X } from "lucide-react";
import type { TradingAccount } from "@/types/account";

interface DeleteAccountDialogProps {
  account: TradingAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountDeleted: (accountId: string) => void;
}

export function DeleteAccountDialog({
  account,
  open,
  onOpenChange,
  onAccountDeleted,
}: DeleteAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!account) return null;

  const handleDelete = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      onAccountDeleted(account.id);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="relative border-b border-border/80 p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-300">
            <AlertCircle size={12} />
            <span>Danger Zone</span>
          </div>
          <DialogTitle className="mt-2 text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Delete Trading Account
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{account.name}</span>?
          </DialogDescription>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            This will permanently remove this account from your portfolio hub. If this was your active default account, EdgePro will automatically assign your next account as primary.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-9 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="h-9 gap-1.5 bg-rose-600 px-4 text-xs font-medium text-white shadow-sm hover:bg-rose-500"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Delete Account
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
