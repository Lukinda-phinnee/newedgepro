import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserStrategies } from "@/lib/db/strategies";
import { StrategyView } from "@/components/edge/strategy-view";

export const metadata: Metadata = {
  title: "Edge — EdgePro",
  description:
    "Define, evaluate, and iteratively refine your trading strategies with statistical precision.",
};


export default async function EdgePage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  const strategies = await getUserStrategies(session.user.id);

  return <StrategyView initialStrategies={strategies} />;
}
