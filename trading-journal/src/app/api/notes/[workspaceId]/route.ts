import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { deleteNoteWorkspace, updateNoteWorkspace } from "@/lib/db/notes";

type Context = { params: Promise<{ workspaceId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { workspaceId } = await params;
    const workspace = await updateNoteWorkspace(session.user.id, workspaceId, await request.json());
    return workspace ? NextResponse.json({ workspace }) : NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  } catch (error) {
    console.error("PATCH /api/notes/[workspaceId] error:", error);
    return NextResponse.json({ error: "Unable to update workspace" }, { status: 500 });
  }
}
export async function DELETE(_: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { workspaceId } = await params;
    return await deleteNoteWorkspace(session.user.id, workspaceId)
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  } catch (error) {
    console.error("DELETE /api/notes/[workspaceId] error:", error);
    return NextResponse.json({ error: "Unable to delete workspace" }, { status: 500 });
  }
}
