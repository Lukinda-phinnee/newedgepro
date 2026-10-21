import { NextRequest, NextResponse } from "next/server";
import { deleteRuleSet, getRuleSetById, updateRuleSet } from "@/lib/db/rules";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ruleSetId: string }> },
) {
  try {
    const { ruleSetId } = await params;
    const ruleSet = await getRuleSetById(ruleSetId);

    if (!ruleSet) {
      return NextResponse.json({ error: "Rule set not found" }, { status: 404 });
    }

    return NextResponse.json({ ruleSet });
  } catch (error) {
    console.error("GET /api/rules/sets/:ruleSetId error:", error);
    return NextResponse.json({ error: "Failed to fetch rule set" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleSetId: string }> },
) {
  try {
    const { ruleSetId } = await params;
    const body = await request.json();

    const updated = await updateRuleSet(ruleSetId, body);
    if (!updated) {
      return NextResponse.json({ error: "Rule set not found" }, { status: 404 });
    }

    return NextResponse.json({ ruleSet: updated });
  } catch (error) {
    console.error("PATCH /api/rules/sets/:ruleSetId error:", error);
    return NextResponse.json({ error: "Failed to update rule set" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleSetId: string }> },
) {
  try {
    const { ruleSetId } = await params;
    await deleteRuleSet(ruleSetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/rules/sets/:ruleSetId error:", error);
    return NextResponse.json({ error: "Failed to delete rule set" }, { status: 500 });
  }
}
