import type { Metadata } from "next";
import { LoopDashboard } from "@/components/trader-notes/loop-module";

export const metadata: Metadata = {
  title: "Trader Notes — EdgePro",
  description: "Organize trading workspaces, research, and reflections.",
};

export default function TraderNotesPage() {
  return <LoopDashboard />;
}
