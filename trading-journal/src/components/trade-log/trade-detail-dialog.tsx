"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  ShieldAlert,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Trade } from "@/types/trade";

interface TradeDetailDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: string;
}

export function TradeDetailDialog({ trade, open, onOpenChange, currency = "USD" }: TradeDetailDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  if (!trade) return null;

  const money = (value: number | null | undefined) => value == null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const dateTime = (value: string | null | undefined) => value
    ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "—";
  const reviewed = trade.reviewStatus === "reviewed";
  const flagged = trade.reviewStatus === "flagged";
  const compliant = trade.ruleVerdict === "ACCEPT" || (!trade.ruleVerdict && trade.followedRules === "yes");
  const violated = trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no");
  const ruleLabel = violated ? "Rule violation" : trade.ruleVerdict === "WARN" || trade.followedRules === "partial" ? "Review warning" : compliant ? "Compliant" : "Not recorded";
  const ruleTone = violated ? "destructive" : ruleLabel === "Review warning" ? "warning" : compliant ? "success" : "muted";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,900px)] max-w-4xl overflow-hidden border-border/80 bg-card/95 p-0 shadow-[0_28px_100px_-28px_rgba(0,0,0,0.7)] backdrop-blur-2xl data-[starting-style]:translate-y-3 data-[starting-style]:scale-[0.985] data-[ending-style]:translate-y-3 data-[ending-style]:scale-[0.985] transition-[opacity,transform] duration-200 motion-reduce:transition-opacity">
        <div className="flex max-h-[min(90dvh,900px)] flex-col">
          <header className="relative border-b border-border/70 bg-secondary/25 px-5 py-5 sm:px-7">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-2xl font-bold tracking-tight sm:text-3xl">{trade.symbol}</DialogTitle>
                  <Badge variant={trade.side === "long" ? "success" : "destructive"} className="uppercase">
                    {trade.side === "long" ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}{trade.side}
                  </Badge>
                  <Badge variant={trade.status === "open" ? "warning" : "muted"}>{trade.status === "open" ? "Open position" : "Closed"}</Badge>
                </div>
                <DialogDescription className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs">
                  <span>{dateTime(trade.openedAt)}</span><span aria-hidden="true">·</span><span>{trade.strategy || "Unassigned setup"}</span>
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close trade details" onClick={() => onOpenChange(false)} className="-mr-2 -mt-2 size-9 shrink-0 rounded-full">
                <X size={17} />
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/55 p-4 sm:grid-cols-4 sm:gap-4 sm:p-5">
              <Metric label="Net P&L" value={`${trade.pnl > 0 ? "+" : ""}${money(trade.pnl)}`} detail={`${trade.pnlPercentage > 0 ? "+" : ""}${trade.pnlPercentage.toFixed(2)}%`} tone={trade.pnl > 0 ? "positive" : trade.pnl < 0 ? "negative" : "neutral"} />
              <Metric label="Entry" value={money(trade.entryPrice)} detail={`Qty ${trade.quantity}`} />
              <Metric label="Exit" value={money(trade.exitPrice)} detail={trade.closedAt ? dateTime(trade.closedAt) : "Still in position"} />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Review</div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant={reviewed ? "success" : flagged ? "violet" : "warning"}>
                    {reviewed ? <CheckCircle2 size={12} /> : flagged ? <Bookmark size={12} /> : <Clock3 size={12} />}
                    {reviewed ? "Reviewed" : flagged ? "Flagged" : "Awaiting review"}
                  </Badge>
                  {trade.executionGrade && <Badge variant="outline">Grade {trade.executionGrade}</Badge>}
                </div>
                {reviewed && trade.reviewedAt && <p className="mt-1.5 text-[10px] text-muted-foreground">{dateTime(trade.reviewedAt)}</p>}
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <DetailSection title="Trade execution">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
                    <Field label="Opened" value={dateTime(trade.openedAt)} />
                    <Field label="Closed" value={dateTime(trade.closedAt)} />
                    <Field label="Duration" value={trade.closedAt ? duration(trade.openedAt, trade.closedAt) : "In progress"} />
                    <Field label="Planned entry" value={money(trade.plannedEntry)} />
                    <Field label="Stop loss" value={money(trade.stopLoss)} />
                    <Field label="Take profit" value={money(trade.takeProfit)} />
                    <Field label="Fees" value={money(trade.fees)} />
                    <Field label="R multiple" value={trade.rMultiple == null ? "—" : `${trade.rMultiple.toFixed(2)}R`} />
                    <Field label="Confidence" value={trade.confidence == null ? "—" : `${trade.confidence}/10`} />
                    <Field label="Market session" value={trade.marketSession || "—"} />
                    <Field label="Market condition" value={trade.marketCondition || "—"} />
                    <Field label="Setup" value={trade.strategy || "—"} />
                  </div>
                </DetailSection>

                <DetailSection title="Rule discipline">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={ruleTone}>{violated ? <ShieldAlert size={13} /> : compliant ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}{ruleLabel}</Badge>
                    {trade.followedRules && <span className="text-xs text-muted-foreground">Plan followed: {trade.followedRules === "yes" ? "Yes" : trade.followedRules === "partial" ? "Partially" : "No"}</span>}
                    {trade.ruleEvaluation?.ruleSetName && <span className="text-xs text-muted-foreground">· {trade.ruleEvaluation.ruleSetName}</span>}
                  </div>
                  {trade.ruleEvaluation?.triggeredRules?.length ? (
                    <ul className="mt-3 space-y-2">
                      {trade.ruleEvaluation.triggeredRules.map((rule, index) => <li key={`${rule.ruleId}-${index}`} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                        <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-foreground">{rule.ruleName}</span><Badge variant={rule.severity === "critical" || rule.severity === "high" ? "destructive" : "warning"} size="sm">{rule.severity}</Badge></div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rule.message}</p>
                      </li>)}
                    </ul>
                  ) : trade.ruleEvaluation?.messages?.length ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{trade.ruleEvaluation.messages.join(" · ")}</p> : <p className="mt-3 text-xs text-muted-foreground">No rule evaluation details recorded.</p>}
                </DetailSection>

                <DetailSection title="Trade notes">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{trade.notes || <span className="text-muted-foreground">No trade notes added.</span>}</p>
                </DetailSection>
              </div>

              <div className="space-y-6">
                <DetailSection title="Review record" action={trade.reviewRating ? <span className="flex items-center gap-1 text-xs font-semibold text-amber-500"><Star size={13} fill="currentColor" />{trade.reviewRating}/5</span> : null}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={reviewed ? "success" : flagged ? "violet" : "warning"}>{reviewed ? "Review complete" : flagged ? "Flagged for follow-up" : "Not reviewed yet"}</Badge>
                    {trade.executionGrade && <Badge variant="outline">Execution {trade.executionGrade}</Badge>}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
                    <Field label="Intended plan" value={trade.strategy || "—"} />
                    <Field label="Trade management" value={trade.tradeManagement || "—"} />
                    <Field label="Entry emotion" value={emotionLabel(trade.entryEmotion)} />
                    <Field label="Exit emotion" value={emotionLabel(trade.exitEmotion)} />
                  </div>
                  {trade.entryConfluences?.length ? <div className="mt-4"><h4 className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">Entry confluences</h4><div className="mt-2 flex flex-wrap gap-1.5">{trade.entryConfluences.map((item) => <Badge key={item} variant="muted">{item}</Badge>)}</div></div> : null}
                  {trade.mistakeTags?.length ? <div className="mt-3 flex flex-wrap gap-1.5">{trade.mistakeTags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}</div> : null}
                  <ReviewText title="What went well" value={trade.whatWentWell} />
                  <ReviewText title="To improve" value={trade.whatToImprove} />
                  <ReviewText title="Lesson learned" value={trade.lessonsLearned} />
                  <ReviewText title="Review notes" value={trade.reviewNotes} />
                  {!trade.whatWentWell && !trade.whatToImprove && !trade.lessonsLearned && !trade.reviewNotes && <p className="mt-3 text-xs text-muted-foreground">{reviewed ? "This review has no written reflections." : "Review reflections will appear here once recorded."}</p>}
                </DetailSection>

                <DetailSection title="Chart captures" action={trade.screenshots?.length ? <span className="text-[10px] text-muted-foreground">{trade.screenshots.length} attached</span> : null}>
                  {trade.screenshots?.length ? <div className="grid grid-cols-2 gap-3">{trade.screenshots.map((src, index) => { const title = trade.screenshotTitles?.[index] || `Chart ${index + 1}`; return <div key={`${index}-${src.slice(0, 24)}`} className="space-y-1.5"><button type="button" onClick={() => setPreview(src)} className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-border/70 bg-secondary/30 focus-visible:ring-2 focus-visible:ring-violet-500" aria-label={`View ${title}`}><Image src={src} alt={title} fill sizes="(max-width: 640px) 50vw, 360px" unoptimized className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" /><span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100"><ImageIcon size={18} /></span></button><p className="truncate text-xs font-medium text-foreground/80" title={title}>{title}</p></div>; })}</div> : <p className="text-xs text-muted-foreground">No chart captures attached to this trade.</p>}
                </DetailSection>

                <DetailSection title="Record details">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-3"><Field label="Trade ID" value={trade.id} mono /><Field label="Account ID" value={trade.accountId} mono /><Field label="Created" value={dateTime(trade.createdAt)} /><Field label="Last updated" value={dateTime(trade.updatedAt)} /></div>
                </DetailSection>
              </div>
            </div>
          </div>
          <footer className="flex justify-end border-t border-border/70 bg-card/80 px-5 py-3 sm:px-7">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Done</Button>
          </footer>
        </div>
        {preview && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" onClick={() => setPreview(null)} role="presentation"><button type="button" onClick={() => setPreview(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white" aria-label="Close image preview"><X size={18} /></button><div className="relative h-[88dvh] w-[94vw]"><Image src={preview} alt="Enlarged trade chart capture" fill sizes="94vw" unoptimized className="rounded-xl object-contain shadow-2xl" /></div></div>}
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail?: string; tone?: "positive" | "negative" | "neutral" }) {
  return <div className="min-w-0"><div className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{label}</div><div className={`mt-1 truncate text-lg font-bold tabular-nums tracking-tight ${tone === "positive" ? "text-emerald-500" : tone === "negative" ? "text-rose-500" : "text-foreground"}`}>{value}</div>{detail && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{detail}</div>}</div>;
}
function DetailSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>{action}</div><div className="rounded-2xl border border-border/70 bg-background/35 p-4 sm:p-5">{children}</div></section>;
}
function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="min-w-0"><div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{label}</div><div className={`mt-1 truncate text-xs font-medium text-foreground/90 ${mono ? "font-mono" : "tabular-nums"}`} title={value}>{value}</div></div>;
}
function ReviewText({ title, value }: { title: string; value?: string | null }) {
  return value ? <div className="mt-4"><h4 className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">{title}</h4><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{value}</p></div> : null;
}
function emotionLabel(value: string | null | undefined) {
  if (!value) return "—";
  const emoji: Record<string, string> = { Calm: "😌", Confident: "😎", Focused: "🎯", Patient: "🧘", Anxious: "😰", Fearful: "😨", Greedy: "🤑", Frustrated: "😤", Revenge: "😡", Relieved: "😮‍💨", Excited: "🤩" };
  return `${emoji[value] || ""} ${value}`.trim();
}
function duration(start: string, end: string) {
  const minutes = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainder = minutes % 60;
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}
