import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { setDefaultTradingAccount } from "@/lib/db/accounts";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const { id } = await params;
    await setDefaultTradingAccount(session.user.id, id);

    return NextResponse.json({ success: true, defaultAccountId: id });
  } catch (error) {
    console.error("[accounts] Failed to set default account", error);
    return NextResponse.json({ error: "Failed to set default account." }, { status: 500 });
  }
}
