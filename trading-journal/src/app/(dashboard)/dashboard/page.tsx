import type { Metadata } from "next";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowDownRight, ArrowUpRight, ChevronRight, CircleHelp, Clock3, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard — EdgePro" };
export const instant = false;

const stats = [
  { label: "Net P&L", value: "+$2,840.50", detail: "+12.8% this month", positive: true, icon: TrendingUp },
  { label: "Win rate", value: "64.2%", detail: "16 wins · 9 losses", positive: true, icon: ArrowUpRight },
  { label: "Total trades", value: "25", detail: "Across 8 trading days", positive: null, icon: Clock3 },
  { label: "Avg. risk / reward", value: "1 : 2.4", detail: "+0.3 vs last month", positive: true, icon: TrendingUp },
];

export default async function DashboardPage() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/sign-in");
  const firstName = session.user.name?.split(" ")[0] ?? "Trader";

  return <div className="space-y-7">
    <section>
      <div><p className="mb-2 text-xs font-medium text-violet-300">Sunday, October 18, 2026 <span className="mx-1.5 text-muted-foreground/40">·</span> Week 42</p><h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Good evening, {firstName}<span className="text-violet-400">.</span></h2><p className="mt-1.5 text-sm text-muted-foreground/80">Here’s how your trading is shaping up.</p></div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, detail, positive, icon: Icon }) => <article key={label} className="rounded-xl border border-border/70 bg-card p-4 sm:p-5"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground/80">{label}</span><Icon size={15} className="text-muted-foreground/60" /></div><div className="mt-3 text-[25px] font-semibold tracking-tight text-foreground">{value}</div><p className={`mt-1 text-[11px] ${positive ? "text-emerald-400" : "text-muted-foreground/80"}`}>{positive && <ArrowUpRight size={12} className="mr-0.5 inline" />}{detail}</p></article>)}
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
      <article className="rounded-xl border border-border/70 bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between"><div><h3 className="text-sm font-semibold text-foreground/90">Performance</h3><p className="mt-1 text-xs text-muted-foreground/80">Your cumulative P&L over time</p></div><button className="rounded-md border border-border/70 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-white/[0.04]">This month <ChevronRight size={12} className="ml-1 inline rotate-90" /></button></div>
        <div className="relative mt-7 h-[210px] overflow-hidden rounded-lg bg-[linear-gradient(to_bottom,rgba(139,92,246,0.08),transparent)]">
          <div className="absolute inset-0 flex flex-col justify-between">{["$3k", "$2k", "$1k", "$0"].map((n) => <div key={n} className="flex items-center gap-3"><span className="w-7 text-[10px] text-muted-foreground/60">{n}</span><span className="h-px flex-1 border-t border-dashed border-border/70" /></div>)}</div>
          <svg viewBox="0 0 700 190" preserveAspectRatio="none" className="absolute inset-0 h-full w-full pl-10" aria-label="P&L trend line"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity=".3"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/></linearGradient></defs><path d="M0 158 C35 150 48 162 75 143 S120 150 145 123 S190 135 215 112 S255 128 285 95 S330 110 360 84 S408 101 435 70 S478 86 510 52 S550 67 580 42 S625 48 650 26 S678 35 700 14 L700 190 L0 190Z" fill="url(#area)"/><path d="M0 158 C35 150 48 162 75 143 S120 150 145 123 S190 135 215 112 S255 128 285 95 S330 110 360 84 S408 101 435 70 S478 86 510 52 S550 67 580 42 S625 48 650 26 S678 35 700 14" fill="none" stroke="#a78bfa" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/><circle cx="700" cy="14" r="4" fill="#c4b5fd" /></svg>
        </div><div className="mt-3 flex justify-between pl-10 text-[10px] text-muted-foreground/60"><span>Oct 1</span><span>Oct 5</span><span>Oct 10</span><span>Oct 15</span><span>Oct 18</span></div>
      </article>

      <article className="rounded-xl border border-border/70 bg-card p-5 sm:p-6"><div className="flex items-start justify-between"><div><h3 className="text-sm font-semibold text-foreground/90">Recent trades</h3><p className="mt-1 text-xs text-muted-foreground/80">Your latest activity</p></div><Link href="/trade-log" className="text-[11px] text-violet-300 hover:text-violet-200">View all <ChevronRight size={13} className="inline" /></Link></div>
        <div className="mt-4 divide-y divide-white/[0.055]">{[{ticker:"NQ", side:"Long", time:"Today, 10:42 AM", pnl:"+$420.00", up:true, setup:"Opening range"},{ticker:"ES", side:"Short", time:"Today, 9:18 AM", pnl:"+$185.50", up:true, setup:"VWAP rejection"},{ticker:"NQ", side:"Long", time:"Yesterday, 2:06 PM", pnl:"−$120.00", up:false, setup:"Trend continuation"},{ticker:"CL", side:"Short", time:"Oct 15, 11:32 AM", pnl:"+$315.00", up:true, setup:"Break & retest"}].map((trade) => <div key={`${trade.ticker}-${trade.time}`} className="flex items-center justify-between py-3"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-white/[0.045] text-[10px] font-semibold text-foreground/80">{trade.ticker}</span><span><span className="block text-xs font-medium text-foreground/80">{trade.ticker} <span className="text-muted-foreground/60">·</span> <span className={trade.side === "Long" ? "text-emerald-400" : "text-rose-400"}>{trade.side}</span></span><span className="mt-0.5 block text-[10px] text-muted-foreground/60">{trade.setup} <span className="mx-1">·</span> {trade.time}</span></span></div><span className={`text-xs font-medium ${trade.up ? "text-emerald-400" : "text-rose-400"}`}>{trade.pnl}</span></div>)}</div>
      </article>
    </section>

    <section className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-xl border border-border/70 bg-card p-5"><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-emerald-400/[0.1] text-emerald-400"><TrendingUp size={14}/></span><h3 className="text-xs font-semibold text-foreground/80">Top setup</h3></div><p className="mt-4 text-lg font-semibold text-foreground">Opening range</p><p className="mt-1 text-[11px] text-muted-foreground/80">6 trades <span className="mx-1.5 text-muted-foreground/40">·</span> 83% win rate</p><div className="mt-4 h-1 rounded-full bg-white/[0.06]"><div className="h-1 w-[83%] rounded-full bg-emerald-400"/></div></article>
      <article className="rounded-xl border border-border/70 bg-card p-5"><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-violet-400/[0.1] text-violet-300"><CircleHelp size={14}/></span><h3 className="text-xs font-semibold text-foreground/80">Review reminder</h3></div><p className="mt-4 text-sm font-medium text-foreground">3 trades need a review</p><p className="mt-1 text-[11px] text-muted-foreground/80">Capture what you learned today.</p><Link href="/trade-review" className="mt-3 inline-flex items-center text-[11px] text-violet-300 hover:text-violet-200">Start reviewing <ChevronRight size={13}/></Link></article>
      <article className="rounded-xl border border-border/70 bg-card p-5"><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-amber-400/[0.1] text-amber-300"><ArrowDownRight size={14}/></span><h3 className="text-xs font-semibold text-foreground/80">Stay on track</h3></div><p className="mt-4 text-sm font-medium text-foreground">Daily loss limit: 42% used</p><p className="mt-1 text-[11px] text-muted-foreground/80">$420 of your $1,000 daily limit.</p><div className="mt-4 h-1 rounded-full bg-white/[0.06]"><div className="h-1 w-[42%] rounded-full bg-amber-400"/></div></article>
    </section>
  </div>;
}
