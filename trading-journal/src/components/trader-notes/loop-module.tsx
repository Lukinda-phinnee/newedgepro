"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronLeft, Copy, ImagePlus, LayoutGrid, List, MessageSquare, MoreHorizontal, Plus, Search, Share2, Trash2, X } from "lucide-react";
import { LoopRichTextEditor } from "@/components/trader-notes/loop-rich-text-editor";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

export type LoopDocument = {
  id: string;
  title: string;
  content: string;
  emoji: string | null;
  coverImageUrl: string | null;
  shareToken: string | null;
  updatedAt: string;
};
export type LoopWorkspace = {
  id: string;
  title: string;
  emoji: string | null;
  coverImageUrl: string | null;
  documents: LoopDocument[];
};
type LoopComment = { id: string; authorName: string; body: string; createdAt: string };
const noteTemplates = [
  { title: "Trade plan", emoji: "🎯", content: "# Trade Plan\n\n## Market context\n- Instrument:\n- Session:\n- Directional bias:\n\n## Setup checklist\n- [ ] Higher timeframe context\n- [ ] Entry trigger\n- [ ] Risk defined\n\n## Entry and management\n- Entry:\n- Stop loss:\n- Target:\n- Invalidation:\n" },
  { title: "Pre-market preparation", emoji: "🌅", content: "# Pre-market Preparation\n\n## Key levels\n- Previous day high / low:\n- Overnight high / low:\n- Important zones:\n\n## Events and conditions\n- News to watch:\n- Market regime:\n- Instruments in focus:\n\n## Scenarios\n1. If price…\n2. If price…\n" },
  { title: "Weekly trading review", emoji: "📊", content: "# Weekly Trading Review\n\n## Week summary\n- Trades taken:\n- Net result:\n- Rule adherence:\n\n## Best decisions\n- \n\n## Patterns to correct\n- \n\n## Lessons learned\n- \n" },
  { title: "Strategy research", emoji: "🔍", content: "# Strategy Research\n\n## Hypothesis\n\n## Setup definition\n- Market conditions:\n- Entry criteria:\n- Stop placement:\n- Exit criteria:\n\n## Sample and results\n- Sample size:\n- Win rate:\n- Average R:\n\n## Conclusion\n" },
  { title: "Trading checklist", emoji: "✅", content: "# Trading Checklist\n\n## Before entry\n- [ ] Setup matches my plan\n- [ ] Session and context confirmed\n- [ ] Stop and target are defined\n- [ ] Position size is within risk limits\n- [ ] I am calm and focused\n\n## After exit\n- [ ] Record the trade\n- [ ] Capture a screenshot\n- [ ] Write one lesson\n" },
];
type LoopContextValue = {
  workspaces: LoopWorkspace[];
  loading: boolean;
  error: string;
  setError: (value: string) => void;
  refresh: () => Promise<void>;
  createWorkspace: (title: string, emoji?: string | null, coverImageUrl?: string | null) => Promise<LoopWorkspace>;
  updateWorkspace: (workspace: LoopWorkspace, data: Partial<Pick<LoopWorkspace, "title" | "emoji" | "coverImageUrl">>) => Promise<void>;
  deleteWorkspace: (workspace: LoopWorkspace) => Promise<void>;
  createDocument: (workspace: LoopWorkspace, title?: string) => Promise<LoopDocument>;
  updateDocument: (documentId: string, data: Partial<LoopDocument>) => Promise<void>;
  deleteDocument: (document: LoopDocument) => Promise<void>;
  duplicateDocument: (workspace: LoopWorkspace, document: LoopDocument) => Promise<LoopDocument>;
  workspaceHeader: React.ReactNode | null;
  setWorkspaceHeader: (header: React.ReactNode | null) => void;
};
const LoopContext = createContext<LoopContextValue | null>(null);

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function LoopModuleProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<LoopWorkspace[]>([]);
  const [workspaceHeader, setWorkspaceHeader] = useState<React.ReactNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const { workspaces: rows } = await requestJson<{ workspaces: LoopWorkspace[] }>("/api/notes");
    setWorkspaces(rows);
  }, []);

  useEffect(() => {
    let active = true;
    requestJson<{ workspaces: LoopWorkspace[] }>("/api/notes")
      .then(({ workspaces: rows }) => { if (active) setWorkspaces(rows); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load workspaces"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const createWorkspace = useCallback(async (title: string, emoji: string | null = null, coverImageUrl: string | null = null) => {
    const { workspace } = await requestJson<{ workspace: LoopWorkspace }>("/api/notes", { method: "POST", body: JSON.stringify({ title, emoji, coverImageUrl }) });
    setWorkspaces((rows) => [workspace, ...rows]);
    return workspace;
  }, []);
  const updateWorkspace = useCallback(async (workspace: LoopWorkspace, data: Partial<Pick<LoopWorkspace, "title" | "emoji" | "coverImageUrl">>) => {
    const { workspace: updated } = await requestJson<{ workspace: LoopWorkspace }>(`/api/notes/${workspace.id}`, { method: "PATCH", body: JSON.stringify(data) });
    setWorkspaces((rows) => rows.map((row) => row.id === workspace.id ? { ...row, ...updated } : row));
  }, []);
  const deleteWorkspace = useCallback(async (workspace: LoopWorkspace) => {
    await requestJson(`/api/notes/${workspace.id}`, { method: "DELETE" });
    setWorkspaces((rows) => rows.filter((row) => row.id !== workspace.id));
  }, []);
  const createDocument = useCallback(async (workspace: LoopWorkspace, title = "Untitled") => {
    const { document } = await requestJson<{ document: LoopDocument }>(`/api/notes/${workspace.id}/documents`, { method: "POST", body: JSON.stringify({ title, coverImageUrl: workspace.coverImageUrl }) });
    setWorkspaces((rows) => rows.map((row) => row.id === workspace.id ? { ...row, documents: [document, ...row.documents] } : row));
    return document;
  }, []);
  const updateDocument = useCallback(async (documentId: string, data: Partial<LoopDocument>) => {
    const { document: updated } = await requestJson<{ document: LoopDocument }>(`/api/notes/documents/${documentId}`, { method: "PATCH", body: JSON.stringify(data) });
    setWorkspaces((rows) => rows.map((row) => ({ ...row, documents: row.documents.map((item) => item.id === documentId ? { ...item, ...updated } : item) })));
  }, []);
  const deleteDocument = useCallback(async (document: LoopDocument) => {
    await requestJson(`/api/notes/documents/${document.id}`, { method: "DELETE" });
    setWorkspaces((rows) => rows.map((row) => ({ ...row, documents: row.documents.filter((item) => item.id !== document.id) })));
  }, []);
  const duplicateDocument = useCallback(async (workspace: LoopWorkspace, document: LoopDocument) => {
    const { document: copy } = await requestJson<{ document: LoopDocument }>(`/api/notes/${workspace.id}/documents`, { method: "POST", body: JSON.stringify({ title: `${document.title} copy` }) });
    const { document: saved } = await requestJson<{ document: LoopDocument }>(`/api/notes/documents/${copy.id}`, { method: "PATCH", body: JSON.stringify({ content: document.content, emoji: document.emoji, coverImageUrl: document.coverImageUrl }) });
    setWorkspaces((rows) => rows.map((row) => row.id === workspace.id ? { ...row, documents: [saved, ...row.documents] } : row));
    return saved;
  }, []);
  const value = useMemo(() => ({ workspaces, loading, error, setError, refresh, createWorkspace, updateWorkspace, deleteWorkspace, createDocument, updateDocument, deleteDocument, duplicateDocument, workspaceHeader, setWorkspaceHeader }), [workspaces, loading, error, refresh, createWorkspace, updateWorkspace, deleteWorkspace, createDocument, updateDocument, deleteDocument, duplicateDocument, workspaceHeader]);
  return <LoopContext.Provider value={value}><div className="loop-module h-full min-h-0">{children}</div></LoopContext.Provider>;
}

export function useLoopModule() {
  const value = useContext(LoopContext);
  if (!value) throw new Error("useLoopModule must be used inside LoopModuleProvider");
  return value;
}

export function LoopDashboard() {
  const { confirmAction, showFeedback } = useOperationFeedback();
  const { workspaces, loading, error, setError, createWorkspace, deleteWorkspace, updateWorkspace } = useLoopModule();
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("/trader-notes/workspacecover.webp");
  const [busy, setBusy] = useState(false);
  const addWorkspace = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try { const workspace = await createWorkspace(title.trim(), emoji || null, coverImageUrl || null); setCreating(false); setTitle(""); setEmoji(""); router.push(`/trader-notes/workspace/${workspace.id}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to create workspace"); }
    finally { setBusy(false); }
  };
  return <div className="h-full overflow-y-auto bg-white px-5 py-8 text-gray-900 sm:px-8 lg:px-12">
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-medium tracking-tight sm:text-3xl">Workspaces</h2><p className="mt-2 text-sm text-gray-500">Plan, think, and create in one place.</p></div><button onClick={() => setCreating(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700"><Plus size={16}/>New workspace</button></div>
      {error && <div className="mt-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={15}/></button></div>}
      <div className="mt-10 flex items-center justify-between border-b border-gray-200 pb-3"><h3 className="text-lg font-medium">Your workspaces <span className="ml-1 text-sm font-normal text-gray-400">{workspaces.length}</span></h3><div className="flex rounded-full bg-gray-100 p-1"><button aria-label="Grid view" onClick={() => setView("grid")} className={`rounded-full p-2 ${view === "grid" ? "bg-white shadow-sm" : "text-gray-500"}`}><LayoutGrid size={16}/></button><button aria-label="List view" onClick={() => setView("list")} className={`rounded-full p-2 ${view === "list" ? "bg-white shadow-sm" : "text-gray-500"}`}><List size={16}/></button></div></div>
      {loading ? <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map((i) => <div key={i} className="h-56 animate-pulse rounded-xl bg-gray-100"/>)}</div> : workspaces.length ? <div className={view === "grid" ? "mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "mt-3 divide-y divide-gray-200"}>{workspaces.map((workspace) => <div key={workspace.id} className={view === "grid" ? "group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md" : "flex items-center gap-4 py-3"}>
        <button onClick={() => router.push(`/trader-notes/workspace/${workspace.id}`)} className={view === "grid" ? "block w-full text-left" : "flex min-w-0 flex-1 items-center gap-4 text-left"}>
          <div className={view === "grid" ? "relative h-44 bg-gray-100 bg-cover bg-center" : "h-12 w-16 shrink-0 rounded-lg bg-gray-100 bg-cover bg-center"} style={workspace.coverImageUrl ? { backgroundImage: `url("${workspace.coverImageUrl}")` } : undefined}>{view === "grid" && <span className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-2xl shadow">{workspace.emoji || "📁"}</span>}</div>
          <div className={view === "grid" ? "px-4 py-3" : "min-w-0 flex-1"}><div className="truncate font-medium">{view === "list" && <span className="mr-2">{workspace.emoji || "📁"}</span>}{workspace.title}</div><div className="mt-1 text-xs text-gray-500">{workspace.documents.length} documents · Updated {workspace.documents[0]?.updatedAt ? new Date(workspace.documents[0].updatedAt).toLocaleDateString() : "recently"}</div></div>
        </button><div className={view === "grid" ? "flex justify-end gap-1 border-t border-gray-100 px-3 py-2" : "flex gap-1"}><button title="Rename workspace" onClick={() => { const next = window.prompt("Workspace name", workspace.title); if (next?.trim() && next !== workspace.title) void updateWorkspace(workspace, { title: next.trim() }).then(() => showFeedback({ kind: "success", title: "Workspace renamed", description: `“${next.trim()}” is ready.` })).catch((error) => showFeedback({ kind: "failure", title: "Rename failed", description: error instanceof Error ? error.message : "Please try again." })); }} className="rounded p-2 text-gray-500 hover:bg-gray-100"><MoreHorizontal size={16}/></button><button title="Delete workspace" onClick={() => { void confirmAction({ title: "Delete this workspace?", description: `“${workspace.title}” and all its documents will be permanently removed.`, confirmLabel: "Delete workspace" }).then((confirmed) => { if (confirmed) void deleteWorkspace(workspace).then(() => showFeedback({ kind: "success", title: "Workspace deleted", description: `“${workspace.title}” was removed.` })).catch((error) => showFeedback({ kind: "failure", title: "Workspace wasn’t deleted", description: error instanceof Error ? error.message : "Please try again." })); }); }} className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={15}/></button></div>
      </div>)}</div> : <div className="mt-14 flex flex-col items-center text-center"><img src="/trader-notes/workspace.webp" alt="" className="mb-4 h-44 w-56 object-contain"/><h3 className="text-xl font-medium">Create your first workspace</h3><p className="mt-2 max-w-md text-sm text-gray-500">Workspaces let you plan, think, and create together — all in the same place.</p><button onClick={() => setCreating(true)} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm hover:bg-gray-50"><Plus size={16}/>New workspace</button></div>}
    </div>
    {creating && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setCreating(false); }}><form onSubmit={(e) => { e.preventDefault(); void addWorkspace(); }} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="h-44 bg-gray-100 bg-cover bg-center" style={{ backgroundImage: `url('${coverImageUrl}')` }}/><div className="p-7"><h2 className="text-xl font-semibold">Create a new workspace</h2><p className="mt-2 text-sm leading-6 text-gray-500">A space for your trading plans, research, and notes.</p><div className="mt-6 grid grid-cols-[80px_1fr] gap-3"><label className="text-sm font-medium">Emoji<input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} placeholder="📁" className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-xl outline-none focus:border-violet-400"/></label><label className="text-sm font-medium">Workspace name<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My trading workspace" className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-violet-400"/></label></div><label className="mt-4 block text-sm font-medium">Cover image URL<input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://…" className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-400"/></label><div className="mt-7 flex justify-end gap-2"><button type="button" onClick={() => setCreating(false)} className="h-9 rounded-lg border border-gray-200 px-4 text-sm">Cancel</button><button disabled={!title.trim() || busy} className="h-9 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white disabled:opacity-50">{busy ? "Creating…" : "Create workspace"}</button></div></div></form></div>}
  </div>;
}

export function LoopWorkspaceChrome({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspaceId: string; documentId?: string }>();
  const { workspaces, loading, createDocument, workspaceHeader } = useLoopModule();
  const router = useRouter();
  const workspace = workspaces.find((item) => item.id === params.workspaceId);
  const [collapsed, setCollapsed] = useState(false);
  const docs = workspace?.documents ?? [];
  const addDocument = async () => { if (!workspace) return; const doc = await createDocument(workspace); router.push(`/trader-notes/workspace/${workspace.id}/${doc.id}`); };
  return <div className="flex h-full min-h-0 bg-white text-gray-900">
    <aside className={`${collapsed ? "w-0 lg:w-0" : "w-[280px]"} hidden shrink-0 flex-col border-r border-gray-200 bg-[#fafafa] transition-[width] duration-200 md:flex`}>
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-4"><Link href="/trader-notes" className="flex items-center gap-2 font-semibold"><span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-white"><BookOpen size={16}/></span><span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">Trader Notes</span></Link><button onClick={() => setCollapsed(true)} aria-label="Collapse workspace sidebar" className="rounded p-2 text-gray-500 hover:bg-gray-100"><ChevronLeft size={16}/></button></div>
      <div className="flex items-center justify-between px-4 pb-2 pt-5"><div className="min-w-0"><h2 className="truncate text-sm font-medium">{workspace?.title || (loading ? "Loading workspace…" : "Workspace")}</h2><p className="mt-1 text-xs text-gray-500">Personal workspace</p></div><button disabled={!workspace || docs.length >= 10} onClick={() => void addDocument()} aria-label="Create document" className="rounded-lg p-2 text-gray-600 hover:bg-gray-200 disabled:opacity-40"><Plus size={16}/></button></div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2" aria-label="Workspace documents">{docs.map((doc) => <Link key={doc.id} href={`/trader-notes/workspace/${params.workspaceId}/${doc.id}`} className={`group mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${params.documentId === doc.id ? "bg-white text-violet-700 shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}><span className="text-base">{doc.emoji || "📄"}</span><span className="min-w-0 flex-1 truncate">{doc.title || "Untitled"}</span></Link>)}{!loading && docs.length === 0 && <p className="px-3 py-8 text-center text-xs text-gray-500">No documents yet.</p>}</nav>
      <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500">Documents {docs.length} out of 10<div className="mt-2 h-1.5 overflow-hidden rounded bg-gray-200"><div className="h-full rounded bg-violet-500" style={{ width: `${Math.min(100, docs.length * 10)}%` }}/></div></div>
    </aside>
    {collapsed && <button onClick={() => setCollapsed(false)} aria-label="Expand workspace sidebar" className="hidden self-center rounded-r-lg border border-l-0 border-gray-200 bg-white p-2 text-gray-500 shadow-sm md:block"><ChevronLeft className="rotate-180" size={16}/></button>}
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden"><div className="flex h-12 shrink-0 items-center gap-3 border-b border-gray-200 px-4">{params.documentId && workspaceHeader ? workspaceHeader : <><Link href="/trader-notes" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"><ArrowLeft size={14}/>Workspaces</Link><span className="text-gray-300">/</span><span className="truncate text-xs font-medium">{workspace?.title || "Workspace"}</span></>}</div>{children}</section>
  </div>;
}

export function LoopWorkspacePage() {
  const { confirmAction, showFeedback } = useOperationFeedback();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, loading, updateWorkspace, createDocument, deleteDocument, duplicateDocument } = useLoopModule();
  const router = useRouter();
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const [style, setStyle] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  if (loading) return <div className="flex-1 animate-pulse bg-gray-50"/>;
  if (!workspace) return <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Workspace not found.</div>;
  const rename = (title: string) => { if (title.trim() && title !== workspace.title) void updateWorkspace(workspace, { title: title.trim() }); };
  const addDocument = async () => { const doc = await createDocument(workspace); router.push(`/trader-notes/workspace/${workspace.id}/${doc.id}`); };
  const filteredDocuments = workspace.documents.filter((doc) => doc.title.toLowerCase().includes(search.toLowerCase()));
  return <div className="min-h-0 flex-1 overflow-y-auto">
    <div className="group relative h-[30vh] min-h-48 bg-gray-100 bg-cover bg-center" style={workspace.coverImageUrl ? { backgroundImage: `url("${workspace.coverImageUrl}")` } : undefined}><button onClick={() => { const url = window.prompt("Paste a workspace cover image URL", workspace.coverImageUrl || ""); if (url !== null) void updateWorkspace(workspace, { coverImageUrl: url || null }); }} className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-xs opacity-0 shadow transition group-hover:opacity-100"><ImagePlus size={14}/>Update cover</button><button onClick={() => { const emoji = window.prompt("Workspace emoji", workspace.emoji || "📁"); if (emoji !== null) void updateWorkspace(workspace, { emoji: emoji.trim() || null }); }} aria-label="Change workspace emoji" className="absolute -bottom-8 left-[max(1rem,calc((100%-72rem)/2))] flex size-16 items-center justify-center rounded-xl bg-white text-4xl shadow">{workspace.emoji || "📁"}</button></div>
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:px-8"><div className="flex items-center gap-3"><input key={workspace.id} defaultValue={workspace.title} onBlur={(e) => rename(e.target.value)} className="min-w-0 flex-1 bg-transparent text-3xl font-bold outline-none" aria-label="Workspace name"/><button onClick={addDocument} disabled={workspace.documents.length >= 10} className="inline-flex h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"><Plus size={16}/>New document</button></div>
      <div className="mt-12 flex items-center justify-between border-b border-gray-200 pb-3"><div className="flex items-center gap-3"><h2 className="text-lg font-medium">Documents <span className="ml-1 text-sm font-normal text-gray-400">{workspace.documents.length}/10</span></h2><label className="flex h-8 items-center gap-2 rounded-lg border border-gray-200 px-2.5 text-gray-500"><Search size={13}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents" className="w-36 bg-transparent text-xs outline-none"/></label></div><div className="flex rounded-full bg-gray-100 p-1"><button onClick={() => setStyle("grid")} aria-label="Grid view" className={`rounded-full p-2 ${style === "grid" ? "bg-white shadow-sm" : "text-gray-500"}`}><LayoutGrid size={16}/></button><button onClick={() => setStyle("list")} aria-label="List view" className={`rounded-full p-2 ${style === "list" ? "bg-white shadow-sm" : "text-gray-500"}`}><List size={16}/></button></div></div>
      {filteredDocuments.length ? <div className={style === "grid" ? "mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "mt-3 divide-y divide-gray-200"}>{filteredDocuments.map((doc) => <article key={doc.id} className={style === "grid" ? "group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" : "flex items-center gap-4 py-3"}><button onClick={() => router.push(`/trader-notes/workspace/${workspace.id}/${doc.id}`)} className={style === "grid" ? "block w-full text-left" : "flex min-w-0 flex-1 items-center gap-3 text-left"}><div className={style === "grid" ? "h-40 bg-gray-100 bg-cover bg-center" : "flex size-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl"} style={style === "grid" && doc.coverImageUrl ? { backgroundImage: `url("${doc.coverImageUrl}")` } : undefined}>{style === "list" && (doc.emoji || "📄")}</div><div className={style === "grid" ? "px-4 py-3" : "min-w-0 flex-1"}><div className="truncate font-medium">{style === "list" && <span className="mr-2">{doc.emoji || "📄"}</span>}{doc.title}</div><p className="mt-1 line-clamp-2 text-xs text-gray-500">{doc.content?.replace(/[#>*`_\[\]]/g, " ").slice(0, 120) || "Start planning, thinking, and creating."}</p></div></button><div className={style === "grid" ? "flex justify-end gap-1 border-t border-gray-100 px-3 py-2" : "flex gap-1"}><button title="Duplicate document" onClick={() => void duplicateDocument(workspace, doc).then((copy) => { showFeedback({ kind: "success", title: "Document duplicated", description: `“${doc.title}” was copied.` }); router.push(`/trader-notes/workspace/${workspace.id}/${copy.id}`); }).catch((error) => showFeedback({ kind: "failure", title: "Document wasn’t copied", description: error instanceof Error ? error.message : "Please try again." }))} className="rounded p-2 text-gray-500 hover:bg-gray-100"><Copy size={14}/></button><button title="Delete document" onClick={() => { void confirmAction({ title: "Delete this document?", description: `“${doc.title}” will be permanently removed.`, confirmLabel: "Delete document" }).then((confirmed) => { if (confirmed) void deleteDocument(doc).then(() => showFeedback({ kind: "success", title: "Document deleted", description: `“${doc.title}” was removed.` })).catch((error) => showFeedback({ kind: "failure", title: "Document wasn’t deleted", description: error instanceof Error ? error.message : "Please try again." })); }); }} className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={14}/></button></div></article>)}</div> : <div className="flex flex-col items-center py-16 text-center"><img src="/trader-notes/workspace.webp" alt="" className="h-40 w-52 object-contain"/><h3 className="text-xl font-medium">Create a new document</h3><p className="mt-2 text-sm text-gray-500">Plan, brainstorm, and create in one place.</p><button onClick={addDocument} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"><Plus size={15}/>New document</button></div>}
    </div>
  </div>;
}

export function LoopDocumentPage() {
  const { confirmAction, showFeedback } = useOperationFeedback();
  const { workspaceId, documentId } = useParams<{ workspaceId: string; documentId: string }>();
  const { workspaces, loading, updateDocument, deleteDocument, refresh, setError, error, setWorkspaceHeader } = useLoopModule();
  const router = useRouter();
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const document = workspace?.documents.find((item) => item.id === documentId);
  const [content, setContent] = useState(document?.content || "");
  const [title, setTitle] = useState(document?.title || "Untitled");
  const [saveState, setSaveState] = useState("Saved");
  const [comments, setComments] = useState<LoopComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [preview, setPreview] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const remoteUpdatedAt = useRef(document?.updatedAt);
  useEffect(() => { setContent(document?.content || ""); setTitle(document?.title || "Untitled"); }, [documentId, document?.content, document?.title]);
  useEffect(() => { remoteUpdatedAt.current = document?.updatedAt; }, [documentId, document?.updatedAt]);
  useEffect(() => {
    if (!documentId) return;
    const timer = window.setTimeout(() => {
      setSaveState("Saving…");
      void updateDocument(documentId, { title, content }).then(() => setSaveState("Saved")).catch((e) => { setSaveState("Save failed"); showFeedback({ kind: "failure", title: "Document wasn’t saved", description: e instanceof Error ? e.message : "Please try again." }); });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [content, title, documentId, updateDocument, showFeedback]);
  useEffect(() => {
    if (!documentId) return;
    let active = true;
    const refresh = () => {
      void requestJson<{ document: LoopDocument }>(`/api/notes/documents/${documentId}`).then(({ document: remote }) => {
        if (!active || !remote.updatedAt || remote.updatedAt === remoteUpdatedAt.current || window.document.activeElement?.closest(".loop-rich-text-editor") || window.document.activeElement === titleRef.current) return;
        remoteUpdatedAt.current = remote.updatedAt;
        setContent(remote.content || "");
        setTitle(remote.title || "Untitled");
      }).catch(() => {});
      void requestJson<{ comments: LoopComment[] }>(`/api/notes/documents/${documentId}/comments`).then(({ comments: rows }) => { if (active) setComments(rows); }).catch(() => {});
    };
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [documentId]);
  const share = useCallback(async () => {
    if (!document) return;
    let token = document.shareToken;
    if (!token) { const { document: updated } = await requestJson<{ document: LoopDocument }>(`/api/notes/documents/${document.id}`, { method: "PATCH", body: JSON.stringify({ share: true }) }); token = updated.shareToken; await refresh(); }
    setShareUrl(`${window.location.origin}/notes/shared/${token}`);
  }, [document, refresh]);
  useEffect(() => {
    if (!workspace || !document) return;
    setWorkspaceHeader(<>
      <Link href="/trader-notes" aria-label="Back to workspaces" className="shrink-0"><ArrowLeft size={14} className="text-gray-400" /></Link>
      <Link href={`/trader-notes/workspace/${workspace.id}`} className="max-w-[30%] truncate text-xs text-gray-500 hover:text-gray-900">{workspace.title}</Link>
      <span className="text-gray-300">/</span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-800">{document.title}</span>
      <div className="flex shrink-0 items-center gap-1">
        <span className="mr-2 hidden text-[11px] text-gray-500 sm:inline-flex"><Check size={12} className="mr-1 text-emerald-600"/>{saveState}</span>
        <button onClick={() => void share()} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs hover:bg-gray-100"><Share2 size={14}/>Share</button>
        <button onClick={() => setShowComments((value) => !value)} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs hover:bg-gray-100"><MessageSquare size={14}/>{comments.length}</button>
        <button onClick={() => { void confirmAction({ title: "Delete this document?", description: `“${document.title}” will be permanently removed.`, confirmLabel: "Delete document" }).then((confirmed) => { if (confirmed) void deleteDocument(document).then(() => { showFeedback({ kind: "success", title: "Document deleted", description: `“${document.title}” was removed.` }); router.push(`/trader-notes/workspace/${workspace.id}`); }).catch((error) => showFeedback({ kind: "failure", title: "Document wasn’t deleted", description: error instanceof Error ? error.message : "Please try again." })); }); }} aria-label="Delete document" className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={14}/></button>
      </div>
    </>);
    return () => setWorkspaceHeader(null);
  }, [workspace, document, saveState, comments.length, share, deleteDocument, router, setWorkspaceHeader, confirmAction, showFeedback]);
  if (loading) return <div className="flex-1 animate-pulse bg-white"/>;
  if (!workspace || !document) return <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Document not found.</div>;
  const addComment = async () => {
    if (!commentDraft.trim()) return;
    try { const { comment } = await requestJson<{ comment: LoopComment }>(`/api/notes/documents/${document.id}/comments`, { method: "POST", body: JSON.stringify({ body: commentDraft.trim() }) }); setComments((rows) => [...rows, comment]); setCommentDraft(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to add comment"); }
  };
  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData(); form.append("file", file);
    try { const { url } = await requestJson<{ url: string }>(`/api/notes/documents/${document.id}/uploads`, { method: "POST", body: form }); return url; }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to upload image"); return ""; }
  };
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white text-gray-900">
    {error && <div className="mx-5 mt-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-2 text-xs text-red-700">{error}<button onClick={() => setError("")}><X size={14}/></button></div>}
    <div className="mx-auto flex max-w-6xl"><article className="min-w-0 flex-1 px-5 py-8 sm:px-10"><div className="group relative mb-5 h-40 rounded-lg bg-gray-100 bg-cover bg-center sm:h-52" style={document.coverImageUrl ? { backgroundImage: `url("${document.coverImageUrl}")` } : undefined}><button onClick={() => { const url = window.prompt("Paste a document cover image URL", document.coverImageUrl || ""); if (url !== null) void updateDocument(document.id, { coverImageUrl: url || null }); }} className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-2 text-xs opacity-0 shadow transition group-hover:opacity-100"><ImagePlus size={13}/>Update cover</button></div><input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document Name" className="mb-3 w-full bg-transparent text-3xl font-bold outline-none placeholder:text-gray-300 sm:text-4xl"/><div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500"><label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2 py-1">{document.emoji || "🙂"}<select aria-label="Document emoji" className="bg-transparent" value={document.emoji || ""} onChange={(e) => void updateDocument(document.id, { emoji: e.target.value || null })}><option value="">Emoji</option>{["📝","📈","📊","💡","📚","🎯","🧠","💹","🔍","✅","⚠️","🗓️"].map((emoji) => <option key={emoji}>{emoji}</option>)}</select></label><span>Changes save automatically</span></div><div className="mb-2 flex items-center justify-between border-y border-gray-200 py-1"><button onClick={() => setShowTemplates(true)} className="rounded px-2 py-1 text-xs text-violet-700 hover:bg-violet-50">Prompt gallery</button><button onClick={() => setPreview((value) => !value)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">{preview ? "Edit" : "Preview"}</button></div>{preview ? <MarkdownPreview content={content}/> : <LoopRichTextEditor content={content} onChange={(markdown) => { setContent(markdown); setSaveState("Unsaved"); }} onImageUpload={uploadImage}/>}</article>
      {showComments && <aside className="flex w-[300px] shrink-0 flex-col border-l border-gray-200 bg-[#fafafa]"><div className="flex items-center justify-between border-b border-gray-200 px-4 py-3"><span className="text-sm font-medium">Comments</span><button onClick={() => setShowComments(false)}><X size={15}/></button></div><div className="flex-1 space-y-3 overflow-y-auto p-3">{comments.map((comment) => <div key={comment.id} className="rounded-lg border border-gray-200 bg-white p-3"><div className="flex justify-between text-[11px] font-medium"><span>{comment.authorName}</span><span className="font-normal text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-gray-600">{comment.body}</p></div>)}{!comments.length && <p className="py-8 text-center text-xs text-gray-500">Be the first to leave a comment.</p>}</div><div className="border-t border-gray-200 p-3"><textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} rows={3} placeholder="Write a comment…" className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none"/><button onClick={() => void addComment()} disabled={!commentDraft.trim()} className="mt-2 w-full rounded-lg bg-violet-600 py-2 text-xs font-medium text-white disabled:opacity-40">Comment</button></div></aside>}
    </div>
    {shareUrl && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShareUrl(""); }}><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Share link</h2><p className="mt-1 text-sm text-gray-500">Anyone with this link can view this document.</p></div><button onClick={() => setShareUrl("")}><X size={16}/></button></div><div className="mt-5 flex gap-2"><input readOnly value={shareUrl} className="h-9 min-w-0 flex-1 rounded-md border border-gray-200 px-2 text-xs"/><button onClick={() => void navigator.clipboard.writeText(shareUrl)} className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-3 text-xs text-white"><Copy size={13}/>Copy</button></div><button onClick={async () => { await requestJson(`/api/notes/documents/${document.id}`, { method: "PATCH", body: JSON.stringify({ share: false }) }); await refresh(); setShareUrl(""); }} className="mt-4 text-xs text-red-600 hover:underline">Stop sharing</button></div></div>}
    {showTemplates && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowTemplates(false); }}><section role="dialog" aria-modal="true" aria-labelledby="loop-template-title" className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-gray-200 px-5 py-4"><div><h2 id="loop-template-title" className="font-semibold">Prompt gallery</h2><p className="mt-1 text-xs text-gray-500">Choose a trading template for this document.</p></div><button onClick={() => setShowTemplates(false)} aria-label="Close prompt gallery"><X size={16}/></button></div><div className="grid max-h-[65vh] gap-3 overflow-y-auto p-4 sm:grid-cols-2">{noteTemplates.map((template) => <button key={template.title} onClick={() => { setTitle(template.title); setContent(template.content); void updateDocument(document.id, { title: template.title, content: template.content, emoji: template.emoji }); setShowTemplates(false); setPreview(false); }} className="flex min-h-28 flex-col items-start rounded-lg border border-gray-200 p-4 text-left hover:border-violet-300 hover:bg-violet-50/40"><span className="text-2xl">{template.emoji}</span><span className="mt-3 text-sm font-medium">{template.title}</span><span className="mt-1 text-xs text-gray-500">Add a ready-to-fill trading note</span></button>)}</div></section></div>}
  </div>;
}

function MarkdownPreview({ content }: { content: string }) {
  return <div className="min-h-[55vh] border-b border-gray-200 px-3 py-4 text-sm leading-7">
    {content.split("\n").map((line, index) => {
      const key = `${index}-${line}`;
      if (!line.trim()) return <div key={key} className="h-3"/>;
      if (line.startsWith("### ")) return <h3 key={key} className="mb-2 mt-5 text-base font-semibold">{line.slice(4)}</h3>;
      if (line.startsWith("## ")) return <h2 key={key} className="mb-2 mt-6 text-lg font-semibold">{line.slice(3)}</h2>;
      if (line.startsWith("# ")) return <h1 key={key} className="mb-3 mt-2 text-2xl font-semibold">{line.slice(2)}</h1>;
      if (line.startsWith("> ")) return <blockquote key={key} className="my-2 border-l-2 border-violet-400 pl-4 text-gray-600">{line.slice(2)}</blockquote>;
      if (/^[-*] \[[ xX]\] /.test(line)) return <p key={key} className="pl-3 text-gray-600">☐ {line.slice(6)}</p>;
      if (/^[-*] /.test(line)) return <p key={key} className="pl-3 text-gray-600">• {line.slice(2)}</p>;
      if (/^\d+\. /.test(line)) return <p key={key} className="pl-3 text-gray-600">{line}</p>;
      if (line.startsWith("![") && line.includes("](")) return <p key={key} className="my-2 text-xs text-gray-500">{line.match(/^!\[([^\]]*)\]/)?.[1] || "Image"}</p>;
      if (line.startsWith("|")) return <p key={key} className="border-b border-gray-100 px-2 py-1 font-mono text-xs">{line}</p>;
      return <p key={key}>{line}</p>;
    })}
  </div>;
}


