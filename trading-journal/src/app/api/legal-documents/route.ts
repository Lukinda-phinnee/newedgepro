import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

const allowedSlugs = ["terms-of-service", "privacy-policy", "risk-policy", "cookie-policy"];

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug || !allowedSlugs.includes(slug)) return NextResponse.json({ error: "Policy page not found." }, { status: 404 });

  try {
    const rows = await sql`SELECT slug, title, body, updated_at FROM legal_documents WHERE slug = ${slug} LIMIT 1`;
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "This policy hasn’t been configured yet." }, { status: 404 });
    return NextResponse.json({ slug: row.slug, title: row.title, body: row.body, updatedAt: row.updated_at });
  } catch (error) {
    console.error("[legal-documents] Failed to load policy", error);
    return NextResponse.json({ error: "Couldn’t load this policy." }, { status: 500 });
  }
}
