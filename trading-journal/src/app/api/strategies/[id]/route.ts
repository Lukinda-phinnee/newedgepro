import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  deleteStrategy,
  getStrategyById,
  updateStrategy,
} from "@/lib/db/strategies";
import type { UpdateStrategyInput } from "@/types/strategy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const strategy = await getStrategyById(id, session.user.id);
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error("GET /api/strategies/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategy" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateStrategyInput;

    const updated = await updateStrategy(id, session.user.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    return NextResponse.json({ strategy: updated });
  } catch (error) {
    console.error("PATCH /api/strategies/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update strategy" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteStrategy(id, session.user.id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("DELETE /api/strategies/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete strategy" },
      { status: 500 }
    );
  }
}
