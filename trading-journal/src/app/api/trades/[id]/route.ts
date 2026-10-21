import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { updateTrade, deleteTrade } from "@/lib/db/trades";


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await updateTrade(id, session.user.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({ trade: updated });
  } catch (error) {
    console.error("PATCH /api/trades/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update trade" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteTrade(id, session.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/trades/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete trade" },
      { status: 500 },
    );
  }
}
