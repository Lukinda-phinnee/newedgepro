import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserTrades, createTrade } from "@/lib/db/trades";
import { generateSampleTrades } from "@/lib/demo-trades";


export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || undefined;

    let trades = await getUserTrades(session.user.id, accountId);

    // If user has no trades yet, provide sample trades for the requested account
    if (trades.length === 0 && accountId) {
      trades = generateSampleTrades(accountId, session.user.id);
    }

    return NextResponse.json({ trades });
  } catch (error) {
    console.error("GET /api/trades error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trades" },
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

    const body = await request.json();
    const {
      accountId,
      symbol,
      side,
      entryPrice,
      exitPrice,
      quantity,
      stopLoss,
      takeProfit,
      pnl,
      pnlPercentage,
      status,
      strategy,
      marketSession,
      marketCondition,
      confidence,
      plannedEntry,
      notes,
      openedAt,
      closedAt,
      reviewStatus,
      reviewedAt,
      executionGrade,
      reviewRating,
      followedRules,
      mistakeTags,
      whatWentWell,
      whatToImprove,
      lessonsLearned,
      reviewNotes,
      screenshots,
    } = body;

    if (!accountId || !symbol || !side || entryPrice === undefined || quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields (accountId, symbol, side, entryPrice, quantity)" },
        { status: 400 },
      );
    }

    const newTrade = await createTrade(session.user.id, {
      accountId,
      symbol,
      side,
      entryPrice: Number(entryPrice),
      exitPrice: exitPrice ? Number(exitPrice) : null,
      quantity: Number(quantity),
      stopLoss: stopLoss ? Number(stopLoss) : null,
      takeProfit: takeProfit ? Number(takeProfit) : null,
      pnl: pnl !== undefined ? Number(pnl) : undefined,
      pnlPercentage: pnlPercentage !== undefined ? Number(pnlPercentage) : undefined,
      status: status || "closed",
      strategy: strategy || null,
      marketSession: marketSession || null,
      marketCondition: marketCondition || null,
      confidence: confidence ? Number(confidence) : null,
      plannedEntry: plannedEntry ? Number(plannedEntry) : null,
      notes: notes || null,
      openedAt: openedAt || new Date().toISOString(),
      closedAt: closedAt || null,
      reviewStatus: reviewStatus || "unreviewed",
      reviewedAt: reviewedAt || null,
      executionGrade: executionGrade || null,
      reviewRating: reviewRating ? Number(reviewRating) : null,
      followedRules: followedRules || null,
      mistakeTags: Array.isArray(mistakeTags) ? mistakeTags : null,
      whatWentWell: whatWentWell || null,
      whatToImprove: whatToImprove || null,
      lessonsLearned: lessonsLearned || null,
      reviewNotes: reviewNotes || null,
      screenshots: Array.isArray(screenshots) ? screenshots : [],
    });

    // Evaluate closed trade against active rules and record any violations
    if (newTrade && newTrade.status === "closed") {
      try {
        const { RuleService } = await import("@/lib/services/rule-service");
        await RuleService.postTradeEvaluate(session.user.id, {
          id: newTrade.id,
          accountId: newTrade.accountId,
          symbol: newTrade.symbol,
          entryPrice: newTrade.entryPrice,
          exitPrice: newTrade.exitPrice,
          pnl: newTrade.pnl,
          quantity: newTrade.quantity,
          stopLoss: newTrade.stopLoss,
          takeProfit: newTrade.takeProfit,
        });
      } catch (err) {
        console.warn("Post-trade rule evaluation warning:", err);
      }
    }

    return NextResponse.json({ trade: newTrade }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trades error:", error);
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 },
    );
  }
}

