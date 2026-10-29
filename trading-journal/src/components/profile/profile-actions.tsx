"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

export function ProfileActions() {
  const router = useRouter();
  const { showFeedback } = useOperationFeedback();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      const { error: signOutError } = await authClient.signOut();
      if (signOutError) throw signOutError;
      router.replace("/sign-in");
      router.refresh();
    } catch {
      showFeedback({ kind: "failure", title: "Sign out failed", description: "Couldn’t sign out. Please try again." });
      setBusy(false);
    }
  };

  return <div className="flex flex-col items-end gap-1.5">
    <Button variant="outline" size="sm" onClick={signOut} disabled={busy} className="rounded-xl px-3"><LogOut size={14}/>{busy ? "Signing out…" : "Sign out"}</Button>
  </div>;
}
