import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { PlanView } from "@/components/plan/plan-view";

export const metadata: Metadata = {
  title: "Trading Plan — EdgePro",
  description: "Trading plan workspace.",
};

export default async function PlanPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  return <PlanView />;
}
