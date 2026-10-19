import { AccountOnboarding } from "@/components/accounts/account-onboarding";
import DashboardPage from "@/app/(dashboard)/dashboard/page";

export const metadata = { title: "Set up your first account — EdgePro" };
export const instant = false;

export default function OnboardingPage() {
  return (
    <>
      <DashboardPage />
      <AccountOnboarding />
    </>
  );
}
