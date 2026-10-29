import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { getRuleSetById } from "@/lib/db/rules";
import { deleteRule, saveRule, toggleRuleActive } from "@/lib/db/rules";

async function ruleBelongsToUser(ruleSetId: string, ruleId: string, userId: string) {
  const rows = await sql`
    SELECT rule.id
    FROM rules rule
    JOIN rule_sets rule_set ON rule_set.id = rule.rule_set_id
    WHERE rule.id = ${ruleId} AND rule_set.id = ${ruleSetId} AND rule_set.user_id = ${userId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleSetId: string; ruleId: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ruleSetId, ruleId } = await params;
    if (!(await getRuleSetById(ruleSetId, session.user.id)) || !(await ruleBelongsToUser(ruleSetId, ruleId, session.user.id))) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    const body = await request.json();

    if (body.isActive !== undefined && Object.keys(body).length === 1) {
      // Fast toggle
      const toggled = await toggleRuleActive(ruleSetId, ruleId, session.user.id, Boolean(body.isActive));
      if (!toggled) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
      return NextResponse.json({ rule: toggled });
    }

    // Full rule update
    const updated = await saveRule(ruleSetId, session.user.id, {
      ...body,
      id: ruleId,
    });

    return NextResponse.json({ rule: updated });
  } catch (error) {
    console.error("PATCH /api/rules/sets/:ruleSetId/rules/:ruleId error:", error);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleSetId: string; ruleId: string }> },
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ruleId } = await params;
    const { ruleSetId } = await params;
    if (!(await getRuleSetById(ruleSetId, session.user.id)) || !(await ruleBelongsToUser(ruleSetId, ruleId, session.user.id))) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    const deleted = await deleteRule(ruleSetId, ruleId, session.user.id);
    if (!deleted) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/rules/sets/:ruleSetId/rules/:ruleId error:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
