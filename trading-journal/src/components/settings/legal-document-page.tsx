"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type LegalDocument = { slug: string; title: string; body: string; updatedAt: string };

function inlineContent(line: string, lineKey: string): ReactNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return parts.map((part, index) => {
    const key = `${lineKey}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={key} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={key}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={key} href={link[2]} target={link[2].startsWith("http") ? "_blank" : undefined} rel={link[2].startsWith("http") ? "noreferrer" : undefined} className="text-primary underline underline-offset-4">{link[1]}</a>;
    return part;
  });
}

function renderPolicy(body: string) {
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: Array<{ text: string; ordered: boolean }> = [];
  const flushParagraph = () => {
    if (paragraph.length) { const text = paragraph.join(" "); blocks.push(<p key={`p-${blocks.length}`} className="my-4 leading-7 text-foreground/85">{inlineContent(text, `p-${blocks.length}`)}</p>); paragraph = []; }
  };
  const flushList = () => {
    if (listItems.length) {
      const ordered = listItems[0].ordered;
      const items = listItems;
      const List = ordered ? "ol" : "ul";
      blocks.push(<List key={`list-${blocks.length}`} className={`${ordered ? "list-decimal" : "list-disc"} my-3 space-y-2 pl-6 leading-7 text-foreground/85`}>{items.map((item, index) => <li key={`li-${index}`}>{inlineContent(item.text, `li-${blocks.length}-${index}`)}</li>)}</List>);
      listItems = [];
    }
  };

  for (const [index, rawLine] of body.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line === "---") { flushParagraph(); flushList(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const text = heading[2];
      if (heading[1].length === 1) blocks.push(<h1 key={`h-${index}`} className="mb-5 mt-1 text-2xl font-semibold tracking-tight text-foreground">{inlineContent(text, `h-${index}`)}</h1>);
      else if (heading[1].length === 2) blocks.push(<h2 key={`h-${index}`} className="mb-2 mt-8 border-b border-border/60 pb-2 text-lg font-semibold text-foreground">{inlineContent(text, `h-${index}`)}</h2>);
      else blocks.push(<h3 key={`h-${index}`} className="mb-2 mt-5 text-base font-semibold text-foreground">{inlineContent(text, `h-${index}`)}</h3>);
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (listItems.length && listItems[0].ordered !== ordered) flushList();
      listItems.push({ text: (bullet || numbered)![1], ordered });
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph(); flushList();
  return blocks;
}

export function LegalDocumentPage({ slug }: { slug: string }) {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    fetch(`/api/legal-documents?slug=${encodeURIComponent(slug)}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn’t load this policy.");
      setDocument(result as LegalDocument);
    }).catch((cause: unknown) => {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Couldn’t load this policy.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug, attempt]);

  const blocks = useMemo(() => document ? renderPolicy(document.body) : [], [document]);
  return <main className="min-h-dvh bg-background px-4 py-8 text-foreground sm:px-8 sm:py-12">
    <article className="mx-auto max-w-3xl">
      <Link href="/settings" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft size={15}/>Back to settings</Link>
      {loading ? <div role="status" className="rounded-xl border border-border/70 bg-card/40 p-5 text-sm text-muted-foreground">Loading policy…</div> : error ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/[0.04] p-4"><p role="alert" className="text-sm text-foreground">{error}</p><Button size="sm" variant="outline" onClick={() => setAttempt((current) => current + 1)}><RefreshCw size={14}/>Try again</Button></div> : document ? <>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-5"><div><p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">Legal</p><h1 className="text-2xl font-semibold tracking-tight">{document.title}</h1></div><a href="/settings" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ExternalLink size={13}/>Settings</a></header>
        <div className="rounded-xl border border-border/70 bg-card/30 px-5 py-5 sm:px-8 sm:py-7">{blocks}</div>
      </> : null}
    </article>
  </main>;
}
