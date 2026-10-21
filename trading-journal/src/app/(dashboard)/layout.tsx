import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ActiveAccountProvider } from "@/components/active-account-context";
import { auth } from "@/lib/auth/server";
import { getUserTradingAccounts } from "@/lib/db/accounts";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);
  if (accounts.length === 0) redirect("/onboarding");

  return (
    <ActiveAccountProvider initialAccounts={accounts}>
      <Suspense
        fallback={
          <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <div className="hidden w-[252px] shrink-0 border-r border-border/70 bg-sidebar lg:block" />
            <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden">
              <div className="h-14 shrink-0 border-b border-border/70" />
              <main className="flex-1 overflow-y-auto w-full p-4 sm:p-7 lg:p-9">
                <div className="mx-auto max-w-[1440px]">
                  <div className="h-48 animate-pulse rounded-2xl border border-border/60 bg-card/40" />
                </div>
              </main>
            </div>
          </div>
        }
      >
        <DashboardShell
          user={{ name: session.user.name, email: session.user.email }}
        >
          {children}
        </DashboardShell>
      </Suspense>
    </ActiveAccountProvider>
  );
}
