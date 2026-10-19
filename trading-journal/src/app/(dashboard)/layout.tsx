import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { auth } from "@/lib/auth/server";
import { userHasTradingAccount } from "@/lib/db/accounts";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");
  if (!(await userHasTradingAccount(session.user.id))) redirect("/onboarding");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground">
          <div className="fixed inset-y-0 left-0 hidden w-[252px] border-r border-border/70 bg-sidebar lg:block" />
          <div className="min-h-screen lg:pl-[252px]">
            <div className="h-14 border-b border-border/70" />
            <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-7 lg:p-9">
              {children}
            </main>
          </div>
        </div>
      }
    >
      <DashboardShell user={{ name: session.user.name, email: session.user.email }}>{children}</DashboardShell>
    </Suspense>
  );
}
