import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { userHasTradingAccount } from "@/lib/db/accounts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const instant = false;

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");
  if (await userHasTradingAccount(session.user.id)) redirect("/dashboard");

  return (
    <DashboardShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </DashboardShell>
  );
}
