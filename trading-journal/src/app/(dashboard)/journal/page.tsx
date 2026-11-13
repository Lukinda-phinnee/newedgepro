import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserTradingAccounts } from "@/lib/db/accounts";
import { getUserTrades } from "@/lib/db/trades";
import { JournalView } from "@/components/journal/journal-view";

export const metadata: Metadata = {
  title: "Trading Journal — EdgePro",
  description:
    "Visual chronological timeline of all trades taken with charts, screenshots, and execution summary captions.",
};

export default function JournalPage() {
  return (
    <Suspense fallback={<JournalLoadingSkeleton />}>
      <JournalDataLoader />
    </Suspense>
  );
}

async function JournalDataLoader() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);
  if (accounts.length === 0) redirect("/onboarding");

  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
  const trades = await getUserTrades(session.user.id, defaultAccount.id);

  return <JournalView initialTrades={trades} />;
}

function JournalLoadingSkeleton() {
  return (
    <div className="w-full space-y-6 pb-12" aria-hidden="true">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-muted/60" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-muted/60" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-9 w-72 animate-pulse rounded-xl bg-muted/50" />
        <div className="flex gap-2">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted/50" />
        </div>
      </div>

      {/* Month Section Skeleton */}
      <div className="space-y-4 pt-2">
        <div className="h-6 w-40 animate-pulse rounded bg-muted/60" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[16/14] animate-pulse rounded-2xl border border-border/50 bg-card/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
