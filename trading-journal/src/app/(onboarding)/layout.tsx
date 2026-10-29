import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { userHasTradingAccount } from "@/lib/db/accounts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getUserPreferences } from "@/lib/db/profile";
import { UserPreferencesProvider } from "@/components/user-preferences-provider";

export const instant = false;

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");
  if (await userHasTradingAccount(session.user.id)) redirect("/dashboard");
  const preferences = await getUserPreferences(session.user.id);

  return (
    <UserPreferencesProvider initialPreferences={preferences}>
      <DashboardShell user={{ name: session.user.name, email: session.user.email }}>
        {children}
      </DashboardShell>
    </UserPreferencesProvider>
  );
}
