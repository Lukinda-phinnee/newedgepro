"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, ImagePlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PropfirmChallengeDashboard } from "@/components/propfirm-tracker/propfirm-challenge-dashboard";
import { PropfirmCard } from "@/components/propfirm-tracker/propfirm-card";
import type { PropfirmRecord } from "@/types/propfirm-tracker";

type PhaseRules = PropfirmRecord["phases"][number];
const EVALUATION_TYPES = ["1-phase", "2-phase", "3-phase", "Instant funding", "Custom"];

function createPhase(name: string): PhaseRules {
  return { name, profitTarget: "", dailyLossLimit: "", maxDrawdown: "", drawdownType: "not-set", riskPerTrade: "", maxOpenRisk: "", minTradingDays: "", maxTradesPerDay: "", consistencyLimit: "", newsTrading: "not-set", overnightHolding: false, weekendHolding: false };
}

function phasesForType(type: string): PhaseRules[] {
  if (type === "Instant funding") return [createPhase("Funded")];
  if (type === "1-phase") return [createPhase("Phase 1")];
  if (type === "3-phase") return [createPhase("Phase 1"), createPhase("Phase 2"), createPhase("Phase 3")];
  if (type === "Custom") return [createPhase("Phase 1")];
  return [createPhase("Phase 1"), createPhase("Phase 2")];
}

export default function PropfirmTrackerPage() {
  const [firms, setFirms] = useState<PropfirmRecord[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [evaluation, setEvaluation] = useState("2-phase");
  const [phases, setPhases] = useState<PhaseRules[]>(() => phasesForType("2-phase"));
  const [logo, setLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/propfirms", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "We couldn’t load your prop firms.");
        setFirms(data.firms as PropfirmRecord[]);
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setPageError(error instanceof Error ? error.message : "We couldn’t load your prop firms."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const handleLogoChange = (file?: File) => {
    setLogoError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setLogoError("Choose a PNG, JPG, or WebP image."); return; }
    if (file.size > 2 * 1024 * 1024) { setLogoError("Logo must be smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setLogo(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setFormError("");
    try {
      const response = await fetch("/api/propfirms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), evaluation, phases, logo }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We couldn’t add that prop firm.");
      setFirms((current) => [...current, data.firm as PropfirmRecord]);
      setSelectedFirmId(data.firm.id as string);
      setName(""); setEvaluation("2-phase"); setPhases(phasesForType("2-phase")); setLogo(null);
      setAddDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We couldn’t add that prop firm.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id); setPageError("");
    try {
      const response = await fetch(`/api/propfirms/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We couldn’t remove that prop firm.");
      setFirms((current) => current.filter((firm) => firm.id !== id));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "We couldn’t remove that prop firm.");
    } finally { setDeletingId(null); }
  };

  return (
    <main className="w-full space-y-7 [&_*]:!font-normal" aria-label="Propfirm tracker">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-normal tracking-tight text-foreground sm:text-3xl">Propfirm tracker</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 size={15} className="text-violet-300" />{firms.length} {firms.length === 1 ? "firm" : "firms"} tracked</div>
          <Button type="button" onClick={() => setAddDialogOpen(true)} className="h-9 gap-1.5 bg-violet-600 px-4 text-xs font-normal text-white shadow-sm hover:bg-violet-500"><Plus size={15} />Add prop firm</Button>
        </div>
      </header>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0 [&_*]:!font-normal">
          <div className="flex items-start justify-between border-b border-border/70 p-5 sm:p-7">
            <div><DialogTitle>Add a prop firm</DialogTitle><DialogDescription className="mt-1">Enter the evaluation setup and rules you want to track.</DialogDescription></div>
            <button type="button" aria-label="Close dialog" onClick={() => setAddDialogOpen(false)} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-x-6 gap-y-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
          <div className="space-y-2"><Label htmlFor="propfirm-name">Prop firm name</Label><Input id="propfirm-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Apex Trader Funding" maxLength={80} required /></div>
          <div className="space-y-2"><Label htmlFor="evaluation-type">Evaluation type</Label><select id="evaluation-type" value={evaluation} onChange={(event) => { setEvaluation(event.target.value); setPhases(phasesForType(event.target.value)); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{EVALUATION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
          <div className="space-y-2 lg:row-span-2">
            <Label htmlFor="propfirm-logo">Firm logo <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <input ref={fileInputRef} id="propfirm-logo" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => handleLogoChange(event.target.files?.[0])} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-[126px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/50 px-4 text-center text-sm text-muted-foreground transition hover:border-violet-400/50 hover:bg-violet-500/[0.04]">
              {logo ? <><img src={logo} alt="Prop firm logo preview" className="size-14 rounded-lg object-contain" /><span className="text-xs">Change logo</span></> : <><ImagePlus size={22} className="text-violet-300" /><span>Upload logo</span><span className="text-xs">Image up to 2 MB</span></>}
            </button>
            {logoError && <p className="text-xs text-destructive">{logoError}</p>}
          </div>
          <div className="space-y-3 lg:col-span-3">
            <div className="flex flex-col gap-3 rounded-xl border border-violet-400/15 bg-violet-500/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div><p className="text-sm font-normal text-foreground">Evaluation phases &amp; risk rules</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Set each firm limit by phase. Blank limits are simply left untracked.</p></div>
              {evaluation === "Custom" && <Button type="button" variant="outline" size="sm" onClick={() => setPhases([...phases, createPhase(`Phase ${phases.length + 1}`)])}><Plus />Add phase</Button>}
            </div>
            <div className="space-y-4">{phases.map((phase, index) => {
              const updatePhase = (values: Partial<PhaseRules>) => setPhases(phases.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
              const numberField = (key: "profitTarget" | "dailyLossLimit" | "maxDrawdown" | "riskPerTrade" | "maxOpenRisk" | "minTradingDays" | "maxTradesPerDay" | "consistencyLimit", label: string, unit?: string) => <div className="space-y-1.5" key={key}>
                <Label htmlFor={`${key}-${index}`} className="text-xs font-normal">{label}</Label>
                <div className="relative"><Input id={`${key}-${index}`} type="number" min="0" step="any" value={phase[key]} onChange={(e) => updatePhase({ [key]: e.target.value } as Partial<PhaseRules>)} placeholder="Not set" className={unit ? "pr-9" : ""} />{unit && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">{unit}</span>}</div>
              </div>;
              const selectField = (id: string, label: string, value: string, options: [string, string][], onChange: (value: string) => void) => <div className="space-y-1.5" key={id}>
                <Label htmlFor={`${id}-${index}`} className="text-xs font-normal">{label}</Label>
                <select id={`${id}-${index}`} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select>
              </div>;
              return <fieldset key={index} className="border-t border-border/70 pt-5 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-normal text-violet-300">{String(index + 1).padStart(2, "0")}</span>{evaluation === "Custom" ? <Input aria-label="Phase name" value={phase.name} onChange={(e) => updatePhase({ name: e.target.value })} maxLength={40} className="h-9 max-w-56 font-normal" /> : <div><p className="text-sm font-normal text-foreground">{phase.name}</p><p className="text-[11px] text-muted-foreground">Configure this stage’s limits</p></div>}</div>
                  {evaluation === "Custom" && phases.length > 1 && <button type="button" onClick={() => setPhases(phases.filter((_, i) => i !== index))} className="rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">Remove</button>}
                </div>
                <div className="space-y-5 pt-4">
                  <section><div className="mb-3"><p className="text-xs font-normal uppercase tracking-[0.12em] text-muted-foreground">Targets &amp; loss limits</p><p className="mt-1 text-[11px] text-muted-foreground/80">The firm’s pass target and account loss boundaries.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {numberField("profitTarget", "Profit target", "%")}
                    {numberField("dailyLossLimit", "Daily loss limit", "%")}
                    {numberField("maxDrawdown", "Maximum drawdown", "%")}
                    {selectField("drawdown", "Drawdown calculation", phase.drawdownType, [["not-set", "Not set"], ["static", "Static"], ["trailing", "Trailing"], ["end-of-day", "End-of-day trailing"]], (value) => updatePhase({ drawdownType: value }))}
                  </div></section>
                  <section className="border-t border-border/60 pt-5"><div className="mb-3"><p className="text-xs font-normal uppercase tracking-[0.12em] text-muted-foreground">Position &amp; consistency</p><p className="mt-1 text-[11px] text-muted-foreground/80">Define your own exposure limits within the firm’s rules.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {numberField("riskPerTrade", "Risk per trade", "%")}
                    {numberField("maxOpenRisk", "Total open risk", "%")}
                    {numberField("maxTradesPerDay", "Trades per day", "trades")}
                    {numberField("consistencyLimit", "Consistency limit", "%")}
                    {numberField("minTradingDays", "Minimum trading days", "days")}
                  </div></section>
                  <section className="border-t border-border/60 pt-5"><div className="mb-3"><p className="text-xs font-normal uppercase tracking-[0.12em] text-muted-foreground">Trading conditions</p><p className="mt-1 text-[11px] text-muted-foreground/80">Note restrictions that affect when positions may be held.</p></div><div className="grid gap-4 sm:grid-cols-2">
                    {selectField("news", "News trading", phase.newsTrading, [["not-set", "Not set"], ["allowed", "Allowed"], ["restricted", "Restricted around news"], ["prohibited", "Prohibited"]], (value) => updatePhase({ newsTrading: value }))}
                    <div className="grid gap-2 sm:grid-cols-2 sm:items-end"><label className="flex min-h-10 items-center gap-2.5 rounded-lg border border-border/70 bg-background/60 px-3 text-xs text-foreground"><input type="checkbox" checked={phase.overnightHolding} onChange={(e) => updatePhase({ overnightHolding: e.target.checked })} className="size-4 accent-violet-500" />Overnight positions allowed</label><label className="flex min-h-10 items-center gap-2.5 rounded-lg border border-border/70 bg-background/60 px-3 text-xs text-foreground"><input type="checkbox" checked={phase.weekendHolding} onChange={(e) => updatePhase({ weekendHolding: e.target.checked })} className="size-4 accent-violet-500" />Weekend positions allowed</label></div>
                  </div></section>
                </div>
              </fieldset>;
            })}</div>
          </div>
          {formError && <p className="text-sm text-destructive lg:col-span-3">{formError}</p>}
          <div className="flex items-end gap-2 lg:col-span-3 lg:justify-end"><Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={saving} className="w-full gap-2 sm:w-auto"><Plus size={16} />{saving ? "Saving…" : "Add prop firm"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {pageError && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{pageError}</p>}
      {loading ? (
        <section aria-label="Loading prop firms" className="flex min-h-48 items-center justify-center rounded-2xl border border-border/70 bg-card/40 text-sm text-muted-foreground">
          Loading prop firms…
        </section>
      ) : selectedFirmId && firms.some((firm) => firm.id === selectedFirmId) ? (
        <PropfirmChallengeDashboard key={selectedFirmId} firm={firms.find((firm) => firm.id === selectedFirmId)!} onBack={() => setSelectedFirmId(null)} />
      ) : firms.length > 0 ? (
        <section aria-label="Tracked prop firms" className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {firms.map((firm) => (
            <PropfirmCard
              key={firm.id}
              firm={firm}
              onOpen={setSelectedFirmId}
              onDelete={handleDelete}
              isDeleting={deletingId === firm.id}
            />
          ))}
        </section>
      ) : (
        <section className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
            <Building2 size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">No prop firms added yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Track evaluation phases, drawdown limits, profit targets, and challenge rules in one place.
          </p>
          <Button
            type="button"
            onClick={() => setAddDialogOpen(true)}
            className="mt-4 h-9 gap-1.5 bg-violet-600 px-4 text-xs font-normal text-white shadow-sm hover:bg-violet-500"
          >
            <Plus size={15} />
            Add your first firm
          </Button>
        </section>
      )}
    </main>
  );
}
