import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createNoteDocument, listNoteDocuments } from "@/lib/db/notes";

type Context = { params: Promise<{ workspaceId: string }> };
export async function GET(_: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { workspaceId } = await params;
    return NextResponse.json({ documents: await listNoteDocuments(session.user.id, workspaceId) });
  } catch (error) {
    console.error("GET note documents error:", error);
    return NextResponse.json({ error: "Unable to load documents" }, { status: 500 });
  }
}
export async function POST(request: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { workspaceId } = await params;
    const body = await request.json();
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled";
    const document = await createNoteDocument(session.user.id, workspaceId, title, typeof body.emoji === "string" ? body.emoji.slice(0, 32) : null, typeof body.coverImageUrl === "string" ? body.coverImageUrl.slice(0, 2000) : null);
    return document ? NextResponse.json({ document }, { status: 201 }) : NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  } catch (error) {
    console.error("POST note documents error:", error);
    return NextResponse.json({ error: "Unable to create document" }, { status: 500 });
  }
}
