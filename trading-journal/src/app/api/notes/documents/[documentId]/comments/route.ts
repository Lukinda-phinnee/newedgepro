import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { addNoteComment, listNoteComments } from "@/lib/db/notes";

type Context = { params: Promise<{ documentId: string }> };
export async function GET(_: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { documentId } = await params;
    return NextResponse.json({ comments: await listNoteComments(session.user.id, documentId) });
  } catch (error) {
    console.error("GET note comments error:", error);
    return NextResponse.json({ error: "Unable to load comments" }, { status: 500 });
  }
}
export async function POST(request: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { documentId } = await params;
    const { body } = await request.json();
    if (typeof body !== "string" || !body.trim()) return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    const comment = await addNoteComment(session.user.id, session.user.name || session.user.email, documentId, body.trim());
    return comment ? NextResponse.json({ comment }, { status: 201 }) : NextResponse.json({ error: "Document not found" }, { status: 404 });
  } catch (error) {
    console.error("POST note comment error:", error);
    return NextResponse.json({ error: "Unable to add comment" }, { status: 500 });
  }
}
