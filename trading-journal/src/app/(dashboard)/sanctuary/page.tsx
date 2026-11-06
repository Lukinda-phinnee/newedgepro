import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { SanctuaryView } from "@/components/sanctuary/sanctuary-view";

export const metadata: Metadata = {
  title: "Sanctuary — EdgePro",
  description:
    "A calmer you today. Meditation, somatic breathwork, soundscapes, and Serenity AI for optimal trader psychological equilibrium.",
};

export default async function SanctuaryPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  return <SanctuaryView />;
}

