"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Info, Mail, RefreshCw, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type AppInformation = {
  name: string;
  description: string;
  version: string;
  environment: string;
  supportEmail: string | null;
  websiteUrl: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
  updatedAt: string;
  legalDocuments: Array<{ slug: string; title: string }>;
};

export function AboutSettings() {
  const [information, setInformation] = useState<AppInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const loadInformation = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/app-information", { cache: "no-store", signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn’t load app information.");
      setInformation(result as AppInformation);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Couldn’t load app information.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadInformation(controller.signal);
    return () => controller.abort();
  }, [attempt, loadInformation]);

  return <section role="tabpanel" aria-label="About EdgePro" className="max-w-[900px] pt-6">
    <div className="mb-5">
      <h2 className="text-base font-medium text-foreground">About</h2>
      <p className="mt-1 text-sm text-muted-foreground">Product information and resources.</p>
    </div>

    {loading ? <div role="status" className="rounded-xl border border-border/70 bg-card/40 p-5 text-sm text-muted-foreground">Loading app information…</div> : error ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/[0.04] p-4">
      <p role="alert" className="text-sm text-foreground">{error}</p>
      <Button size="sm" variant="outline" onClick={() => setAttempt((current) => current + 1)}><RefreshCw size={14}/>Try again</Button>
    </div> : information ? <div className="space-y-5">
      <section aria-labelledby="about-app-info-heading">
      <h3 id="about-app-info-heading" className="mb-2 text-sm font-medium text-foreground">App Info</h3>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
      <div className="flex flex-wrap items-center gap-4 border-b border-border/60 p-5 sm:p-6">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles size={22}/></div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{information.name}</h3>
          {information.description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{information.description}</p>}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"><Info size={13}/>Version {information.version} · {information.environment}</span>
      </div>

      </div>
      </section>

      {information.legalDocuments.length > 0 && <section aria-labelledby="about-legal-heading">
        <h3 id="about-legal-heading" className="mb-2 text-sm font-medium text-foreground">Legal</h3>
        <div className="overflow-hidden rounded-xl border border-border/70"><div className="grid gap-px bg-border/50 sm:grid-cols-2">
        {information.legalDocuments.map((document) => <Link key={document.slug} href={`/legal/${document.slug}`} className="flex min-h-14 items-center gap-3 bg-card/70 px-5 py-3 text-sm text-foreground transition-colors hover:bg-accent/60"><Shield size={16} className="text-muted-foreground"/><span className="min-w-0 flex-1">{document.title}</span><ExternalLink size={13} className="text-muted-foreground"/></Link>)}
        </div></div>
      </section>}
      {(information.supportEmail || information.websiteUrl) && <section aria-label="Contact and website" className="overflow-hidden rounded-xl border border-border/70"><div className="grid gap-px bg-border/50 sm:grid-cols-2">
        {information.supportEmail && <a href={`mailto:${information.supportEmail}`} className="flex min-h-14 items-center gap-3 bg-card/70 px-5 py-3 text-sm text-foreground transition-colors hover:bg-accent/60"><Mail size={16} className="text-muted-foreground"/><span className="min-w-0 flex-1">Support</span><span className="truncate text-muted-foreground">{information.supportEmail}</span></a>}
        {information.websiteUrl && <a href={information.websiteUrl} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 bg-card/70 px-5 py-3 text-sm text-foreground transition-colors hover:bg-accent/60"><ExternalLink size={16} className="text-muted-foreground"/><span className="min-w-0 flex-1">Website</span><span className="text-muted-foreground">Open</span></a>}
      </div></section>}
    </div> : null}
  </section>;
}
