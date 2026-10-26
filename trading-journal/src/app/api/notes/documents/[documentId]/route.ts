import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { deleteNoteDocument, getNoteDocument, updateNoteDocument } from "@/lib/db/notes";

type Context = { params: Promise<{ documentId: string }> };
export async function GET(_: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { documentId } = await params;
    const document = await getNoteDocument(session.user.id, documentId);
    return document ? NextResponse.json({ document }) : NextResponse.json({ error: "Document not found" }, { status: 404 });
  } catch (error) {
    console.error("GET note document error:", error);
    return NextResponse.json({ error: "Unable to load document" }, { status: 500 });
  }
}
export async function PATCH(request: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { documentId } = await params;
    const document = await updateNoteDocument(session.user.id, documentId, await request.json());
    return document ? NextResponse.json({ document }) : NextResponse.json({ error: "Document not found" }, { status: 404 });
  } catch (error) {
    console.error("PATCH note document error:", error);
    return NextResponse.json({ error: "Unable to update document" }, { status: 500 });
  }
}
export async function DELETE(_: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { documentId } = await params;
    return await deleteNoteDocument(session.user.id, documentId)
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Document not found" }, { status: 404 });
  } catch (error) {
    console.error("DELETE note document error:", error);
    return NextResponse.json({ error: "Unable to delete document" }, { status: 500 });
  }
}
