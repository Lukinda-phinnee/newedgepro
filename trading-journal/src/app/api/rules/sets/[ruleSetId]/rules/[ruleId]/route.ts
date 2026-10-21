import { NextRequest, NextResponse } from "next/server";
import { deleteRule, saveRule, toggleRuleActive } from "@/lib/db/rules";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleSetId: string; ruleId: string }> },
) {
  try {
    const { ruleSetId, ruleId } = await params;
    const body = await request.json();

    if (body.isActive !== undefined && Object.keys(body).length === 1) {
      // Fast toggle
      const toggled = await toggleRuleActive(ruleId, Boolean(body.isActive));
      return NextResponse.json({ rule: toggled });
    }

    // Full rule update
    const updated = await saveRule(ruleSetId, {
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
    const { ruleId } = await params;
    await deleteRule(ruleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/rules/sets/:ruleSetId/rules/:ruleId error:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
