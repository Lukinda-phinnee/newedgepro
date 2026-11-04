import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { trackerDataSchema } from "@/lib/validations/propfirm-tracker";
import type { PropfirmTrackerData } from "@/types/propfirm-tracker";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Please sign in to open this tracker." }, { status: 401 });
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "That prop firm could not be found." }, { status: 404 });
    const rows = await sql`SELECT tracker_data FROM propfirms WHERE id = ${id}::uuid AND user_id = ${session.user.id} LIMIT 1`;
    if (rows.length === 0) return NextResponse.json({ error: "That prop firm could not be found." }, { status: 404 });
    return NextResponse.json({ trackerData: rows[0].tracker_data });
  } catch (error) {
    console.error("[propfirms] Failed to get tracker data", error);
    return NextResponse.json({ error: "We couldn’t load this tracker right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Please sign in to update this tracker." }, { status: 401 });
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "That prop firm could not be found." }, { status: 404 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "The tracker settings are invalid." }, { status: 400 }); }
    const parsed = z.object({ trackerData: trackerDataSchema }).strict().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Check the tracker settings and trade entries and try again." }, { status: 400 });
    const trackerData = parsed.data.trackerData as PropfirmTrackerData;
    const rows = await sql`
      UPDATE propfirms SET tracker_data = ${JSON.stringify(trackerData)}::jsonb, updated_at = NOW()
      WHERE id = ${id}::uuid AND user_id = ${session.user.id}
      RETURNING id
    `;
    if (rows.length === 0) return NextResponse.json({ error: "That prop firm could not be found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[propfirms] Failed to update tracker data", error);
    return NextResponse.json({ error: "We couldn’t save this tracker right now." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Please sign in to remove a prop firm." }, { status: 401 });
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "That prop firm could not be found." }, { status: 404 });
    const deleted = await sql`DELETE FROM propfirms WHERE id = ${id}::uuid AND user_id = ${session.user.id} RETURNING id`;
    if (deleted.length === 0) return NextResponse.json({ error: "That prop firm could not be found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[propfirms] Failed to delete prop firm", error);
    return NextResponse.json({ error: "We couldn’t remove that prop firm right now." }, { status: 500 });
  }
}
