function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl border border-border/60 bg-card/50 ${className}`} />;
}

function Metrics({ count = 4 }: { count?: number }) {
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{Array.from({ length: count }, (_, i) => <Block key={i} className="h-28" />)}</div>;
}

export function DashboardPageLoading() {
  return <div className="space-y-5"><Metrics /><div className="grid grid-cols-1 gap-4 lg:grid-cols-5"><Block className="h-[360px] lg:col-span-2" /><Block className="h-[360px] lg:col-span-3" /></div><Block className="h-[300px]" /></div>;
}

export function TradeLogPageLoading() {
  return <div className="space-y-5"><div className="flex h-10 items-center justify-between"><Block className="h-9 w-40" /><Block className="h-9 w-56" /></div><div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, i) => <Block key={i} className="h-24" />)}</div></div>;
}

export function TradeReviewPageLoading() {
  return <div className="space-y-5"><Metrics /><Block className="h-11 w-56" /><Block className="h-[460px] w-full" /></div>;
}

export function PortfolioHubPageLoading() {
  return <div className="space-y-5"><Block className="h-40 w-full" /><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Block key={i} className="h-52" />)}</div></div>;
}

export function EdgePageLoading() {
  return <div className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"><Block className="h-[600px]" /><div className="space-y-4"><Block className="h-20" /><Block className="h-48" /><Block className="h-64" /></div></div>;
}

export function RuleEnginePageLoading() {
  return <div className="space-y-5"><div className="flex items-center justify-between"><Block className="h-9 w-56" /><Block className="h-9 w-36" /></div><Metrics /><div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><Block className="h-[420px]" /><Block className="h-[420px]" /></div></div>;
}

export function SectionPageLoading() {
  return <div className="mx-auto max-w-3xl space-y-5 py-8"><Block className="h-8 w-36" /><Block className="h-12 w-72" /><Block className="h-5 w-full max-w-xl" /><Block className="mt-10 h-64 w-full" /></div>;
}

export function NavigationPageLoading({ href }: { href: string }) {
  if (href === "/dashboard") return <DashboardPageLoading />;
  if (href === "/trade-log") return <TradeLogPageLoading />;
  if (href === "/trade-review") return <TradeReviewPageLoading />;
  if (href === "/portfolio-hub") return <PortfolioHubPageLoading />;
  if (href === "/edge") return <EdgePageLoading />;
  if (href === "/rule-engine") return <RuleEnginePageLoading />;
  return <SectionPageLoading />;
}
