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

    // Evaluate trade intent against active rule set
    let ruleVerdict: "ACCEPT" | "WARN" | "BLOCK" = "ACCEPT";
    let ruleViolationsCount = 0;
    let ruleEvaluation: any = null;

    try {
      const { RuleService } = await import("@/lib/services/rule-service");
      const evalResult = await RuleService.evaluateAndRecordTrade(
        session.user.id,
        accountId,
        {
          symbol: String(symbol).toUpperCase(),
          side: side as "long" | "short",
          entryPrice: Number(entryPrice),
          exitPrice: exitPrice ? Number(exitPrice) : null,
          quantity: Number(quantity),
          stopLoss: stopLoss ? Number(stopLoss) : null,
          takeProfit: takeProfit ? Number(takeProfit) : null,
          marketSession: marketSession || null,
          marketCondition: marketCondition || null,
          pnl: pnl !== undefined ? Number(pnl) : null,
          openedAt: openedAt || new Date().toISOString(),
        },
      );

      ruleVerdict = evalResult.verdict;
      ruleViolationsCount = evalResult.triggeredRules.length;
      ruleEvaluation = evalResult;
    } catch (evalErr) {
      console.warn("Rule evaluation prior to trade creation error:", evalErr);
    }

    const resolvedFollowedRules =
      followedRules ||
      (ruleVerdict === "ACCEPT" ? "yes" : ruleVerdict === "WARN" ? "partial" : "no");

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
      followedRules: resolvedFollowedRules,
      mistakeTags: Array.isArray(mistakeTags) ? mistakeTags : null,
      whatWentWell: whatWentWell || null,
      whatToImprove: whatToImprove || null,
      lessonsLearned: lessonsLearned || null,
      reviewNotes: reviewNotes || null,
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      ruleVerdict,
      ruleViolationsCount,
      ruleEvaluation,
    });

    // Record violation records linked to the new trade ID
    if (newTrade && ruleEvaluation && ruleEvaluation.triggeredRules && ruleEvaluation.triggeredRules.length > 0) {
      try {
        const { recordViolation } = await import("@/lib/db/rules");
        for (const trig of ruleEvaluation.triggeredRules) {
          await recordViolation(session.user.id, {
            accountId: newTrade.accountId,
            ruleId: trig.ruleId?.startsWith("sys-") ? null : trig.ruleId,
            tradeId: newTrade.id,
            violationName: trig.ruleName,
            ruleType: (trig.ruleCategory || "RISK").toUpperCase(),
            severity: trig.severity,
            actionTaken: trig.consequence,
            metadata: {
              metric: trig.metric,
              threshold: trig.threshold,
              actualValue: trig.actualValue,
              message: trig.message,
              tradeSymbol: newTrade.symbol,
              consequence: trig.consequence,
            },
          });
        }
      } catch (err) {
        console.warn("Post-trade violation recording warning:", err);
      }
    }

    return NextResponse.json({ trade: newTrade, evaluation: ruleEvaluation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trades error:", error);
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 },
    );
  }
}

