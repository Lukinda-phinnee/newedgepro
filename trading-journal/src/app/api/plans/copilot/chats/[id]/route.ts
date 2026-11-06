import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getPlanChatSessionWithMessages,
  updatePlanChatSessionTitle,
  deletePlanChatSession,
} from "@/lib/db/plan-chats";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing chat session id" }, { status: 400 });
    }

    const data = await getPlanChatSessionWithMessages(session.user.id, id);
    if (!data) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/plans/copilot/chats/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing chat session id" }, { status: 400 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const success = await updatePlanChatSessionTitle(session.user.id, id, title);
    if (!success) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    return NextResponse.json({ success, title });
  } catch (error) {
    console.error("PATCH /api/plans/copilot/chats/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update chat session title" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing chat session id" }, { status: 400 });
    }

    const success = await deletePlanChatSession(session.user.id, id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("DELETE /api/plans/copilot/chats/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete chat session" },
      { status: 500 }
    );
  }
}

