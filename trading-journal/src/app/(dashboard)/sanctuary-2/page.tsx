import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { Sanctuary2View } from "@/components/sanctuary-2/sanctuary2-view";

export const metadata: Metadata = {
  title: "Sanctuary 2 (Mental Conditioning) — EdgePro",
  description:
    "EdgePro Mental Conditioning & Guided Meditation. Train your mind, regulate emotion, and execute your trading plan with discipline.",
};

export default async function Sanctuary2Page() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");

  return <Sanctuary2View />;
}

