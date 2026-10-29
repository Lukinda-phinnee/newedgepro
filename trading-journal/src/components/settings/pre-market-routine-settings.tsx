"use client";

import { useEffect, useState } from "react";
import { BarChart3, ChartNoAxesCombined, Check, GripVertical, Info, Leaf, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

type RoutineStep = { id: string; icon: "calendar" | "plan" | "meditation" | "charts" | "custom"; title: string; action: "news" | "edge" | "sanctuary" | "trading" | "none" };
type Routine = { enabled: boolean; showOnAllPages: boolean; startSessionPrompt: boolean; autoHideOnComplete: boolean; resetTime: string; steps: RoutineStep[] };
const defaultRoutine: Routine = { enabled: true, showOnAllPages: true, startSessionPrompt: true, autoHideOnComplete: true, resetTime: "00:00", steps: [
  { id: "calendar", icon: "calendar", title: "Review Economic Calendar", action: "news" }, { id: "plan", icon: "plan", title: "Review Trade Plan", action: "edge" }, { id: "meditation", icon: "meditation", title: "10 Min Meditation", action: "sanctuary" }, { id: "charts", icon: "charts", title: "Analyze Charts", action: "trading" },
] };
const actions = [{ value: "news", label: "Go to News" }, { value: "edge", label: "Go to Edge" }, { value: "sanctuary", label: "Go to Sanctuary" }, { value: "trading", label: "Go to Trading Platform" }, { value: "none", label: "No action" }] as const;
const iconMap = { calendar: BarChart3, plan: Pencil, meditation: Leaf, charts: ChartNoAxesCombined, custom: Check };

export function PreMarketRoutineSettings() {
  const [saved, setSaved] = useState<Routine>(defaultRoutine);
  const [draft, setDraft] = useState<Routine>(defaultRoutine);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const { showFeedback } = useOperationFeedback();
  useEffect(() => { let active = true; fetch("/api/profile", { cache: "no-store" }).then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error); if (active && data.preMarketRoutine) { const value = data.preMarketRoutine as Routine; setSaved(value); setDraft(value); } }).catch((e: unknown) => { if (active) showFeedback({ kind: "failure", title: "Routine couldn’t load", description: e instanceof Error ? e.message : "Please refresh and try again." }); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [showFeedback]);
  const changed = JSON.stringify(saved) !== JSON.stringify(draft);
  const patch = (changes: Partial<Routine>) => setDraft((current) => ({ ...current, ...changes }));
  const save = async () => { setSaving(true); try { const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preMarketRoutine: draft }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Couldn’t save your routine."); setSaved(draft); showFeedback({ kind: "success", title: "Routine saved", description: "Your pre-market routine has been updated." }); } catch (e) { showFeedback({ kind: "failure", title: "Routine wasn’t saved", description: e instanceof Error ? e.message : "Please try again." }); } finally { setSaving(false); } };
  const reorder = (target: string) => { if (!dragging || dragging === target) return; const rows = [...draft.steps]; const from = rows.findIndex((s) => s.id === dragging); const to = rows.findIndex((s) => s.id === target); const [step] = rows.splice(from, 1); rows.splice(to, 0, step); patch({ steps: rows }); setDragging(null); };
  const addStep = () => { if (draft.steps.length >= 6) return; const id = `step-${Date.now()}`; patch({ steps: [...draft.steps, { id, icon: "custom", title: "New routine step", action: "none" }] }); };

  return <section role="tabpanel" aria-label="Pre-Market Routine settings" className="max-w-[1000px] pt-6">
    <h2 className="text-base font-medium text-foreground">Pre-Market Routine</h2>
    <p className="mt-2 text-sm text-foreground">This checklist shows up before you trade and stays pinned across EdgeFlo until you complete it. Build your flow once, then run it daily.</p>
    <a href="https://www.youtube.com/results?search_query=Brad+pre-market+routine+EdgeFlo" target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-violet-500 hover:underline">Need help building your routine? Watch Brad&apos;s walkthrough.</a>
    <div className="mt-4 grid max-w-[600px] gap-x-6 gap-y-3 sm:grid-cols-2">
      {([ ["enabled", "Enable Pre-Market Banner", "Show the routine banner before you trade."], ["startSessionPrompt", "Enable start session prompt", "Prompt you to complete the routine when a session starts."], ["showOnAllPages", "Show banner on all pages", "Keep the checklist visible while navigating EdgeFlo."], ["autoHideOnComplete", "Auto-hide after completion", "Hide the banner when every step is complete."] ] as const).map(([key, label, help]) => <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-foreground"><button type="button" role="switch" aria-checked={draft[key]} aria-label={label} disabled={loading} onClick={() => patch({ [key]: !draft[key] })} className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${draft[key] ? "bg-violet-500" : "bg-muted"}`}><span className={`pointer-events-none block size-3.5 rounded-full bg-white shadow-sm transition-[margin] duration-150 ${draft[key] ? "ml-3.5" : "ml-0"}`}/></button><span>{label}</span><span title={help} className="text-muted-foreground"><Info size={13}/></span></label>)}
    </div>
    <label className="mt-4 block w-[250px] space-y-1 text-xs text-muted-foreground">Daily reset time (Europe/Paris)<Input type="time" aria-label="Daily reset time (Europe/Paris)" value={draft.resetTime} disabled={loading} onChange={(e) => patch({ resetTime: e.target.value })} className="h-9 px-2.5 text-sm"/></label>
    <div className="mt-6 flex max-w-[986px] items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Customize and reorder your routine.</p><Button size="sm" variant="outline" disabled={!changed || saving} onClick={() => patch({ steps: defaultRoutine.steps, enabled: true, showOnAllPages: true, startSessionPrompt: true, autoHideOnComplete: true, resetTime: "00:00" })}>Reset to default</Button></div>
    <div className="mt-3 max-w-[986px]">
      <div className="grid grid-cols-[20px_36px_minmax(160px,1fr)_minmax(140px,198px)_36px] items-center gap-2 border-b border-border/70 px-1 pb-2 text-xs text-muted-foreground"><span/><span>Icon</span><span>Step</span><span>Action</span><span/></div>
      <div className="space-y-1.5 pt-2">{draft.steps.map((step) => { const Icon = iconMap[step.icon]; return <div key={step.id} onDragOver={(e) => { e.preventDefault(); }} onDrop={() => reorder(step.id)} className="grid grid-cols-[20px_36px_minmax(160px,1fr)_minmax(140px,198px)_36px] items-center gap-2">
        <button type="button" draggable onDragStart={() => setDragging(step.id)} onDragEnd={() => setDragging(null)} aria-label={`Reorder ${step.title}`} className="cursor-grab text-muted-foreground active:cursor-grabbing"><GripVertical size={16}/></button>
        <span className={`flex size-8 items-center justify-center rounded-full ${step.icon === "calendar" ? "bg-blue-500/10 text-blue-500" : step.icon === "plan" ? "bg-red-500/10 text-red-500" : step.icon === "meditation" ? "bg-emerald-500/10 text-emerald-500" : "bg-violet-500/10 text-violet-500"}`}><Icon size={16}/></span>
        <Input aria-label="Routine step" maxLength={80} value={step.title} onChange={(e) => patch({ steps: draft.steps.map((s) => s.id === step.id ? { ...s, title: e.target.value } : s) })} className="h-9 min-w-0 text-sm"/>
        <select aria-label="Step action" value={step.action} onChange={(e) => patch({ steps: draft.steps.map((s) => s.id === step.id ? { ...s, action: e.target.value as RoutineStep["action"] } : s) })} className="h-9 min-w-0 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{actions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select>
        <Button size="icon" variant="outline" aria-label={`Delete ${step.title}`} disabled={draft.steps.length <= 1} onClick={() => patch({ steps: draft.steps.filter((s) => s.id !== step.id) })} className="size-8"><Trash2 size={14}/></Button>
      </div>; })}</div>
      <Button variant="outline" size="sm" disabled={draft.steps.length >= 6} onClick={addStep} className="mt-4"><Plus size={14}/>Add step ({draft.steps.length} / 6 used)</Button>
    </div>
    <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" disabled={!changed || saving} onClick={() => setDraft(saved)}>Cancel</Button><Button size="sm" disabled={!changed || saving || loading || draft.steps.some((step) => !step.title.trim())} onClick={save}>{saving ? "Saving…" : "Save changes"}</Button></div>
  </section>;
}
