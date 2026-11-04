import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { propfirmSchema } from "@/lib/validations/propfirm-tracker";

async function currentUserId() {
  const { data: session } = await auth.getSession();
  return session?.user?.id ?? null;
}

export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please sign in to view prop firms." }, { status: 401 });
    const rows = await sql`
      SELECT id, name, evaluation_type, phases, logo_data, created_at, updated_at
      FROM propfirms WHERE user_id = ${userId} ORDER BY created_at ASC, id ASC
    `;
    const firms = rows.map((row) => ({
      id: String(row.id), name: row.name, evaluation: row.evaluation_type,
      phases: row.phases, logo: row.logo_data, createdAt: row.created_at,
    }));
    return NextResponse.json({ firms });
  } catch (error) {
    console.error("[propfirms] Failed to get prop firms", error);
    return NextResponse.json({ error: "We couldn’t load your prop firms right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please sign in to add a prop firm." }, { status: 401 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "The prop firm details are invalid." }, { status: 400 }); }
    const parsed = propfirmSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Check the firm name, phase rules, and logo and try again." }, { status: 400 });
    const values = parsed.data;
    const rows = await sql`
      INSERT INTO propfirms (user_id, name, evaluation_type, phases, logo_data)
      VALUES (${userId}, ${values.name}, ${values.evaluation}, ${JSON.stringify(values.phases)}::jsonb, ${values.logo})
      RETURNING id, name, evaluation_type, phases, logo_data, tracker_data, created_at
    `;
    const row = rows[0];
    return NextResponse.json({ firm: { id: String(row.id), name: row.name, evaluation: row.evaluation_type, phases: row.phases, logo: row.logo_data, trackerData: row.tracker_data, createdAt: row.created_at } }, { status: 201 });
  } catch (error) {
    console.error("[propfirms] Failed to create prop firm", error);
    return NextResponse.json({ error: "We couldn’t add that prop firm right now." }, { status: 500 });
  }
}

