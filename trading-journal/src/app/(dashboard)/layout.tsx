import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ActiveAccountProvider } from "@/components/active-account-context";
import { OperationFeedbackProvider } from "@/components/ui/operation-feedback";
import { auth } from "@/lib/auth/server";
import { getUserTradingAccounts } from "@/lib/db/accounts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShellLoading />}>
      <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
    </Suspense>
  );
}

async function AuthenticatedDashboard({ children }: { children: React.ReactNode }) {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const accounts = await getUserTradingAccounts(session.user.id);
  if (accounts.length === 0) redirect("/onboarding");

  return (
    <OperationFeedbackProvider>
    <ActiveAccountProvider initialAccounts={accounts}>
      <DashboardShell
        user={{ name: session.user.name, email: session.user.email }}
      >
        {children}
      </DashboardShell>
    </ActiveAccountProvider>
    </OperationFeedbackProvider>
  );
}

function DashboardShellLoading() {
  return (
    <div className="fixed inset-0 flex h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      <aside className="hidden w-[252px] shrink-0 border-r border-border/70 bg-sidebar lg:block" />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="h-14 shrink-0 border-b border-border/70" />
        <main className="min-h-0 w-full flex-1 overflow-y-auto p-4 sm:p-7 lg:p-9">
          <div className="mx-auto max-w-[1440px] space-y-3" aria-hidden="true"><div className="h-5 w-40 animate-pulse rounded bg-muted/60" /><div className="h-1 w-full animate-pulse rounded bg-muted/40" /></div>
        </main>
      </div>
    </div>
  );
}

