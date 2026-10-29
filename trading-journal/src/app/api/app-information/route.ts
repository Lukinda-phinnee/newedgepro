import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Please sign in to view app information." }, { status: 401 });

    const rows = await sql`SELECT app_name, description, version, environment, support_email, website_url, privacy_url, terms_url, updated_at FROM app_information WHERE id = 1 LIMIT 1`;
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "App information hasn’t been configured yet." }, { status: 404 });
    const legalDocuments = await sql`SELECT slug, title FROM legal_documents ORDER BY CASE slug WHEN 'terms-of-service' THEN 1 WHEN 'privacy-policy' THEN 2 WHEN 'risk-policy' THEN 3 WHEN 'cookie-policy' THEN 4 ELSE 5 END, title`;

    return NextResponse.json({
      name: row.app_name,
      description: row.description,
      version: row.version,
      environment: row.environment,
      supportEmail: row.support_email,
      websiteUrl: row.website_url,
      privacyUrl: row.privacy_url,
      termsUrl: row.terms_url,
      updatedAt: row.updated_at,
      legalDocuments: legalDocuments.map((document) => ({ slug: document.slug, title: document.title })),
    });
  } catch (error) {
    console.error("[app-information] Failed to load app information", error);
    return NextResponse.json({ error: "Couldn’t load app information." }, { status: 500 });
  }
}
