import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createNoteWorkspace, listNoteWorkspaces } from "@/lib/db/notes";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ workspaces: await listNoteWorkspaces(session.user.id) });
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: "Unable to load notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title, emoji, coverImageUrl } = await request.json();
    if (typeof title !== "string" || !title.trim()) return NextResponse.json({ error: "Workspace title is required" }, { status: 400 });
    const workspace = await createNoteWorkspace(session.user.id, title.trim().slice(0, 160), typeof emoji === "string" ? emoji.slice(0, 32) : null, typeof coverImageUrl === "string" ? coverImageUrl.slice(0, 2000) : null);
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: "Unable to create workspace" }, { status: 500 });
  }
}
