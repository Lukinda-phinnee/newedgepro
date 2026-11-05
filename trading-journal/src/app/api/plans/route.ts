import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getUserTradingPlans,
  createTradingPlan,
  updateTradingPlan,
  deleteTradingPlan,
} from "@/lib/db/plans";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await getUserTradingPlans(session.user.id);
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("GET /api/plans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trading plans" },
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

    const body = await request.json();
    const plan = await createTradingPlan(session.user.id, {
      title: body.title,
      sessionTag: body.sessionTag,
      summary: body.summary,
      content: body.content,
      accountId: body.accountId,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("POST /api/plans error:", error);
    return NextResponse.json(
      { error: "Failed to create trading plan" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
    }

    const plan = await updateTradingPlan(session.user.id, body.id, {
      title: body.title,
      sessionTag: body.sessionTag,
      summary: body.summary,
      content: body.content,
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("PATCH /api/plans error:", error);
    return NextResponse.json(
      { error: "Failed to update trading plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
    }

    const success = await deleteTradingPlan(session.user.id, id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("DELETE /api/plans error:", error);
    return NextResponse.json(
      { error: "Failed to delete trading plan" },
      { status: 500 }
    );
  }
}

