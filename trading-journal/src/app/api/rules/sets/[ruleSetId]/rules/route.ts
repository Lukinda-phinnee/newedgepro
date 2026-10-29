import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getRuleSetById, getRulesByRuleSetId, saveRule } from "@/lib/db/rules";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ruleSetId: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ruleSetId } = await params;
    if (!(await getRuleSetById(ruleSetId, session.user.id))) {
      return NextResponse.json({ error: "Rule set not found" }, { status: 404 });
    }
    const rules = await getRulesByRuleSetId(ruleSetId, session.user.id);
    return NextResponse.json({ rules });
  } catch (error) {
    console.error("GET /api/rules/sets/:ruleSetId/rules error:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ruleSetId: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ruleSetId } = await params;
    if (!(await getRuleSetById(ruleSetId, session.user.id))) {
      return NextResponse.json({ error: "Rule set not found" }, { status: 404 });
    }
    const body = await request.json();

    if (!body.ruleName || !body.condition || !body.comparisonOperator) {
      return NextResponse.json(
        { error: "Missing required rule parameters (ruleName, condition, comparisonOperator)" },
        { status: 400 },
      );
    }

    const saved = await saveRule(ruleSetId, session.user.id, {
      id: body.id,
      ruleName: body.ruleName,
      description: body.description,
      ruleType: body.ruleType || "RISK",
      ruleCategory: body.ruleCategory || "Risk",
      condition: body.condition,
      comparisonOperator: body.comparisonOperator,
      thresholdValue: body.thresholdValue,
      evaluationScope: body.evaluationScope || "TRADE",
      timeWindow: body.timeWindow,
      filters: body.filters,
      severity: body.severity || "HIGH",
      consequence: body.consequence || "BLOCK_TRADE",
      consequenceParams: body.consequenceParams,
      consequenceDuration: body.consequenceDuration ? Number(body.consequenceDuration) : null,
      exitCondition: body.exitCondition,
      userMessage: body.userMessage,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return NextResponse.json({ rule: saved }, { status: 201 });
  } catch (error) {
    console.error("POST /api/rules/sets/:ruleSetId/rules error:", error);
    return NextResponse.json({ error: "Failed to save rule" }, { status: 500 });
  }
}
