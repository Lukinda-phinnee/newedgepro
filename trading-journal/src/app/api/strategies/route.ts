import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createStrategy, getUserStrategies } from "@/lib/db/strategies";
import type { CreateStrategyInput } from "@/types/strategy";

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || undefined;

    const strategies = await getUserStrategies(session.user.id, accountId);
    return NextResponse.json({ strategies });
  } catch (error) {
    console.error("GET /api/strategies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategies" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateStrategyInput;
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Strategy name is required" },
        { status: 400 },
      );
    }

    const strategy = await createStrategy(session.user.id, body);
    return NextResponse.json({ strategy }, { status: 201 });
  } catch (error) {
    console.error("POST /api/strategies error:", error);
    return NextResponse.json(
      { error: "Failed to create strategy" },
      { status: 500 },
    );
  }
}
