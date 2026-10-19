import { notFound } from "next/navigation";
import { ArrowUpRight, Sparkles } from "lucide-react";

export const instant = false;

const sections: Record<string, { title: string; description: string; eyebrow: string }> = {
  "trade-log": { title: "Trade log", description: "Record and organize your trades. Your journal will become the foundation for better decisions.", eyebrow: "EXECUTION" },
  "trade-review": { title: "Trade review", description: "Review your decisions, capture lessons, and turn every trade into an opportunity to improve.", eyebrow: "REFLECTION" },
  edge: { title: "Your edge", description: "Discover the setups, sessions, and conditions where you perform at your best.", eyebrow: "ANALYTICS" },
  "rule-engine": { title: "Rule engine", description: "Define the guardrails that keep your trading consistent and aligned with your plan.", eyebrow: "DISCIPLINE" },
  plan: { title: "Trading plan", description: "Set your intentions, define your levels, and prepare for the sessions ahead.", eyebrow: "PREPARATION" },
  "trader-notes": { title: "Trader notes", description: "Keep your observations, ideas, and reflections close to your trading practice.", eyebrow: "NOTEBOOK" },
  profile: { title: "Profile", description: "Your EdgePro account profile and personal details.", eyebrow: "YOUR ACCOUNT" },
  settings: { title: "Settings", description: "Manage your account preferences and journal experience.", eyebrow: "YOUR ACCOUNT" },
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const content = sections[section];
  if (!content) notFound();
  return <div className="mx-auto max-w-3xl py-8 sm:py-14"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-400/[0.06] px-3 py-1.5 text-[10px] font-semibold tracking-[0.13em] text-violet-300"><Sparkles size={12}/>{content.eyebrow}</div><h2 className="text-3xl font-semibold tracking-tight text-white">{content.title}<span className="text-violet-400">.</span></h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{content.description}</p><div className="mt-10 rounded-2xl border border-border/70 bg-card p-6 sm:p-8"><div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Sparkles size={19}/></div><h3 className="mt-5 text-base font-semibold text-foreground">A clearer picture starts here</h3><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground/80">This workspace is ready for your {content.title.toLowerCase()} tools. Add your trading activity to start building a more complete picture of your process.</p><div className="mt-6 flex items-center gap-2 text-xs font-medium text-violet-300">More tools coming soon <ArrowUpRight size={14}/></div></div></div>;
}
