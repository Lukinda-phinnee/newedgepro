import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { listPlanChatSessions, createPlanChatSession } from "@/lib/db/plan-chats";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chats = await listPlanChatSessions(session.user.id);
    return NextResponse.json({ chats });
  } catch (error) {
    console.error("GET /api/plans/copilot/chats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title : undefined;
    const planId = typeof body.planId === "string" ? body.planId : undefined;

    const chatSession = await createPlanChatSession(session.user.id, title, planId);
    return NextResponse.json({ session: chatSession }, { status: 201 });
  } catch (error) {
    console.error("POST /api/plans/copilot/chats error:", error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 }
    );
  }
}

