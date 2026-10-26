import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicNoteDocument } from "@/lib/db/notes";

type Props = { params: Promise<{ shareToken: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareToken } = await params;
  const note = await getPublicNoteDocument(shareToken);
  return { title: note ? `${note.title} — Shared Trader Note` : "Shared Trader Note" };
}

export default async function SharedNotePage({ params }: Props) {
  const { shareToken } = await params;
  const note = await getPublicNoteDocument(shareToken);
  if (!note) notFound();
  return <main className="min-h-dvh bg-background px-5 py-12 text-foreground sm:px-8"><article className="mx-auto max-w-3xl"><div className="mb-8 flex items-center gap-3 text-xs text-muted-foreground"><span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-lg">{String(note.emoji || "📄")}</span><span>Shared Trader Note</span></div><h1 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">{String(note.title)}</h1><p className="mb-8 border-b border-border/70 pb-5 text-xs text-muted-foreground">Updated {new Date(String(note.updatedAt)).toLocaleDateString()}</p>{note.coverImageUrl && <div role="img" aria-label="Document cover" className="mb-8 h-64 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url("${String(note.coverImageUrl)}")` }}/>}<pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-foreground/90">{String(note.content || "")}</pre><div className="mt-14 border-t border-border/70 pt-5 text-xs text-muted-foreground">Shared from EdgePro Trader Notes</div></article></main>;
}
